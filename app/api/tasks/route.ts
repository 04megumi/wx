import { NextResponse } from "next/server";
import crypto from "crypto";
import { createTask, listTasks } from "@/lib/store";
import { parseUpload } from "@/lib/parser";
import { defaultPrompt } from "@/lib/templates";
import { WorkflowTask } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { tasks: await listTasks() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择一个 ZIP 压缩包" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "目前仅支持 ZIP 压缩包" }, { status: 400 });
  }
  const maxUploadMb = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 1024));
  if (file.size > maxUploadMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `压缩包不能超过 ${maxUploadMb}MB，可通过 MAX_UPLOAD_MB 调整` },
      { status: 413 }
    );
  }

  const id = crypto.randomUUID();
  try {
    const { parsed, assets } = await parseUpload(id, file);
    const now = new Date().toISOString();
    const task: WorkflowTask = {
      id,
      name: String(form.get("name") || parsed.title || file.name.replace(/\.zip$/i, "")),
      status: "parsed",
      createdAt: now,
      updatedAt: now,
      prompt: String(form.get("prompt") || defaultPrompt),
      parsed,
      assets,
      recommendations: [],
      revisions: [],
      versions: []
    };
    await createTask(task);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材解析失败" },
      { status: 400 }
    );
  }
}
