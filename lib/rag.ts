import "server-only";

import { listTasks } from "./store";
import { WorkflowTask } from "./types";

function bigrams(text: string) {
  const normalized = text.replace(/[\s\p{P}\p{S}]/gu, "").slice(0, 3000);
  const result = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

function similarity(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((value) => { if (right.has(value)) overlap += 1; });
  return overlap / Math.sqrt(left.size * right.size);
}

export async function retrieveStyleExamples(current: WorkflowTask) {
  const query = bigrams(current.parsed.paragraphs.join(""));
  const tasks = await listTasks();
  return tasks
    .filter((task) => task.id !== current.id && task.document && (task.status === "completed" || task.versions.length > 1))
    .map((task) => ({ task, score: similarity(query, bigrams(task.parsed.paragraphs.join(""))) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ task, score }) => ({
      similarity: Number(score.toFixed(3)),
      sourceTitle: task.parsed.title,
      finalTitle: task.document?.title,
      templateId: task.document?.templateId,
      blockPattern: task.document?.blocks.map((block) => block.type),
      acceptedRevisionPreferences: task.revisions.slice(-5).map((revision) => revision.prompt)
    }));
}
