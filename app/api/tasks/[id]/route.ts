import { NextResponse } from "next/server";
import { deleteTask, getTask, updateTask } from "@/lib/store";
import { TaskStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const task = await updateTask(id, (current) => ({
    ...current,
    name: typeof body.name === "string" ? body.name.slice(0, 80) : current.name,
    prompt: typeof body.prompt === "string" ? body.prompt.slice(0, 5000) : current.prompt,
    selectedTemplateId:
      typeof body.selectedTemplateId === "string" ? body.selectedTemplateId : current.selectedTemplateId,
    status: (typeof body.status === "string" ? body.status : current.status) as TaskStatus
  }));
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteTask(id);
  if (!deleted) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
