export type TaskStatus =
  | "uploaded"
  | "parsed"
  | "template"
  | "generating"
  | "editing"
  | "completed";

export type WorkspaceSettings = {
  globalPrompt: string;
};

export type Asset = {
  id: string;
  name: string;
  mime: string;
  size: number;
  relativePath: string;
  source: "zip" | "docx";
};

export type ParsedContent = {
  title: string;
  paragraphs: string[];
  wordCount: number;
  sourceDocument: string;
};

export type BlockType =
  | "lead"
  | "heading"
  | "paragraph"
  | "image"
  | "quote"
  | "callout"
  | "divider";

export type ArticleBlock = {
  id: string;
  type: BlockType;
  content?: string;
  assetId?: string;
  caption?: string;
  style?: Record<string, string | number | boolean>;
};

export type ArticleDocument = {
  title: string;
  subtitle?: string;
  author?: string;
  templateId: string;
  blocks: ArticleBlock[];
};

export type Recommendation = {
  templateId: string;
  score: number;
  reason: string;
  layoutPlan?: string;
  xiumiKeywords?: string[];
  referenceIds?: string[];
};

export type Revision = {
  id: string;
  prompt: string;
  styleInstruction?: string;
  targetBlockId?: string;
  createdAt: string;
};

export type ArticleVersion = {
  id: string;
  label: string;
  createdAt: string;
  document: ArticleDocument;
};

export type WorkflowTask = {
  id: string;
  name: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  styleInstruction?: string;
  parsed: ParsedContent;
  assets: Asset[];
  recommendations: Recommendation[];
  selectedTemplateId?: string;
  document?: ArticleDocument;
  revisions: Revision[];
  versions: ArticleVersion[];
  wechatDraft?: {
    mediaId: string;
    syncedAt: string;
  };
};

export type TemplateTheme = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  background: string;
  headingFont: string;
  bodyFont: string;
  radius: number;
};

export type ArticleTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  theme: TemplateTheme;
  motif: string;
  layout:
    | "poster"
    | "workshop"
    | "youth"
    | "blueprint"
    | "notebook"
    | "award"
    | "dossier"
    | "magazine"
    | "timeline"
    | "gallery";
  structure: string[];
  xiumiKeywords: string[];
  referenceIds: string[];
};
