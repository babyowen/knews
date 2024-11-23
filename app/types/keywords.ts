// 关键词分类的类型定义
export interface KeywordCategory {
  name: string;          // 分类名称
  keywords: string[];    // 该分类包含的关键词
}

export interface CategoryMap {
  [category: string]: string[];
} 