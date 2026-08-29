import "server-only";

import { ArticleDocument, Recommendation, WorkflowTask } from "./types";
import { getTemplate, templates } from "./templates";
import { retrieveReferenceCases, retrieveStyleExamples } from "./rag";
import { composeEditorialPrompt, getWorkspaceSettings } from "./settings";

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
  const baseUrl = (
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
  ).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.45,
      max_tokens: 6000,
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `DeepSeek 请求失败（${response.status}）：${detail.slice(0, 240)}`,
    );
  }
  const data = await response.json();
  return parseJson<T>(data.choices?.[0]?.message?.content ?? "");
}

function taskContext(task: WorkflowTask) {
  return JSON.stringify({
    title: task.parsed.title,
    paragraphs: task.parsed.paragraphs,
    images: task.assets.map((asset, index) => ({
      id: asset.id,
      order: index + 1,
      fileName: asset.name,
    })),
  });
}

export async function recommendTemplates(
  task: WorkflowTask,
  styleInstruction = "",
): Promise<Recommendation[]> {
  const settings = await getWorkspaceSettings();
  const editorialPrompt = composeEditorialPrompt(
    settings.globalPrompt,
    task.prompt,
  );
  const history = await retrieveStyleExamples(task);
  const references = retrieveReferenceCases(task, styleInstruction);
  const result = await chat<{ recommendations: Recommendation[] }>([
    {
      role: "system",
      content: `${editorialPrompt}\n你是微信公众号的AI版式导演。请把给定的10个模板全部排序，每个模板只能出现一次。它们的结构骨架必须保持不同，不能把版式建议退化成换色。只输出JSON对象，格式为 {"recommendations":[{"templateId":"...","score":92,"reason":"20-45字中文理由","layoutPlan":"说明首屏、章节、图片和结尾如何排","xiumiKeywords":["2-4个可在秀米检索的关键词"],"referenceIds":["采用的参考案例id"]}]}。不能输出列表外的templateId或参考id，分数为0-100。秀米关键词用于人工检索，不得声称已经从秀米抓取或导入模板。`,
    },
    {
      role: "user",
      content: `用户的版式要求：${styleInstruction || "未额外指定，请依据稿件内容判断"}\n文章素材：${taskContext(task)}\n10套结构模板：${JSON.stringify(templates.map(({ id, name, category, description, tags, layout, structure, xiumiKeywords, referenceIds }) => ({ id, name, category, description, tags, layout, structure, xiumiKeywords, referenceIds })))}\n从用户提供的公众号案例库召回的版式指纹：${JSON.stringify(references)}\n相似历史项目（仅作为风格偏好参考）：${JSON.stringify(history)}`,
    },
  ]);
  const seen = new Set<string>();
  const valid = result.recommendations
    .filter(
      (item) =>
        templates.some((template) => template.id === item.templateId) &&
        !seen.has(item.templateId) &&
        seen.add(item.templateId),
    )
    .map((item) => {
      const template = getTemplate(item.templateId);
      return {
        ...item,
        score: Math.max(0, Math.min(100, Number(item.score) || 0)),
        layoutPlan: item.layoutPlan || template.structure.join(" → "),
        xiumiKeywords:
          item.xiumiKeywords?.slice(0, 4) || template.xiumiKeywords,
        referenceIds:
          item.referenceIds
            ?.filter((id) =>
              references.some((reference) => reference.id === id),
            )
            .slice(0, 3) || template.referenceIds,
      };
    });
  const missing = fallbackRecommendations().filter(
    (item) => !seen.has(item.templateId),
  );
  return [...valid, ...missing].slice(0, 10);
}

export async function generateArticle(
  task: WorkflowTask,
  templateId: string,
): Promise<ArticleDocument> {
  const settings = await getWorkspaceSettings();
  const editorialPrompt = composeEditorialPrompt(
    settings.globalPrompt,
    task.prompt,
  );
  const template = getTemplate(templateId);
  const history = await retrieveStyleExamples(task);
  const references = retrieveReferenceCases(task, task.styleInstruction).filter(
    (reference) => template.referenceIds.includes(reference.id),
  );
  const result = await chat<{ document: ArticleDocument }>([
    {
      role: "system",
      content: `${editorialPrompt}\n你必须只输出JSON。保持全部事实准确，不得补充素材中没有的日期、人物、数据或引语。对正文做编辑优化并划分层级。图片只能引用给定assetId。文档格式：{"document":{"title":"...","subtitle":"可选","author":"可选","templateId":"${template.id}","blocks":[{"id":"b-1","type":"lead|heading|paragraph|image|quote|callout|divider","content":"文字类型需要","assetId":"图片类型需要","caption":"可选"}]}}。每个id唯一。避免连续大量小标题，段落适合手机阅读。普通正文段落不要手工添加全角空格，渲染器会统一处理2em首行缩进。文章末尾不要自行创建END正文区块，渲染器会统一添加模板化END标识。`,
    },
    {
      role: "user",
      content: `所选模板：${JSON.stringify(template)}\n必须落实的结构顺序：${template.structure.join(" → ")}\n相关参考案例的版式指纹：${JSON.stringify(references)}\n用户在模板阶段的要求：${task.styleInstruction || "无"}\n素材：${taskContext(task)}\n相似历史项目风格摘要：${JSON.stringify(history)}`,
    },
  ]);
  result.document.templateId = template.id;
  return result.document;
}

export async function reviseArticle(
  task: WorkflowTask,
  instruction: string,
  targetBlockId?: string,
): Promise<ArticleDocument> {
  if (!task.document) throw new Error("文章尚未生成");
  const settings = await getWorkspaceSettings();
  const editorialPrompt = composeEditorialPrompt(
    settings.globalPrompt,
    task.prompt,
  );
  const targetRule = targetBlockId
    ? `只允许修改 id=${targetBlockId} 的区块，其他区块必须逐字、逐字段保持不变。`
    : "仅修改指令明确涉及的区块，其他内容保持不变。";
  const result = await chat<{ document: ArticleDocument }>([
    {
      role: "system",
      content: `${editorialPrompt}\n你是微信公众号文章的精准修订助手。${targetRule} 不得改变事实。只输出JSON对象 {"document": 完整文档}。保留所有区块id；除非指令明确要求增删结构，否则不得添加或删除区块。style允许 color、fontSize、fontWeight、textAlign、backgroundColor。`,
    },
    {
      role: "user",
      content: `用户指令：${instruction}\n当前文档：${JSON.stringify(task.document)}`,
    },
  ]);
  result.document.templateId = task.document.templateId;
  return result.document;
}

export function fallbackRecommendations(): Recommendation[] {
  return templates.map((template, index) => ({
    templateId: template.id,
    score: Math.max(62, 92 - index * 3),
    reason: `${template.category}采用${template.structure.slice(0, 2).join("、")}，适合移动端重点呈现。`,
    layoutPlan: template.structure.join(" → "),
    xiumiKeywords: template.xiumiKeywords,
    referenceIds: template.referenceIds,
  }));
}

export function fallbackDocument(
  task: WorkflowTask,
  templateId: string,
): ArticleDocument {
  const body = task.parsed.paragraphs.slice(1);
  const blocks: ArticleDocument["blocks"] = [];
  if (body[0]) blocks.push({ id: "lead-1", type: "lead", content: body[0] });
  body.slice(1).forEach((paragraph, index) => {
    blocks.push({
      id: `p-${index + 1}`,
      type: "paragraph",
      content: paragraph,
    });
  });
  task.assets.forEach((asset, index) => {
    const insertAt = Math.min(blocks.length, 1 + index * 3);
    blocks.splice(insertAt, 0, {
      id: `img-${index + 1}`,
      type: "image",
      assetId: asset.id,
      caption: asset.name,
    });
  });
  if (!body.length)
    blocks.push({ id: "p-1", type: "paragraph", content: task.parsed.title });
  return { title: task.parsed.title, templateId, blocks };
}
