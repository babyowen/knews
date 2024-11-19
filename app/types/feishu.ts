// 创建新文件定义飞书相关类型
export interface FeishuRecord {
  fields: {
    keyword: string;
    summary?: string;
    date?: string;
    update?: string;
  };
}

export interface FeishuResponse {
  code: number;
  msg: string;
  data?: {
    items: FeishuRecord[];
  };
} 