import { NextResponse } from "next/server";
import { createWechatDraft, isWechatConfigured } from "@/lib/wechat";
import { getTask, updateTask } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  if (!task.document) return NextResponse.json({ error: "请先生成文章" }, { status: 400 });
  if (!isWechatConfigured()) {
    return NextResponse.json(
      { error: "请先在 .env.local 配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET" },
      { status: 412 }
    );
  }

  try {
    const mediaId = await createWechatDraft(task);
    const syncedAt = new Date().toISOString();
    const updated = await updateTask(id, (current) => ({
      ...current,
      wechatDraft: { mediaId, syncedAt }
    }));
    return NextResponse.json({
      task: updated,
      mediaId,
      backendUrl: "https://mp.weixin.qq.com/"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "同步微信公众号失败" },
      { status: 502 }
    );
  }
}
