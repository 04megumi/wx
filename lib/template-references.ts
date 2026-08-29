export type TemplateReference = {
  id: string;
  url: string;
  title: string;
  palette: string[];
  layoutTraits: string[];
  componentTraits: string[];
  suitableFor: string[];
};

// Only structural fingerprints and source links are retained. Article copy and
// original template HTML are intentionally not stored or reproduced.
export const templateReferences: TemplateReference[] = [
  {
    id: "ref-competition-orange",
    url: "https://mp.weixin.qq.com/s/GQ3QuGXs7G2kTSlXd0BCiw",
    title: "同台竞技展实务成果，交流互鉴促精康发展",
    palette: ["炭黑", "竞赛橙", "杏金", "暖白"],
    layoutTraits: ["海报式首屏", "叠层网格", "高密度章节", "背景纹理贯穿"],
    componentTraits: [
      "大号年份",
      "编号标题条",
      "阴影内容卡",
      "金色相框",
      "尾声卡",
    ],
    suitableFor: ["竞赛", "论坛", "交流学习", "成果展示"],
  },
  {
    id: "ref-workshop-blue",
    url: "https://mp.weixin.qq.com/s/A0nfb0gFtNRSfnS51M1UsA",
    title: "个案研讨+生命线沙龙专题赋能活动",
    palette: ["清透蓝", "湖蓝", "白"],
    layoutTraits: ["双主题章节", "大图分段", "轻量留白", "短段落节奏"],
    componentTraits: ["双行章节标题", "整幅现场图", "主题总结句", "轻分隔"],
    suitableFor: ["培训", "工作坊", "沙龙", "专业赋能"],
  },
  {
    id: "ref-youth-cyan",
    url: "https://mp.weixin.qq.com/s/vhu4ApolvGkYe2ifcddfeg",
    title: "专业督导赋能基层服务·暖心守护青少年成长",
    palette: ["青蓝", "浅冰蓝", "白", "炭黑"],
    layoutTraits: ["青春感首屏", "色块章节", "图文交错", "轻阴影"],
    componentTraits: ["青色飘带标题", "拍立得图片", "几何角标", "结尾签名"],
    suitableFor: ["青少年", "校园", "督导活动", "成长服务"],
  },
  {
    id: "ref-governance-blueprint",
    url: "https://mp.weixin.qq.com/s/vB7Q_ppb-jmwmlK-iuMOMw",
    title: "破解成年监护人群权财事难题",
    palette: ["天蓝", "橙杏", "白", "淡蓝"],
    layoutTraits: ["方案型叙事", "多背景模块", "流程化分节", "图形信息密集"],
    componentTraits: ["三段机制卡", "流程箭头", "双重点色", "方案结论框"],
    suitableFor: ["政策解读", "机制建设", "项目方案", "治理创新"],
  },
  {
    id: "ref-ethics-warm",
    url: "https://mp.weixin.qq.com/s/zl_A9yFdVcL5ZQlBY286lQ",
    title: "聚焦伦理解困惑·赋能一线护成长",
    palette: ["奶油黄", "浅蓝灰", "白", "黑"],
    layoutTraits: ["笔记式叙事", "问题导向分节", "暖色留白", "柔和图文"],
    componentTraits: ["荧光标记标题", "问题卡", "知识便签", "行动总结"],
    suitableFor: ["伦理培训", "案例研讨", "知识科普", "青少年服务"],
  },
  {
    id: "ref-award-redgold",
    url: "https://mp.weixin.qq.com/s/tmBjzqFJss2CaKr_UFj5wg",
    title: "医心助困 暖在身边项目案例荣获二等奖",
    palette: ["荣誉红", "金橙", "奶白", "深红"],
    layoutTraits: ["荣誉海报首屏", "庆典式节奏", "大图成果墙", "红金背景"],
    componentTraits: [
      "奖章标题",
      "获奖信息牌",
      "金边照片",
      "成果数字",
      "荣誉结语",
    ],
    suitableFor: ["获奖", "表彰", "成果发布", "品牌喜报"],
  },
  {
    id: "ref-case-dossier",
    url: "https://mp.weixin.qq.com/s/KknJMDCLz0n6WbJmxt2bUw",
    title: "跨专业督导：聚焦重点病例个案服务堵点",
    palette: ["档案蓝", "浅灰", "白", "深灰"],
    layoutTraits: ["档案式首屏", "低图片密度", "专业长文", "层级卡片"],
    componentTraits: [
      "档案编号",
      "圆角诊断卡",
      "侧边标签",
      "重点结论框",
      "细线分隔",
    ],
    suitableFor: ["个案督导", "医疗社工", "专业报告", "会议纪要"],
  },
];

export function compactTemplateReferences() {
  return templateReferences.map(
    ({ id, title, palette, layoutTraits, componentTraits, suitableFor }) => ({
      id,
      title,
      palette,
      layoutTraits,
      componentTraits,
      suitableFor,
    }),
  );
}
