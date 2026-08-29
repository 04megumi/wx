import { NextResponse } from "next/server";
import crypto from "crypto";
import { reviseArticle } from "@/lib/deepseek";
import { getTask, updateTask } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const current = await getTask(id);
  if (!current) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  if (!current.document) return NextResponse.json({ error: "请先生成文章" }, { status: 400 });
  const body = await request.json();
  const instruction = String(body.instruction || "").trim();
  const targetBlockId = typeof body.targetBlockId === "string" ? body.targetBlockId : undefined;
  if (!instruction) return NextResponse.json({ error: "请输入修改要求" }, { status: 400 });

  try {
    const document = await reviseArticle(current, instruction, targetBlockId);
    const now = new Date().toISOString();
    const task = await updateTask(id, (item) => ({
      ...item,
      document,
      status: "editing",
      revisions: [
        ...item.revisions,
        { id: crypto.randomUUID(), prompt: instruction, targetBlockId, createdAt: now }
      ],
      versions: [
        ...item.versions,
        { id: crypto.randomUUID(), label: instruction.slice(0, 28), createdAt: now, document }
      ]
    }));
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "修改失败" },
      { status: 502 }
    );
  }
}
