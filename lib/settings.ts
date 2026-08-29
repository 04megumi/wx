import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { defaultPrompt } from "./templates";
import { WorkspaceSettings } from "./types";

const dataDir = path.join(process.cwd(), "data");
const settingsFile = path.join(dataDir, "settings.json");

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(settingsFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>;
    return {
      globalPrompt:
        typeof parsed.globalPrompt === "string" && parsed.globalPrompt.trim()
          ? parsed.globalPrompt
          : defaultPrompt,
    };
  } catch {
    return { globalPrompt: defaultPrompt };
  }
}

export async function saveWorkspaceSettings(
  settings: WorkspaceSettings,
): Promise<WorkspaceSettings> {
  await fs.mkdir(dataDir, { recursive: true });
  const normalized = {
    globalPrompt: settings.globalPrompt.trim() || defaultPrompt,
  };
  const temporary = `${settingsFile}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporary, settingsFile);
  return normalized;
}

export function composeEditorialPrompt(
  globalPrompt: string,
  taskPrompt?: string,
) {
  const taskSpecific = taskPrompt?.trim();
  if (!taskSpecific || taskSpecific === globalPrompt.trim())
    return globalPrompt;
  return `${globalPrompt}\n\n本任务补充要求：\n${taskSpecific}`;
}
