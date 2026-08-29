import { NextResponse } from "next/server";
import { fallbackRecommendations, recommendTemplates } from "@/lib/deepseek";
import { getTask, updateTask } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const current = await getTask(id);
  if (!current) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  let recommendations;
  let fallback = false;
  try {
    recommendations = await recommendTemplates(current);
    if (recommendations.length < 3) throw new Error("推荐结果不足");
  } catch (error) {
    console.error("Template recommendation failed:", error);
    recommendations = fallbackRecommendations();
    fallback = true;
  }

  const task = await updateTask(id, (item) => ({
    ...item,
    recommendations,
    selectedTemplateId: item.selectedTemplateId || recommendations[0]?.templateId,
    status: "template"
  }));
  return NextResponse.json({ task, fallback });
}
