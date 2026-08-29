import "server-only";

import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { renderArticleHtml } from "./article";
import { taskUploadDir } from "./store";
import { WorkflowTask } from "./types";

type WechatError = { errcode?: number; errmsg?: string };

let tokenCache: { value: string; expiresAt: number } | undefined;

function credentials() {
  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error("微信公众号尚未配置，请在 .env.local 填写 WECHAT_APP_ID 和 WECHAT_APP_SECRET");
  }
  return { appId, appSecret };
}

function apiBase() {
  return "https://api.weixin.qq.com";
}

async function parseWechatResponse<T extends WechatError>(response: Response): Promise<T> {
  const raw = await response.text();
  let result: T;
  try {
    result = JSON.parse(raw) as T;
  } catch {
    throw new Error(`微信接口返回异常（${response.status}）`);
  }
  if (!response.ok || (result.errcode && result.errcode !== 0)) {
    throw new Error(`微信接口失败：${result.errmsg || response.status}${result.errcode ? `（${result.errcode}）` : ""}`);
  }
  return result;
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60_000) return tokenCache.value;
  const { appId, appSecret } = credentials();
  const response = await fetch(`${apiBase()}/cgi-bin/stable_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credential", appid: appId, secret: appSecret, force_refresh: false }),
    signal: AbortSignal.timeout(30_000)
  });
  const result = await parseWechatResponse<WechatError & { access_token?: string; expires_in?: number }>(response);
  if (!result.access_token) throw new Error("微信接口没有返回 access_token");
  tokenCache = {
    value: result.access_token,
    expiresAt: Date.now() + (result.expires_in || 7200) * 1000
  };
  return tokenCache.value;
}

async function compressJpeg(buffer: Buffer, maxBytes: number, maxWidth: number) {
  for (let quality = 84; quality >= 35; quality -= 7) {
    const output = await sharp(buffer)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (output.length <= maxBytes) return output;
  }
  const compact = await sharp(buffer)
    .rotate()
    .resize({ width: Math.min(600, maxWidth), withoutEnlargement: true })
    .jpeg({ quality: 32, mozjpeg: true })
    .toBuffer();
  if (compact.length > maxBytes) throw new Error("图片压缩后仍超过微信素材限制");
  return compact;
}

async function assetBuffer(task: WorkflowTask, assetId: string) {
  const asset = task.assets.find((item) => item.id === assetId);
  if (!asset) throw new Error("文章引用的图片素材不存在");
  return fs.readFile(path.join(taskUploadDir(task.id), asset.relativePath));
}

async function uploadBodyImage(token: string, buffer: Buffer, assetId: string) {
  const image = await compressJpeg(buffer, 950 * 1024, 1600);
  const form = new FormData();
  form.append("media", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), `${assetId}.jpg`);
  const response = await fetch(`${apiBase()}/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000)
  });
  const result = await parseWechatResponse<WechatError & { url?: string }>(response);
  if (!result.url) throw new Error("微信正文图片上传成功但没有返回 URL");
  return result.url;
}

async function uploadCover(token: string, buffer: Buffer) {
  const image = await compressJpeg(buffer, 60 * 1024, 900);
  const form = new FormData();
  form.append("media", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "cover.jpg");
  const response = await fetch(
    `${apiBase()}/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=thumb`,
    { method: "POST", body: form, signal: AbortSignal.timeout(60_000) }
  );
  const result = await parseWechatResponse<WechatError & { media_id?: string }>(response);
  if (!result.media_id) throw new Error("微信封面上传成功但没有返回 media_id");
  return result.media_id;
}

export function isWechatConfigured() {
  return Boolean(process.env.WECHAT_APP_ID?.trim() && process.env.WECHAT_APP_SECRET?.trim());
}

export async function createWechatDraft(task: WorkflowTask) {
  if (!task.document) throw new Error("文章尚未生成");
  const usedAssetIds = Array.from(
    new Set(task.document.blocks.filter((block) => block.type === "image" && block.assetId).map((block) => block.assetId!))
  );
  const coverAssetId = usedAssetIds[0] || task.assets[0]?.id;
  if (!coverAssetId) throw new Error("同步公众号草稿需要至少一张图片作为封面");

  const token = await getAccessToken();
  const remoteAssetUrls: Record<string, string> = {};
  for (const assetId of usedAssetIds) {
    remoteAssetUrls[assetId] = await uploadBodyImage(token, await assetBuffer(task, assetId), assetId);
  }
  const thumbMediaId = await uploadCover(token, await assetBuffer(task, coverAssetId));
  const content = renderArticleHtml(task.document, task, remoteAssetUrls);
  const firstText = task.document.blocks.find((block) => block.content)?.content || "";
  const response = await fetch(`${apiBase()}/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      articles: [{
        article_type: "news",
        title: task.document.title.slice(0, 64),
        author: (task.document.author || "").slice(0, 16),
        digest: (task.document.subtitle || firstText).slice(0, 54),
        content,
        thumb_media_id: thumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0
      }]
    }),
    signal: AbortSignal.timeout(60_000)
  });
  const result = await parseWechatResponse<WechatError & { media_id?: string }>(response);
  if (!result.media_id) throw new Error("微信草稿创建成功但没有返回 media_id");
  return result.media_id;
}
