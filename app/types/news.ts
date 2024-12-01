// 原始新闻内容（来自news_table）
export interface NewsContent {
  keyword: string;
  date: string;
  title: string;
  content: string;
  link: string;  // 注意这里是link而不是url
}

// AI生成的新闻总结（来自summary表）
export interface NewsSummary {
  keyword: string;
  date: string;
  summary: string;
}

// 组合后的完整新闻数据
export interface CombinedNewsItem {
  keyword: string;
  date: string;
  summary: string;
  originalNews?: NewsContent;
}