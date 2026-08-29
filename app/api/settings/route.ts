import { NextResponse } from "next/server";
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getWorkspaceSettings(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.globalPrompt !== "string") {
    return NextResponse.json(
      { error: "全局提示词格式不正确" },
      { status: 400 },
    );
  }
  const globalPrompt = body.globalPrompt.trim().slice(0, 10000);
  if (!globalPrompt) {
    return NextResponse.json({ error: "全局提示词不能为空" }, { status: 400 });
  }
  return NextResponse.json(await saveWorkspaceSettings({ globalPrompt }));
}
