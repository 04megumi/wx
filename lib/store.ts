import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { WorkflowTask } from "./types";

const dataDir = path.join(process.cwd(), "data");
const tasksFile = path.join(dataDir, "tasks.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(tasksFile);
  } catch {
    await fs.writeFile(tasksFile, "[]", "utf8");
  }
}

export function taskUploadDir(taskId: string) {
  return path.join(dataDir, "uploads", taskId);
}

export async function listTasks(): Promise<WorkflowTask[]> {
  await ensureStore();
  const raw = await fs.readFile(tasksFile, "utf8");
  return (JSON.parse(raw) as WorkflowTask[]).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

async function writeTasks(tasks: WorkflowTask[]) {
  await ensureStore();
  const temporary = `${tasksFile}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(tasks, null, 2), "utf8");
  await fs.rename(temporary, tasksFile);
}

export async function getTask(id: string) {
  return (await listTasks()).find((task) => task.id === id);
}

export async function createTask(task: WorkflowTask) {
  const tasks = await listTasks();
  tasks.unshift(task);
  await writeTasks(tasks);
  return task;
}

export async function updateTask(
  id: string,
  updater: (task: WorkflowTask) => WorkflowTask
) {
  const tasks = await listTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index < 0) return undefined;
  tasks[index] = updater(tasks[index]);
  tasks[index].updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  return tasks[index];
}

export async function deleteTask(id: string) {
  const tasks = await listTasks();
  const found = tasks.some((task) => task.id === id);
  if (!found) return false;
  await writeTasks(tasks.filter((task) => task.id !== id));
  await fs.rm(taskUploadDir(id), { recursive: true, force: true });
  return true;
}
