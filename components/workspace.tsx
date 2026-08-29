"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { renderArticleHtml } from "@/lib/article";
import { defaultPrompt, getTemplate, templates } from "@/lib/templates";
import { ArticleBlock, TaskStatus, WorkflowTask } from "@/lib/types";

const statusMeta: Record<TaskStatus, { label: string; step: number }> = {
  uploaded: { label: "素材已上传", step: 1 },
  parsed: { label: "等待匹配模板", step: 2 },
  template: { label: "等待选择模板", step: 3 },
  generating: { label: "正在生成", step: 4 },
  editing: { label: "编辑优化中", step: 5 },
  completed: { label: "已完成", step: 6 },
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(`服务返回了空响应（${response.status}），请刷新后重试`);
  }
  let result: { error?: string };
  try {
    result = JSON.parse(raw) as { error?: string };
  } catch {
    throw new Error(`服务响应格式异常（${response.status}），请重启开发服务`);
  }
  if (!response.ok) throw new Error(result.error || "请求失败，请稍后重试");
  return result as T;
}

function formatTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function TaskLogo({ index }: { index: number }) {
  const shapes = ["圆", "角", "线", "方"];
  return (
    <span className={`task-logo logo-${index % 4}`}>
      {shapes[index % shapes.length]}
    </span>
  );
}

function UploadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (task: WorkflowTask) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file) return setError("请先选择 ZIP 压缩包");
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    form.append("prompt", prompt);
    try {
      const result = await api<{ task: WorkflowTask }>("/api/tasks", {
        method: "POST",
        body: form,
      });
      onCreated(result.task);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal upload-modal">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">NEW WORKFLOW</span>
            <h2>创建一篇新文章</h2>
            <p>上传新闻稿和配图，我们会先整理素材，再为你匹配版式。</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div
          className={`dropzone ${file ? "has-file" : ""}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setFile(event.dataTransfer.files[0] || null);
          }}
        >
          <input
            ref={input}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file ? (
            <>
              <FileArchive size={30} />
              <strong>{file.name}</strong>
              <span>
                {(file.size / 1024 / 1024).toFixed(2)} MB · 点击重新选择
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={30} />
              <strong>拖入 ZIP 压缩包</strong>
              <span>包含 .docx 新闻稿与 JPG / PNG 配图，默认最大 1GB</span>
            </>
          )}
        </div>
        <label className="field-label">
          任务名称 <span>选填</span>
        </label>
        <input
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="默认使用文稿标题"
        />
        <button
          className="prompt-toggle"
          onClick={() => setShowPrompt(!showPrompt)}
        >
          <Settings2 size={15} /> 编辑本任务提示词{" "}
          <ChevronDown size={15} className={showPrompt ? "rotate" : ""} />
        </button>
        {showPrompt && (
          <textarea
            className="prompt-area"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        )}
        {error && (
          <div className="inline-error">
            <CircleAlert size={15} />
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="button ghost" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy} onClick={submit}>
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {busy ? "解析素材中" : "创建并解析"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <main className="empty-state">
      <div className="empty-art">
        <span className="paper paper-a" />
        <span className="paper paper-b" />
        <span className="paper paper-c">
          <Sparkles size={24} />
        </span>
      </div>
      <span className="eyebrow">AI EDITORIAL WORKFLOW</span>
      <h1>
        从一份新闻稿
        <br />
        到一篇好文章
      </h1>
      <p>
        导入 Word 与配图，选择适合的视觉模板，让 AI 完成编辑、排版与细节打磨。
      </p>
      <button className="button primary large" onClick={onCreate}>
        <Plus size={18} /> 创建第一个任务
      </button>
      <div className="empty-notes">
        <span>
          <Check size={14} />
          任务自动保存
        </span>
        <span>
          <Check size={14} />
          结构化精准修改
        </span>
        <span>
          <Check size={14} />
          公众号兼容导出
        </span>
      </div>
    </main>
  );
}

function SourceSummary({
  task,
  onRecommend,
  busy,
}: {
  task: WorkflowTask;
  onRecommend: () => void;
  busy: boolean;
}) {
  return (
    <div className="source-page">
      <div className="source-copy">
        <span className="eyebrow">MATERIAL CHECK</span>
        <h1>素材已经整理好了</h1>
        <p>
          在匹配模板前，先确认这组素材是否完整。AI
          会以文稿事实为准，图片按压缩包顺序参与排版。
        </p>
        <div className="source-stats">
          <div>
            <FileText size={19} />
            <span>
              <strong>{task.parsed.sourceDocument}</strong>
              <small>
                {task.parsed.wordCount.toLocaleString()} 字 ·{" "}
                {task.parsed.paragraphs.length} 个段落
              </small>
            </span>
          </div>
          <div>
            <ImageIcon size={19} />
            <span>
              <strong>{task.assets.length} 张配图</strong>
              <small>
                {task.assets.length
                  ? "已提取并建立素材索引"
                  : "没有发现独立配图"}
              </small>
            </span>
          </div>
        </div>
        <div className="prompt-card">
          <div>
            <Settings2 size={16} />
            <strong>编辑原则</strong>
          </div>
          <p>{task.prompt}</p>
        </div>
        <button
          className="button primary large"
          disabled={busy}
          onClick={onRecommend}
        >
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <WandSparkles size={17} />
          )}
          {busy ? "AI 正在分析内容" : "匹配 5 个推荐模板"}
        </button>
      </div>
      <div className="source-preview">
        <div className="doc-sheet">
          <span>新闻稿 / SOURCE</span>
          <h3>{task.parsed.title}</h3>
          {task.parsed.paragraphs.slice(1, 7).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {task.assets.slice(0, 3).map((asset, index) => (
          <img
            key={asset.id}
            className={`source-image image-${index}`}
            src={`/api/tasks/${task.id}/assets/${asset.id}`}
            alt={asset.name}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateMiniature({ templateId }: { templateId: string }) {
  const template = getTemplate(templateId);
  const { theme } = template;
  return (
    <div className="template-mini" style={{ background: theme.background }}>
      <span style={{ color: theme.accent }}>{template.motif} / EDITORIAL</span>
      <div
        className="mini-title"
        style={{ color: theme.primary, fontFamily: theme.headingFont }}
      >
        让每一次发生
        <br />
        都值得被看见
      </div>
      <i style={{ background: theme.primary }} />
      <p style={{ color: theme.text }}>
        以文字记录现场，用影像保存重要时刻。我们在这里，看见新的故事缓缓展开。
      </p>
      <div
        className="mini-callout"
        style={{ background: theme.secondary, borderColor: theme.accent }}
      >
        <b style={{ color: theme.primary }}>今日看点</b>
        <em />
        <em />
      </div>
      <p style={{ color: theme.text }}>
        从细节出发，连接真实的人与事，让内容拥有更清晰的表达。
      </p>
    </div>
  );
}

function TemplatePicker({
  task,
  onSelect,
  onGenerate,
  busy,
}: {
  task: WorkflowTask;
  onSelect: (id: string) => void;
  onGenerate: () => void;
  busy: boolean;
}) {
  const candidates = task.recommendations.length
    ? task.recommendations
    : templates
        .slice(0, 5)
        .map((item, index) => ({
          templateId: item.id,
          score: 90 - index * 3,
          reason: item.description,
        }));
  return (
    <div className="template-page">
      <div className="page-intro">
        <div>
          <button className="text-button">
            <ArrowLeft size={14} /> 素材已解析
          </button>
          <span className="eyebrow">STYLE MATCHING</span>
          <h1>为这篇文章选择一种表达</h1>
          <p>根据内容语气、篇幅与图片数量，AI 为你挑出了这些更合适的版式。</p>
        </div>
        <div className="intro-badge">
          <Sparkles size={15} />
          <span>已分析</span>
          <strong>
            {task.parsed.wordCount.toLocaleString()} 字 · {task.assets.length}{" "}
            图
          </strong>
        </div>
      </div>
      <div className="template-grid">
        {candidates.map((rec, index) => {
          const template = getTemplate(rec.templateId);
          const selected = task.selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              className={`template-card ${selected ? "selected" : ""}`}
              onClick={() => onSelect(template.id)}
            >
              <div className="rank">0{index + 1}</div>
              <TemplateMiniature templateId={template.id} />
              <div className="template-info">
                <div>
                  <span>{template.category}</span>
                  <b>{rec.score}% 匹配</b>
                </div>
                <h3>{template.name}</h3>
                <p>{rec.reason}</p>
                <div className="template-tags">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              {selected && (
                <span className="selected-mark">
                  <Check size={15} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="sticky-action">
        <div>
          <span>已选择</span>
          <strong>{getTemplate(task.selectedTemplateId).name}</strong>
        </div>
        <button className="button primary" disabled={busy} onClick={onGenerate}>
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {busy ? "正在生成文章，约需片刻" : "使用此模板生成文章"}
        </button>
      </div>
    </div>
  );
}

function Editor({
  task,
  onRevise,
  busy,
  onComplete,
  onWechatSync,
}: {
  task: WorkflowTask;
  onRevise: (instruction: string, blockId?: string) => void;
  busy: boolean;
  onComplete: () => void;
  onWechatSync: () => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<
    ArticleBlock | undefined
  >();
  const [instruction, setInstruction] = useState("");
  const [copied, setCopied] = useState(false);
  const html = useMemo(
    () => (task.document ? renderArticleHtml(task.document, task) : ""),
    [task],
  );
  const theme = getTemplate(task.document?.templateId);
  const quick = selectedBlock
    ? ["文字更精炼", "字号调小一点", "改为品牌主色", "语气更正式"]
    : ["整体语言更精炼", "增加段落小标题", "调整图片顺序", "结尾更有感染力"];

  function handlePreviewClick(event: React.MouseEvent<HTMLDivElement>) {
    const node = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-block-id]",
    );
    const block = task.document?.blocks.find(
      (item) => item.id === node?.dataset.blockId,
    );
    setSelectedBlock(block);
  }

  async function copyRichText() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob(
            [
              task.document?.blocks.map((b) => b.content || "").join("\n") ||
                "",
            ],
            { type: "text/plain" },
          ),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      await navigator.clipboard.writeText(
        task.document?.blocks.map((b) => b.content || "").join("\n") || "",
      );
    }
  }

  function send(value = instruction) {
    if (!value.trim() || busy) return;
    onRevise(value.trim(), selectedBlock?.id);
    setInstruction("");
  }

  return (
    <div className="editor-shell">
      <aside className="outline-panel">
        <div className="panel-title">
          <span>文章结构</span>
          <small>{task.document?.blocks.length} 个区块</small>
        </div>
        <button
          className={!selectedBlock ? "outline-item active" : "outline-item"}
          onClick={() => setSelectedBlock(undefined)}
        >
          <span className="outline-dot title-dot" />
          <div>
            <strong>全文</strong>
            <small>{task.document?.title}</small>
          </div>
        </button>
        {task.document?.blocks.map((block, index) => (
          <button
            key={block.id}
            className={
              selectedBlock?.id === block.id
                ? "outline-item active"
                : "outline-item"
            }
            onClick={() => setSelectedBlock(block)}
          >
            <span className={`outline-dot ${block.type}`} />{" "}
            <div>
              <strong>
                {block.type === "image"
                  ? `图片 ${index + 1}`
                  : block.type === "heading"
                    ? "小标题"
                    : block.type === "lead"
                      ? "导语"
                      : block.type === "quote"
                        ? "引用"
                        : block.type === "callout"
                          ? "信息卡片"
                          : block.type === "divider"
                            ? "分隔"
                            : `段落 ${index + 1}`}
              </strong>
              <small>{block.content || block.caption || "视觉分隔"}</small>
            </div>
          </button>
        ))}
      </aside>
      <main className="preview-stage">
        <div className="preview-toolbar">
          <div>
            <span className="live-dot" />
            公众号模拟预览
          </div>
          <span>375 px</span>
          <button className="icon-button">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="phone-wrap">
          <div className="phone-top">
            <span>9:41</span>
            <b>公众号文章</b>
            <span>•••</span>
          </div>
          <div
            className="article-preview"
            onClick={handlePreviewClick}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {selectedBlock && (
            <div className="selection-note">
              <Check size={13} />
              已选中「
              {selectedBlock.type === "paragraph"
                ? "正文段落"
                : selectedBlock.type}
              」，修改将锁定此区块
            </div>
          )}
        </div>
      </main>
      <aside className="ai-panel">
        <div className="ai-title">
          <span className="ai-glyph">
            <Sparkles size={17} />
          </span>
          <div>
            <strong>AI 精修</strong>
            <small>基于 DeepSeek</small>
          </div>
        </div>
        <div className="selection-card">
          <span>{selectedBlock ? "CURRENT SELECTION" : "EDITING SCOPE"}</span>
          <strong>
            {selectedBlock
              ? (
                  selectedBlock.content ||
                  selectedBlock.caption ||
                  "视觉分隔"
                ).slice(0, 64)
              : "当前修改范围：全文"}
          </strong>
          {selectedBlock && (
            <button onClick={() => setSelectedBlock(undefined)}>
              <X size={13} />
              取消选择
            </button>
          )}
        </div>
        <div className="chat-history">
          {task.revisions.length ? (
            task.revisions.slice(-4).map((item) => (
              <div className="chat-item" key={item.id}>
                <MessageSquareText size={14} />
                <div>
                  <p>{item.prompt}</p>
                  <span>
                    {item.targetBlockId ? "局部修改" : "全文调整"} ·{" "}
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-empty">
              <WandSparkles size={24} />
              <p>点击预览中的任意段落，再告诉我你想怎么改。</p>
            </div>
          )}
        </div>
        <div className="quick-actions">
          {quick.map((item) => (
            <button key={item} onClick={() => send(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="composer">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              selectedBlock ? "描述对这个区块的修改…" : "描述你想调整的内容…"
            }
          />
          <button disabled={!instruction.trim() || busy} onClick={() => send()}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>
        <p className="ai-hint">AI 可能犯错，事实与最终样式请人工确认</p>
        <div className="export-area">
          <button className="button soft" onClick={copyRichText}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "已复制" : "复制微信富文本"}
          </button>
          <a className="button ghost" href={`/api/tasks/${task.id}/export`}>
            <Download size={15} />
            导出 HTML
          </a>
          <button
            className="button primary full"
            disabled={busy}
            onClick={onWechatSync}
          >
            {busy ? (
              <LoaderCircle className="spin" size={15} />
            ) : (
              <ExternalLink size={15} />
            )}
            {busy
              ? "正在同步微信素材"
              : task.wechatDraft
                ? "重新同步并打开微信预览"
                : "同步草稿并打开微信预览"}
          </button>
          <button className="button soft full" onClick={onComplete}>
            <Check size={15} />
            标记为完成
          </button>
        </div>
        <div className="theme-sign">
          <span style={{ background: theme.theme.primary }} />
          <span style={{ background: theme.theme.accent }} />
          <span style={{ background: theme.theme.secondary }} />
          <small>{theme.name}</small>
        </div>
      </aside>
    </div>
  );
}

export default function Workspace() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const selected = tasks.find((task) => task.id === selectedId);

  useEffect(() => {
    api<{ tasks: WorkflowTask[] }>("/api/tasks")
      .then((result) => {
        setTasks(result.tasks);
        setSelectedId(result.tasks[0]?.id);
      })
      .catch((error) => setToast(error.message))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(task: WorkflowTask) {
    setTasks((current) => [
      task,
      ...current.filter((item) => item.id !== task.id),
    ]);
    setSelectedId(task.id);
  }
  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }

  async function patchTask(id: string, body: object) {
    const result = await api<{ task: WorkflowTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    updateLocal(result.task);
    return result.task;
  }
  async function recommend() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await api<{ task: WorkflowTask; fallback: boolean }>(
        `/api/tasks/${selected.id}/recommend`,
        { method: "POST" },
      );
      updateLocal(result.task);
      if (result.fallback) notify("AI 接口暂不可用，已展示内置推荐");
    } catch (e) {
      notify(e instanceof Error ? e.message : "推荐失败");
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await api<{ task: WorkflowTask; fallback: boolean }>(
        `/api/tasks/${selected.id}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: selected.selectedTemplateId }),
        },
      );
      updateLocal(result.task);
      if (result.fallback) notify("AI 接口暂不可用，已生成规则版初稿");
    } catch (e) {
      notify(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }
  async function revise(instruction: string, targetBlockId?: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await api<{ task: WorkflowTask }>(
        `/api/tasks/${selected.id}/revise`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction, targetBlockId }),
        },
      );
      updateLocal(result.task);
      notify("修改已应用，并保存了新版本");
    } catch (e) {
      notify(e instanceof Error ? e.message : "修改失败");
    } finally {
      setBusy(false);
    }
  }
  async function syncWechat() {
    if (!selected) return;
    const previewWindow = window.open("about:blank", "_blank");
    setBusy(true);
    try {
      const result = await api<{
        task: WorkflowTask;
        mediaId: string;
        backendUrl: string;
      }>(`/api/tasks/${selected.id}/sync-wechat`, { method: "POST" });
      updateLocal(result.task);
      if (previewWindow) previewWindow.location.href = result.backendUrl;
      else window.open(result.backendUrl, "_blank");
      notify("已同步至公众号草稿箱，请在后台点击预览");
    } catch (e) {
      if (previewWindow) previewWindow.location.href = "https://mp.weixin.qq.com/";
      notify(e instanceof Error ? e.message : "同步微信公众号失败");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("确定删除这个任务及其上传素材吗？")) return;
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    setSelectedId(remaining[0]?.id);
  }

  const visibleTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">微</span>
          <div>
            <strong>微流</strong>
            <small>WEFLOW AI</small>
          </div>
        </div>
        <button
          className="button primary new-task"
          onClick={() => setShowUpload(true)}
        >
          <Plus size={16} />
          新建文章
        </button>
        <div className="search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索任务"
          />
        </div>
        <div className="nav-label">
          <span>最近任务</span>
          <small>{tasks.length}</small>
        </div>
        <div className="task-list">
          {loading ? (
            <div className="list-loading">
              <LoaderCircle className="spin" size={18} />
              载入任务
            </div>
          ) : (
            visibleTasks.map((task, index) => (
              <button
                key={task.id}
                className={`task-row ${task.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(task.id)}
              >
                <TaskLogo index={index} />
                <span>
                  <strong>{task.name}</strong>
                  <small>
                    <i
                      className={`status-dot step-${statusMeta[task.status].step}`}
                    />
                    {statusMeta[task.status].label} ·{" "}
                    {formatTime(task.updatedAt)}
                  </small>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="sidebar-footer">
          <button>
            <Archive size={16} />
            归档项目
          </button>
          <button>
            <Settings2 size={16} />
            工作区设置
          </button>
          <div className="user">
            <span>W</span>
            <div>
              <strong>内容工作室</strong>
              <small>本地工作区</small>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          {selected ? (
            <>
              <div className="task-heading">
                <span>{statusMeta[selected.status].label}</span>
                <input
                  value={selected.name}
                  onChange={(e) =>
                    setTasks((current) =>
                      current.map((item) =>
                        item.id === selected.id
                          ? { ...item, name: e.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={(e) =>
                    patchTask(selected.id, { name: e.target.value }).catch(
                      (err) => notify(err.message),
                    )
                  }
                />
              </div>
              <div className="top-actions">
                <span className="saved">
                  <Check size={13} />
                  已自动保存
                </span>
                {selected.document && (
                  <button
                    className="button ghost compact"
                    onClick={() =>
                      patchTask(selected.id, {
                        status:
                          selected.status === "completed"
                            ? "editing"
                            : "completed",
                      })
                    }
                  >
                    {selected.status === "completed" ? "继续编辑" : "完成文章"}
                  </button>
                )}
                <button
                  className="icon-button danger"
                  title="删除任务"
                  onClick={() => remove(selected.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="top-empty">
              <span>工作台</span>
              <small>所有内容保存在本地</small>
            </div>
          )}
        </header>
        {!selected ? (
          <EmptyState onCreate={() => setShowUpload(true)} />
        ) : selected.status === "parsed" ? (
          <SourceSummary task={selected} onRecommend={recommend} busy={busy} />
        ) : selected.status === "template" ? (
          <TemplatePicker
            task={selected}
            busy={busy}
            onSelect={(id) =>
              patchTask(selected.id, { selectedTemplateId: id })
            }
            onGenerate={generate}
          />
        ) : selected.document ? (
          <Editor
            task={selected}
            busy={busy}
            onRevise={revise}
            onWechatSync={syncWechat}
            onComplete={() =>
              patchTask(selected.id, { status: "completed" }).then(() =>
                notify("文章已标记为完成"),
              )
            }
          />
        ) : (
          <SourceSummary task={selected} onRecommend={recommend} busy={busy} />
        )}
      </section>
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onCreated={(task) => {
            updateLocal(task);
            setShowUpload(false);
            notify("素材解析完成");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
