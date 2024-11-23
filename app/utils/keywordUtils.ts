import { CategoryMap, KeywordCategory } from '../types/keywords';

// 从环境变量解析分类配置
export function parseCategoryConfig(): CategoryMap {
  const categoryConfig = process.env.NEXT_PUBLIC_KEYWORD_CATEGORIES;
  if (!categoryConfig) return {};

  try {
    return JSON.parse(categoryConfig);
  } catch (error) {
    console.error('Failed to parse keyword categories:', error);
    return {};
  }
}

// 将关键词按分类整理
export function categorizeKeywords(keywords: string[]): KeywordCategory[] {
  const categoryMap = parseCategoryConfig();
  const categorizedKeywords: KeywordCategory[] = [];
  const usedKeywords = new Set<string>();

  // 处理已定义的分类
  Object.entries(categoryMap).forEach(([category, categoryKeywords]) => {
    const matchedKeywords = keywords.filter(keyword => 
      categoryKeywords.includes(keyword)
    );

    if (matchedKeywords.length > 0) {
      categorizedKeywords.push({
        name: category,
        keywords: matchedKeywords
      });
      matchedKeywords.forEach(keyword => usedKeywords.add(keyword));
    }
  });

  // 处理未分类的关键词
  const uncategorizedKeywords = keywords.filter(
    keyword => !Array.from(usedKeywords).includes(keyword)
  );

  if (uncategorizedKeywords.length > 0) {
    categorizedKeywords.push({
      name: '未分类',
      keywords: uncategorizedKeywords
    });
  }

  return categorizedKeywords;
} 