import "server-only";

import { ArticleDocument, Recommendation, WorkflowTask } from "./types";
import { getTemplate, templates } from "./templates";
import { retrieveStyleExamples } from "./rag";

type DeepSeekMessage = { role: "system" | "user"; content: string };

function parseJson<T>(content: string): T {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}

async function chat<T>(messages: DeepSeekMessage[]): Promise<T> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("未配置 DEEPSEEK_API_KEY");
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.45,
      max_tokens: 6000
    }),
    signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek 请求失败（${response.status}）：${detail.slice(0, 240)}`);
  }
  const data = await response.json();
  return parseJson<T>(data.choices?.[0]?.message?.content ?? "");
}

function taskContext(task: WorkflowTask) {
  return JSON.stringify({
    title: task.parsed.title,
    paragraphs: task.parsed.paragraphs,
    images: task.assets.map((asset, index) => ({ id: asset.id, order: index + 1, fileName: asset.name }))
  });
}

export async function recommendTemplates(task: WorkflowTask): Promise<Recommendation[]> {
  const history = await retrieveStyleExamples(task);
  const result = await chat<{ recommendations: Recommendation[] }>([
    {
      role: "system",
      content: `${task.prompt}\n你负责从给定模板中选出最匹配的5个。只输出JSON对象，格式为 {"recommendations":[{"templateId":"...","score":92,"reason":"20-45字中文理由"}]}。不能输出列表外的templateId，分数为0-100。`
    },
    {
      role: "user",
      content: `文章素材：${taskContext(task)}\n模板列表：${JSON.stringify(templates.map(({ id, name, category, description, tags }) => ({ id, name, category, description, tags })))}\n相似历史项目（仅作为风格偏好参考）：${JSON.stringify(history)}`
    }
  ]);
  return result.recommendations
    .filter((item) => templates.some((template) => template.id === item.templateId))
    .slice(0, 5);
}

export async function generateArticle(task: WorkflowTask, templateId: string): Promise<ArticleDocument> {
  const template = getTemplate(templateId);
  const history = await retrieveStyleExamples(task);
  const result = await chat<{ document: ArticleDocument }>([
    {
      role: "system",
      content: `${task.prompt}\n你必须只输出JSON。保持全部事实准确，不得补充素材中没有的日期、人物、数据或引语。对正文做编辑优化并划分层级。图片只能引用给定assetId。文档格式：{"document":{"title":"...","subtitle":"可选","author":"可选","templateId":"${template.id}","blocks":[{"id":"b-1","type":"lead|heading|paragraph|image|quote|callout|divider","content":"文字类型需要","assetId":"图片类型需要","caption":"可选"}]}}。每个id唯一。避免连续大量小标题，段落适合手机阅读。`
    },
    {
      role: "user",
      content: `所选模板：${JSON.stringify(template)}\n素材：${taskContext(task)}\n相似历史项目风格摘要：${JSON.stringify(history)}`
    }
  ]);
  result.document.templateId = template.id;
  return result.document;
}

export async function reviseArticle(
  task: WorkflowTask,
  instruction: string,
  targetBlockId?: string
): Promise<ArticleDocument> {
  if (!task.document) throw new Error("文章尚未生成");
  const targetRule = targetBlockId
    ? `只允许修改 id=${targetBlockId} 的区块，其他区块必须逐字、逐字段保持不变。`
    : "仅修改指令明确涉及的区块，其他内容保持不变。";
  const result = await chat<{ document: ArticleDocument }>([
    {
      role: "system",
      content: `你是微信公众号文章的精准修订助手。${targetRule} 不得改变事实。只输出JSON对象 {"document": 完整文档}。保留所有区块id；除非指令明确要求增删结构，否则不得添加或删除区块。style允许 color、fontSize、fontWeight、textAlign、backgroundColor。`
    },
    {
      role: "user",
      content: `用户指令：${instruction}\n当前文档：${JSON.stringify(task.document)}`
    }
  ]);
  result.document.templateId = task.document.templateId;
  return result.document;
}

export function fallbackRecommendations(): Recommendation[] {
  return templates.slice(0, 5).map((template, index) => ({
    templateId: template.id,
    score: 92 - index * 4,
    reason: `${template.category}结构清晰，适合新闻稿的移动端阅读与重点呈现。`
  }));
}

export function fallbackDocument(task: WorkflowTask, templateId: string): ArticleDocument {
  const body = task.parsed.paragraphs.slice(1);
  const blocks: ArticleDocument["blocks"] = [];
  if (body[0]) blocks.push({ id: "lead-1", type: "lead", content: body[0] });
  body.slice(1).forEach((paragraph, index) => {
    blocks.push({ id: `p-${index + 1}`, type: "paragraph", content: paragraph });
  });
  task.assets.forEach((asset, index) => {
    const insertAt = Math.min(blocks.length, 1 + index * 3);
    blocks.splice(insertAt, 0, { id: `img-${index + 1}`, type: "image", assetId: asset.id, caption: asset.name });
  });
  if (!body.length) blocks.push({ id: "p-1", type: "paragraph", content: task.parsed.title });
  return { title: task.parsed.title, templateId, blocks };
}
