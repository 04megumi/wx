import {
  ArticleBlock,
  ArticleDocument,
  ArticleTemplate,
  WorkflowTask,
} from "./types";
import { getTemplate } from "./templates";

export function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function styleString(style?: ArticleBlock["style"]) {
  if (!style) return "";
  const allowed: Record<string, string> = {
    color: "color",
    fontSize: "font-size",
    fontWeight: "font-weight",
    textAlign: "text-align",
    backgroundColor: "background-color",
  };
  return Object.entries(style)
    .filter(([key]) => allowed[key])
    .map(
      ([key, value]) =>
        `${allowed[key]}:${typeof value === "number" && key === "fontSize" ? `${value}px` : String(value)}`,
    )
    .join(";");
}

function headerHtml(document: ArticleDocument, template: ArticleTemplate) {
  const { theme, layout, motif, category } = template;
  const title = escapeHtml(document.title);
  const subtitle = escapeHtml(
    document.subtitle === undefined
      ? "记录现场 · 连接专业 · 看见改变"
      : document.subtitle,
  );

  const titleMarkup = title
    ? {
        poster: `<h1 style="margin:0;font-family:${theme.headingFont};font-size:31px;line-height:1.35;font-weight:800;">${title}</h1>`,
        workshop: `<h1 style="margin:0;font-family:${theme.headingFont};font-size:28px;line-height:1.45;color:${theme.primary};">${title}</h1>`,
        youth: `<h1 style="margin:0;font-size:30px;line-height:1.4;color:${theme.text};">${title}</h1>`,
        blueprint: `<h1 style="margin:0;font-size:29px;line-height:1.4;color:${theme.text};">${title}</h1>`,
        notebook: `<h1 style="margin:0;font-family:${theme.headingFont};font-size:28px;line-height:1.45;color:${theme.text};"><span style="box-shadow:inset 0 -.48em 0 ${theme.accent};">${title}</span></h1>`,
        award: `<h1 style="margin:0;font-family:${theme.headingFont};font-size:30px;line-height:1.45;color:#fff8e9;">${title}</h1>`,
        dossier: `<h1 style="margin:0;font-size:28px;line-height:1.45;color:${theme.text};">${title}</h1>`,
        magazine: `<h1 style="margin:0;max-width:92%;font-family:${theme.headingFont};font-size:35px;line-height:1.3;color:${theme.primary};font-weight:700;">${title}</h1>`,
        timeline: `<h1 style="margin:0;font-family:${theme.headingFont};font-size:29px;line-height:1.4;">${title}</h1>`,
        gallery: `<h1 style="margin:0;font-size:31px;line-height:1.38;">${title}</h1>`,
      }[layout]
    : "";

  const subtitleMarkup = subtitle
    ? {
        poster: `<p style="margin:25px 0 0;padding-top:14px;border-top:1px solid ${theme.accent};font-size:14px;line-height:1.7;color:${theme.secondary};">${subtitle}</p>`,
        workshop: `<p style="margin:14px auto 0;max-width:80%;font-size:14px;line-height:1.8;color:${theme.muted};">${subtitle}</p>`,
        youth: `<p style="margin:18px 0 0;font-size:14px;line-height:1.8;color:${theme.primary};">◌ ${subtitle}</p>`,
        blueprint: `<p style="margin:18px 0 0;padding-top:12px;border-top:1px dashed ${theme.primary};font-size:14px;line-height:1.75;color:${theme.muted};">${subtitle}</p>`,
        notebook: `<p style="margin:18px 0 0;font-size:14px;line-height:1.8;color:${theme.muted};">${subtitle}</p>`,
        award: `<p style="margin:19px 0 0;font-size:14px;line-height:1.75;color:${theme.secondary};">${subtitle}</p>`,
        dossier: `<p style="margin:18px 0 0;font-size:14px;line-height:1.8;color:${theme.muted};">档案摘要｜${subtitle}</p>`,
        magazine: `<p style="margin:21px 0 0 18%;padding-left:14px;border-left:3px solid ${theme.accent};font-size:14px;line-height:1.85;color:${theme.muted};">${subtitle}</p>`,
        timeline: `<p style="margin:17px 0 0;font-size:14px;line-height:1.8;color:${theme.secondary};">${subtitle}</p>`,
        gallery: `<p style="margin:19px 0 0;font-size:14px;line-height:1.8;color:${theme.secondary};">${subtitle}</p>`,
      }[layout]
    : "";

  if (layout === "poster")
    return `<header style="margin:-28px -22px 34px;padding:48px 25px 38px;background:${theme.primary};color:#fff;position:relative;"><p style="margin:0 0 28px;font-size:12px;letter-spacing:.2em;color:${theme.accent};">EVENT / ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "workshop")
    return `<header style="margin:0 0 34px;text-align:center;"><p style="display:inline-block;margin:0 0 16px;padding:5px 14px;border-top:2px solid ${theme.accent};border-bottom:2px solid ${theme.accent};font-size:11px;letter-spacing:.18em;color:${theme.primary};">WORKSHOP ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "youth")
    return `<header style="margin:-8px 0 38px;padding:31px 23px;background:${theme.secondary};border-radius:22px 6px 22px 6px;box-shadow:8px 8px 0 ${theme.accent};"><p style="margin:0 0 12px;font-weight:700;letter-spacing:.16em;color:${theme.primary};">GROWING · ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "blueprint")
    return `<header style="margin:-8px 0 34px;padding:28px 23px;border:2px solid ${theme.primary};background:${theme.secondary};box-shadow:7px 7px 0 ${theme.accent};"><p style="margin:0 0 16px;font-size:11px;letter-spacing:.16em;color:${theme.primary};">PROJECT BLUEPRINT / ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "notebook")
    return `<header style="margin:0 0 36px;padding:25px 22px;background:${theme.secondary};border-top:9px solid ${theme.accent};box-shadow:0 5px 14px rgba(53,77,87,.12);transform:rotate(-.35deg);"><p style="margin:0 0 13px;font-size:12px;letter-spacing:.12em;color:${theme.primary};">FIELD NOTES · ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "award")
    return `<header style="margin:-28px -22px 36px;padding:42px 24px;background:${theme.primary};text-align:center;border-bottom:8px solid ${theme.accent};"><p style="margin:0 auto 18px;width:56px;height:56px;line-height:56px;border:1px solid ${theme.accent};border-radius:50%;font-family:${theme.headingFont};font-size:18px;color:${theme.accent};">喜报</p><p style="margin:0 0 12px;font-size:11px;letter-spacing:.28em;color:${theme.accent};">HONOR · ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "dossier")
    return `<header style="margin:0 0 36px;padding:26px 24px;border:1px solid ${theme.accent};border-radius:16px;background:${theme.secondary};"><p style="margin:0 0 20px;padding-bottom:10px;border-bottom:1px solid ${theme.accent};font-size:11px;letter-spacing:.15em;color:${theme.primary};">CASE FILE / NO.${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "magazine")
    return `<header style="margin:0 0 42px;"><p style="margin:0 0 30px;padding-bottom:8px;border-bottom:4px solid ${theme.primary};font-size:12px;letter-spacing:.3em;color:${theme.primary};">${category.toUpperCase()} / ISSUE ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  if (layout === "timeline")
    return `<header style="margin:0 0 38px;padding:28px 23px;border-radius:10px 10px 40px 10px;background:${theme.primary};color:white;"><p style="margin:0 0 20px;font-size:12px;letter-spacing:.18em;color:${theme.accent};">JOURNEY / ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
  return `<header style="margin:-28px -22px 38px;padding:50px 25px 36px;background:${theme.primary};color:white;"><p style="margin:0 0 52px;font-size:11px;letter-spacing:.24em;color:${theme.accent};">FIELD RECORD / FRAME ${motif}</p>${titleMarkup}${subtitleMarkup}</header>`;
}

function headingHtml(
  content: string,
  id: string,
  index: number,
  template: ArticleTemplate,
  custom: string,
) {
  const { theme, layout } = template;
  const no = String(index).padStart(2, "0");
  if (layout === "poster")
    return `<section data-block-id="${id}" style="margin:38px 0 18px;display:flex;align-items:stretch;${custom}"><b style="display:inline-block;padding:10px 12px;background:${theme.accent};color:${theme.primary};font-size:18px;">${no}</b><h2 style="flex:1;margin:0;padding:9px 14px;background:${theme.primary};font-size:20px;line-height:1.45;color:#fff;">${content}</h2></section>`;
  if (layout === "workshop")
    return `<h2 data-block-id="${id}" style="margin:38px 0 19px;padding:0 0 10px;border-bottom:1px solid ${theme.accent};font-size:21px;line-height:1.5;color:${theme.primary};${custom}"><small style="display:block;font-size:10px;letter-spacing:.18em;color:${theme.accent};">TOPIC ${no}</small>${content}</h2>`;
  if (layout === "youth")
    return `<h2 data-block-id="${id}" style="display:inline-block;margin:38px 0 20px;padding:8px 20px;background:${theme.primary};border-radius:4px 18px 4px 18px;box-shadow:5px 5px 0 ${theme.accent};font-size:20px;line-height:1.45;color:white;${custom}">${content}</h2>`;
  if (layout === "blueprint")
    return `<section data-block-id="${id}" style="margin:39px 0 19px;display:flex;align-items:center;gap:12px;${custom}"><b style="display:inline-block;min-width:40px;height:40px;line-height:40px;border-radius:50%;background:${theme.accent};text-align:center;color:white;">${no}</b><h2 style="margin:0;font-size:21px;line-height:1.45;color:${theme.primary};">${content}</h2></section>`;
  if (layout === "notebook")
    return `<h2 data-block-id="${id}" style="margin:39px 0 19px;font-size:21px;line-height:1.5;color:${theme.primary};${custom}"><span style="padding:0 4px;box-shadow:inset 0 -.55em 0 ${theme.accent};">${content}</span><small style="margin-left:8px;font-size:11px;color:${theme.muted};">#${no}</small></h2>`;
  if (layout === "award")
    return `<section data-block-id="${id}" style="margin:40px 0 20px;text-align:center;${custom}"><p style="margin:0;color:${theme.accent};letter-spacing:.25em;">— ${no} —</p><h2 style="margin:6px 0 0;font-family:${theme.headingFont};font-size:22px;line-height:1.5;color:${theme.primary};">${content}</h2></section>`;
  if (layout === "dossier")
    return `<h2 data-block-id="${id}" style="margin:39px 0 19px;padding:9px 14px;border-left:8px solid ${theme.primary};border-radius:0 10px 10px 0;background:${theme.secondary};font-size:20px;line-height:1.5;color:${theme.text};${custom}"><small style="margin-right:10px;color:${theme.primary};">${no}</small>${content}</h2>`;
  if (layout === "magazine")
    return `<h2 data-block-id="${id}" style="margin:42px 0 20px;padding-top:12px;border-top:1px solid ${theme.primary};font-family:${theme.headingFont};font-size:25px;line-height:1.4;color:${theme.primary};${custom}"><small style="display:block;margin-bottom:4px;font-family:${theme.bodyFont};font-size:10px;letter-spacing:.2em;color:${theme.accent};">CHAPTER ${no}</small>${content}</h2>`;
  if (layout === "timeline")
    return `<h2 data-block-id="${id}" style="margin:36px 0 18px 17px;padding-left:20px;border-left:2px solid ${theme.primary};font-size:21px;line-height:1.45;color:${theme.primary};${custom}"><span style="display:inline-block;margin-left:-28px;margin-right:13px;width:14px;height:14px;border:4px solid ${theme.background};border-radius:50%;background:${theme.accent};vertical-align:1px;"></span>${content}</h2>`;
  return `<h2 data-block-id="${id}" style="margin:42px 0 18px;font-size:22px;line-height:1.4;color:${theme.primary};letter-spacing:.08em;${custom}"><small style="display:block;margin-bottom:5px;font-size:10px;letter-spacing:.25em;color:${theme.accent};">FRAME ${no}</small>${content}</h2>`;
}

export function renderArticleHtml(
  document: ArticleDocument,
  task: WorkflowTask,
  remoteAssetUrls?: Record<string, string>,
) {
  const template = getTemplate(document.templateId);
  const { theme, layout } = template;
  const assetUrl = (assetId?: string) => {
    const asset = task.assets.find((item) => item.id === assetId);
    return asset
      ? remoteAssetUrls?.[asset.id] ||
          `/api/tasks/${task.id}/assets/${asset.id}`
      : "";
  };
  let headingIndex = 0;
  let imageIndex = 0;
  const renderBlock = (block: ArticleBlock) => {
    const custom = styleString(block.style);
    const content = escapeHtml(block.content);
    if (block.type === "heading")
      return headingHtml(content, block.id, ++headingIndex, template, custom);
    if (block.type === "lead") {
      const leadStyle =
        layout === "magazine"
          ? `border-left:4px solid ${theme.accent};font-family:${theme.headingFont};font-size:18px;`
          : layout === "dossier"
            ? `border:1px solid ${theme.accent};border-radius:${theme.radius}px;`
            : layout === "gallery"
              ? `border-left:4px solid ${theme.accent};`
              : `border-left:4px solid ${theme.accent};`;
      return `<section data-block-id="${block.id}" style="margin:25px 0;padding:19px 21px;background:${theme.secondary};${leadStyle}font-size:16px;line-height:2;letter-spacing:0;text-indent:2em;color:#000;${custom}">${content}</section>`;
    }
    if (block.type === "quote")
      return `<blockquote data-block-id="${block.id}" style="margin:29px ${layout === "magazine" ? "12%" : "7px"};padding:16px 18px;border-top:1px solid ${theme.accent};border-bottom:1px solid ${theme.accent};font-family:${theme.headingFont};font-size:16px;line-height:2;letter-spacing:0;text-align:center;color:#000;${custom}">“${content}”</blockquote>`;
    if (block.type === "callout") {
      const callout =
        layout === "notebook"
          ? `border:1px dashed ${theme.primary};transform:rotate(.2deg);`
          : layout === "blueprint"
            ? `border:2px dashed ${theme.primary};box-shadow:5px 5px 0 ${theme.accent};`
            : layout === "award"
              ? `border:2px solid ${theme.accent};`
              : `border:1px solid ${theme.accent};border-radius:${theme.radius}px;`;
      return `<section data-block-id="${block.id}" style="margin:27px 0;padding:19px 21px;${callout}background:${theme.secondary};font-size:16px;line-height:2;letter-spacing:0;text-indent:2em;color:#000;${custom}">${content}</section>`;
    }
    if (block.type === "divider")
      return `<p data-block-id="${block.id}" style="margin:35px auto;text-align:center;color:${theme.accent};letter-spacing:9px;${custom}">${layout === "gallery" ? "▰ ▰ ▰" : layout === "dossier" ? "FILE · FILE · FILE" : "• • •"}</p>`;
    if (block.type === "image") {
      imageIndex += 1;
      const src = assetUrl(block.assetId);
      const frame =
        layout === "award"
          ? `padding:7px;border:2px solid ${theme.accent};background:white;`
          : layout === "youth"
            ? `padding:8px;background:white;box-shadow:0 8px 22px rgba(24,141,168,.18);transform:rotate(${imageIndex % 2 ? "-.7" : ".7"}deg);`
            : layout === "gallery"
              ? `padding:7px 7px 22px;background:${theme.primary};`
              : layout === "poster"
                ? `padding:6px;border:1px solid ${theme.accent};box-shadow:7px 7px 0 ${theme.primary};`
                : "";
      return `<figure data-block-id="${block.id}" style="margin:30px ${layout === "magazine" && imageIndex % 2 ? "8% 0 -4%" : "0"};${frame}"><p style="margin:0 0 7px;font-size:10px;letter-spacing:.16em;color:${layout === "gallery" ? theme.accent : theme.muted};">${layout === "gallery" ? `FRAME ${String(imageIndex).padStart(2, "0")}` : ""}</p><img src="${src}" alt="${escapeHtml(block.caption)}" style="display:block;width:100%;height:auto;border-radius:${layout === "dossier" ? theme.radius : 0}px;" />${block.caption ? `<figcaption style="margin-top:9px;text-align:${layout === "magazine" ? "left" : "center"};font-size:12px;line-height:1.6;color:${layout === "gallery" ? theme.secondary : theme.muted};">${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
    }
    const paragraphExtra =
      layout === "timeline"
        ? `margin-left:37px;padding-left:16px;border-left:1px solid ${theme.secondary};`
        : layout === "poster"
          ? `padding:17px 18px;background:#fff;box-shadow:0 6px 18px rgba(52,54,60,.08);`
          : "";
    return `<p data-block-id="${block.id}" style="margin-top:0;margin-bottom:19px;${paragraphExtra}font-size:16px;line-height:2;letter-spacing:0;text-indent:2em;text-align:justify;color:#000;${custom}">${content}</p>`;
  };
  const shell =
    layout === "notebook"
      ? `background:${theme.background};background-image:linear-gradient(${theme.secondary} 1px, transparent 1px);background-size:100% 30px;`
      : `background:${theme.background};`;
  const footer =
    layout === "award"
      ? "END · 荣誉属于每一位同行者"
      : layout === "dossier"
        ? "END · CASE FILE CLOSED"
        : layout === "gallery"
          ? "END · OF RECORD"
          : "END";
  return `<article style="box-sizing:border-box;max-width:677px;margin:0 auto;padding:28px 22px 48px;${shell}font-family:${theme.bodyFont};color:${theme.text};">${headerHtml(document, template)}${document.blocks.map(renderBlock).join("")}<footer style="margin-top:44px;padding-top:18px;border-top:1px solid ${theme.secondary};font-size:11px;letter-spacing:.14em;color:${theme.muted};text-align:center;">${footer}</footer></article>`;
}
