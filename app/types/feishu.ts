// 创建新文件定义飞书相关类型
export interface BaseFeishuRecord {
  fields: {
    [key: string]: any;
  };
}

export interface NewsFeishuRecord extends BaseFeishuRecord {
  fields: {
    title: string;
    link: string;
    date?: string;
    keyword?: string;
  };
}

export interface SummaryFeishuRecord extends BaseFeishuRecord {
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
    items: BaseFeishuRecord[];
  };
} 