import { ArticleTemplate } from "./types";

export const templates: ArticleTemplate[] = [
  {
    id: "editorial-red",
    name: "赤章 · 新闻纪实",
    category: "政务新闻",
    description: "端正、克制的红色新闻版式，适合会议、活动与成果报道。",
    tags: ["正式", "新闻", "政务", "会议"],
    motif: "01",
    theme: { primary: "#9f2d2d", secondary: "#f5ebe5", accent: "#c89b62", text: "#24201e", muted: "#817873", background: "#fffdf9", headingFont: "Songti SC, STSong, serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 2 }
  },
  {
    id: "azure-report",
    name: "澄蓝 · 城市简报",
    category: "品牌资讯",
    description: "清晰理性的蓝色信息结构，强调数据、层级与阅读效率。",
    tags: ["理性", "简洁", "数据", "科技"],
    motif: "02",
    theme: { primary: "#245e78", secondary: "#e9f2f5", accent: "#72a9b8", text: "#1e3038", muted: "#708089", background: "#fbfdfe", headingFont: "PingFang SC, sans-serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 8 }
  },
  {
    id: "jade-culture",
    name: "青岚 · 人文雅集",
    category: "文化故事",
    description: "留白充足的东方人文风，适合文化、人物与深度叙事。",
    tags: ["人文", "文化", "东方", "深度"],
    motif: "03",
    theme: { primary: "#315c55", secondary: "#edf2ec", accent: "#b48c57", text: "#292e2b", muted: "#78807b", background: "#fffefa", headingFont: "Kaiti SC, STKaiti, serif", bodyFont: "Songti SC, STSong, serif", radius: 0 }
  },
  {
    id: "apricot-youth",
    name: "杏雨 · 青春活动",
    category: "校园活动",
    description: "轻快温暖的活动风格，适合校园、社群和青年内容。",
    tags: ["青春", "活动", "温暖", "校园"],
    motif: "04",
    theme: { primary: "#e46f51", secondary: "#fff1e8", accent: "#f3b466", text: "#3d302d", muted: "#917c75", background: "#fffdfb", headingFont: "PingFang SC, sans-serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 14 }
  },
  {
    id: "ink-minimal",
    name: "墨白 · 极简专栏",
    category: "观点专栏",
    description: "黑白高对比编辑风，适合观点、访谈与专业内容。",
    tags: ["极简", "观点", "专业", "访谈"],
    motif: "05",
    theme: { primary: "#171717", secondary: "#f1f1ef", accent: "#77736d", text: "#202020", muted: "#888580", background: "#ffffff", headingFont: "Songti SC, STSong, serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 0 }
  },
  {
    id: "violet-tech",
    name: "星云 · 科技发布",
    category: "科技创新",
    description: "带有轻微未来感的紫蓝排版，适合产品、AI 与创新项目。",
    tags: ["科技", "AI", "发布", "创新"],
    motif: "06",
    theme: { primary: "#5b4dc7", secondary: "#f0effb", accent: "#7e9ee8", text: "#28263a", muted: "#7e7a93", background: "#fdfcff", headingFont: "PingFang SC, sans-serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 12 }
  },
  {
    id: "forest-public",
    name: "森序 · 公益自然",
    category: "公益生态",
    description: "自然沉静的绿色风格，适合公益、环保与社区故事。",
    tags: ["公益", "自然", "社区", "环保"],
    motif: "07",
    theme: { primary: "#3d694d", secondary: "#edf4eb", accent: "#9eaa78", text: "#28332c", muted: "#738078", background: "#fcfdf9", headingFont: "Songti SC, STSong, serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 6 }
  },
  {
    id: "gold-business",
    name: "鎏金 · 商务成果",
    category: "商务发布",
    description: "低饱和金棕商务风，适合企业动态、合作与成果展示。",
    tags: ["商务", "企业", "成果", "合作"],
    motif: "08",
    theme: { primary: "#715536", secondary: "#f5f0e8", accent: "#c6a46a", text: "#302a24", muted: "#82786e", background: "#fffefa", headingFont: "Songti SC, STSong, serif", bodyFont: "-apple-system, BlinkMacSystemFont, sans-serif", radius: 4 }
  }
];

export const defaultPrompt = `你是一位资深微信公众号编辑与视觉排版设计师。请完整保留新闻事实，不得编造人物、数据和结论。优化标题、导语和段落层级，使语言准确、简洁、自然。根据素材语义安排图片，在保持正式感的同时提升移动端阅读体验。输出必须遵循所选模板的配色、留白和组件规则，并且只使用微信公众号兼容的内容结构。`;

export function getTemplate(id?: string) {
  return templates.find((item) => item.id === id) ?? templates[0];
}
