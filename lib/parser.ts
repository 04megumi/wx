import "server-only";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import mammoth from "mammoth";
import { Asset, ParsedContent } from "./types";
import { taskUploadDir } from "./store";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const mimeMap: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp"
};

function safeName(name: string) {
  const base = path.basename(name).normalize("NFKC");
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 120) || "asset";
}

async function saveImage(
  taskId: string,
  name: string,
  buffer: Buffer,
  source: Asset["source"]
): Promise<Asset> {
  const ext = path.extname(name).toLowerCase();
  const id = crypto.randomUUID();
  const fileName = `${id}-${safeName(name)}`;
  const uploadDir = taskUploadDir(taskId);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return {
    id,
    name: safeName(name),
    mime: mimeMap[ext] ?? "application/octet-stream",
    size: buffer.length,
    relativePath: fileName,
    source
  };
}

export async function parseUpload(taskId: string, file: File) {
  const archiveBuffer = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(archiveBuffer);
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const docEntries = entries.filter((entry) =>
    [".docx", ".txt"].includes(path.extname(entry.entryName).toLowerCase())
  );

  if (!docEntries.length) {
    throw new Error("压缩包中没有找到 Word（.docx）或文本（.txt）文件");
  }

  const source = docEntries[0];
  const sourceBuffer = source.getData();
  let text = "";
  if (path.extname(source.entryName).toLowerCase() === ".docx") {
    const result = await mammoth.extractRawText({ buffer: sourceBuffer });
    text = result.value;
  } else {
    text = sourceBuffer.toString("utf8");
  }

  const paragraphs = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!paragraphs.length) throw new Error("文稿内容为空，无法解析正文");

  const assets: Asset[] = [];
  for (const entry of entries) {
    const ext = path.extname(entry.entryName).toLowerCase();
    if (imageExtensions.has(ext) && !entry.entryName.startsWith("__MACOSX/")) {
      assets.push(await saveImage(taskId, entry.entryName, entry.getData(), "zip"));
    }
  }

  if (!assets.length && path.extname(source.entryName).toLowerCase() === ".docx") {
    const docxZip = new AdmZip(sourceBuffer);
    for (const entry of docxZip.getEntries()) {
      const ext = path.extname(entry.entryName).toLowerCase();
      if (!entry.isDirectory && entry.entryName.startsWith("word/media/") && imageExtensions.has(ext)) {
        assets.push(await saveImage(taskId, entry.entryName, entry.getData(), "docx"));
      }
    }
  }

  const parsed: ParsedContent = {
    title: paragraphs[0].replace(/^[#\s]+/, "").slice(0, 80),
    paragraphs,
    wordCount: text.replace(/\s/g, "").length,
    sourceDocument: path.basename(source.entryName)
  };

  return { parsed, assets };
}
