import { NextResponse } from "next/server";
import crypto from "crypto";
import { fallbackDocument, generateArticle } from "@/lib/deepseek";
import { getTask, updateTask } from "@/lib/store";
import { templates } from "@/lib/templates";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const current = await getTask(id);
  if (!current) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const templateId = String(body.templateId || current.selectedTemplateId || templates[0].id);
  if (!templates.some((template) => template.id === templateId)) {
    return NextResponse.json({ error: "模板不存在" }, { status: 400 });
  }

  let document;
  let fallback = false;
  try {
    document = await generateArticle(current, templateId);
    if (!document?.blocks?.length) throw new Error("生成内容为空");
  } catch (error) {
    console.error("Article generation failed:", error);
    document = fallbackDocument(current, templateId);
    fallback = true;
  }

  const now = new Date().toISOString();
  const task = await updateTask(id, (item) => ({
    ...item,
    selectedTemplateId: templateId,
    document,
    status: "editing",
    versions: [
      ...item.versions,
      { id: crypto.randomUUID(), label: "AI 初稿", createdAt: now, document }
    ]
  }));
  return NextResponse.json({ task, fallback });
}
