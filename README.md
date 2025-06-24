# KNews - 关键词新闻AI摘要系统

KNews 是一个基于 Next.js 开发的新闻 AI 摘要系统，通过关键词和日期筛选，为用户提供新闻内容的 AI 摘要，帮助用户快速了解特定主题的新闻动态。

## 功能特点

### 1. 日期与关键词筛选
- 灵活的日期选择器，默认显示前一天日期
- 预设关键词分类管理
- 支持多关键词同时选择
- 一键选择/取消分类下所有关键词
- 清空选择功能

### 2. 新闻摘要展示
- AI 生成的新闻摘要
- 原始新闻来源展示
- 按关键词顺序排序的结果
- 支持新闻原文链接跳转
- 语音播报摘要内容

### 3. 用户界面
- 响应式设计，支持移动端和桌面端
- 左侧边栏用于筛选条件
- 右侧主区域展示新闻摘要
- 优雅的加载动画
- 友好的空状态提示

## 技术栈

### 前端
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hooks
- Heroicons

### API 集成
- 飞书多维表格 API
- Edge TTS 语音合成
- 阿里云语音服务

## 项目结构

```
knews/
├── app/                    # Next.js 应用主目录
│   ├── api/               # API 路由处理
│   │   ├── aliyun/        # 阿里云语音服务接口
│   │   │   ├── route.ts   # 阿里云token获取
│   │   │   └── tts/      # 语音合成服务
│   │   ├── feishu/       # 飞书API接口
│   │   └── tts/          # Edge TTS服务
│   ├── components/        # React组件
│   │   ├── NewsCard.tsx  # 新闻卡片组件
│   │   └── NoNewsAlert.tsx # 无新闻提示组件
│   ├── config/           # 配置文件
│   │   └── categories.ts # 关键词分类配置
│   ├── types/            # TypeScript类型定义
│   │   ├── feishu.ts    # 飞书API类型
│   │   ├── keywords.ts   # 关键词相关类型
│   │   └── news.ts      # 新闻数据类型
│   ├── utils/           # 工具函数
│   │   ├── api.ts       # API调用函数
│   │   ├── keywordUtils.ts # 关键词处理工具
│   │   └── speechSynthesis.ts # 语音合成工具
│   ├── fonts/           # 字体文件
│   ├── globals.css      # 全局样式
│   ├── layout.tsx       # 布局组件
│   └── page.tsx         # 主页面组件
├── public/              # 静态资源目录
├── .env                 # 环境变量配置
└── 配置文件             # 各类配置文件
```

### 核心目录说明

#### `/app`
- `api/`: 后端API路由实现
- `components/`: 可复用的React组件
- `config/`: 全局配置文件
- `types/`: TypeScript类型定义
- `utils/`: 工具函数和辅助方法

## 环境配置

### 必需的环境变量
```bash
NEXT_PUBLIC_APP_ID=            # 飞书应用 ID
NEXT_PUBLIC_APP_SECRET=        # 飞书应用密钥
NEXT_PUBLIC_APP_TOKEN=         # 飞书应用令牌
NEXT_PUBLIC_SUMMARY_TABLE_ID=  # 摘要表格 ID
NEXT_PUBLIC_SUMMARY_VIEW_ID=   # 摘要视图 ID
NEXT_PUBLIC_NEWS_TABLE_ID=     # 新闻表格 ID
NEXT_PUBLIC_NEWS_VIEW_ID=      # 新闻视图 ID
```

## 快速开始

1. 克隆项目
```bash
git clone [repository-url]
cd knews
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 填入必要的环境变量
```

4. 开发环境运行
```bash
npm run dev
```

5. 生产环境构建
```bash
npm run build
npm run start
```

## Nginx 部署配置

项目包含完整的 Nginx 配置，支持：
- SSL 证书配置
- WebSocket 支持
- 反向代理设置
- 安全性配置

### 基本配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 性能优化

- 关键词加载时间 < 3秒
- 新闻摘要查询响应时间 < 5秒
- 支持错误处理和异常恢复
- 详细的控制台日志

## 安全特性

- 环境变量安全存储
- API 访问令牌管理
- 敏感信息脱敏
- 安全的 CSP 配置

## 后续规划

- [ ] 新闻收藏功能
- [ ] 自定义关键词
- [ ] 数据导出功能
- [ ] 更多筛选条件
- [ ] 移动端体验优化

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 作者

[Your Name]

## 致谢

- Next.js 团队
- Tailwind CSS 团队
- 飞书开放平台
- 所有贡献者

