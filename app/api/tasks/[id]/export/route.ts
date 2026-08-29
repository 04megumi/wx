import { NextResponse } from "next/server";
import { getTask } from "@/lib/store";
import { renderArticleHtml } from "@/lib/article";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const task = await getTask(id);
  if (!task?.document) return NextResponse.json({ error: "文章尚未生成" }, { status: 404 });
  const article = renderArticleHtml(task.document, task);
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${task.document.title}</title></head><body style="margin:0;background:#f2f1ed;">${article}</body></html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="weflow-${id.slice(0, 8)}.html"`
    }
  });
}
