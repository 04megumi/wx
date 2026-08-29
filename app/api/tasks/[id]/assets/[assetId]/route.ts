import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getTask, taskUploadDir } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string; assetId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id, assetId } = await context.params;
  const task = await getTask(id);
  const asset = task?.assets.find((item) => item.id === assetId);
  if (!task || !asset) return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  const absolute = path.join(taskUploadDir(id), asset.relativePath);
  if (!absolute.startsWith(taskUploadDir(id))) {
    return NextResponse.json({ error: "非法路径" }, { status: 400 });
  }
  try {
    const buffer = await fs.readFile(absolute);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": asset.mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "图片文件不存在" }, { status: 404 });
  }
}
