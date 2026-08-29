import { ArticleBlock, ArticleDocument, WorkflowTask } from "./types";
import { getTemplate } from "./templates";

export function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function styleString(style?: ArticleBlock["style"]) {
  if (!style) return "";
  const allowed: Record<string, string> = {
    color: "color",
    fontSize: "font-size",
    fontWeight: "font-weight",
    textAlign: "text-align",
    backgroundColor: "background-color"
  };
  return Object.entries(style)
    .filter(([key]) => allowed[key])
    .map(([key, value]) => `${allowed[key]}:${typeof value === "number" && key === "fontSize" ? `${value}px` : String(value)}`)
    .join(";");
}

export function renderArticleHtml(
  document: ArticleDocument,
  task: WorkflowTask,
  remoteAssetUrls?: Record<string, string>
) {
  const theme = getTemplate(document.templateId).theme;
  const assetUrl = (assetId?: string) => {
    const asset = task.assets.find((item) => item.id === assetId);
    if (!asset) return "";
    return remoteAssetUrls?.[asset.id] || `/api/tasks/${task.id}/assets/${asset.id}`;
  };
  const renderBlock = (block: ArticleBlock) => {
    const custom = styleString(block.style);
    const content = escapeHtml(block.content);
    if (block.type === "lead") return `<section data-block-id="${block.id}" style="margin:24px 0;padding:18px 20px;background:${theme.secondary};border-left:3px solid ${theme.primary};font-size:16px;line-height:1.9;color:${theme.text};${custom}">${content}</section>`;
    if (block.type === "heading") return `<h2 data-block-id="${block.id}" style="margin:36px 0 18px;font-family:${theme.headingFont};font-size:21px;line-height:1.45;color:${theme.primary};font-weight:700;${custom}"><span style="display:inline-block;margin-right:9px;color:${theme.accent}">◆</span>${content}</h2>`;
    if (block.type === "quote") return `<blockquote data-block-id="${block.id}" style="margin:26px 8px;padding:2px 0 2px 18px;border-left:2px solid ${theme.accent};font-family:${theme.headingFont};font-size:17px;line-height:1.9;color:${theme.primary};${custom}">${content}</blockquote>`;
    if (block.type === "callout") return `<section data-block-id="${block.id}" style="margin:26px 0;padding:18px 20px;border:1px solid ${theme.accent};border-radius:${theme.radius}px;background:${theme.secondary};font-size:15px;line-height:1.85;color:${theme.text};${custom}">${content}</section>`;
    if (block.type === "divider") return `<p data-block-id="${block.id}" style="margin:34px auto;text-align:center;color:${theme.accent};letter-spacing:8px;${custom}">• • •</p>`;
    if (block.type === "image") {
      const src = assetUrl(block.assetId);
      return `<figure data-block-id="${block.id}" style="margin:28px 0;"><img src="${src}" alt="${escapeHtml(block.caption)}" style="display:block;width:100%;height:auto;border-radius:${theme.radius}px;" />${block.caption ? `<figcaption style="margin-top:9px;text-align:center;font-size:12px;line-height:1.6;color:${theme.muted};">${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
    }
    return `<p data-block-id="${block.id}" style="margin:0 0 18px;font-size:16px;line-height:1.95;letter-spacing:.04em;text-align:justify;color:${theme.text};${custom}">${content}</p>`;
  };
  return `<article style="box-sizing:border-box;max-width:677px;margin:0 auto;padding:28px 22px 48px;background:${theme.background};font-family:${theme.bodyFont};color:${theme.text};"><header style="margin:4px 0 32px;"><p style="margin:0 0 14px;font-size:11px;letter-spacing:.22em;color:${theme.accent};text-transform:uppercase;">WEFLOW · EDITORIAL</p><h1 style="margin:0;font-family:${theme.headingFont};font-size:28px;line-height:1.42;letter-spacing:.02em;color:${theme.primary};font-weight:700;">${escapeHtml(document.title)}</h1>${document.subtitle ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${theme.muted};">${escapeHtml(document.subtitle)}</p>` : ""}</header>${document.blocks.map(renderBlock).join("")}<footer style="margin-top:42px;padding-top:18px;border-top:1px solid ${theme.secondary};font-size:11px;letter-spacing:.12em;color:${theme.muted};text-align:center;">END</footer></article>`;
}
