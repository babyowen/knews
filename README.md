# KNews - 关键词新闻AI摘要系统

## 项目简介
KNews 是一个基于关键词的新闻AI摘要系统。它可以根据用户选择的关键词和日期，自动获取相关新闻并生成AI摘要。系统支持关键词分类管理，让用户可以更方便地选择和管理关键词。

## 主要功能
1. 关键词分类管理
2. 日期选择
3. 新闻AI摘要
4. 语音播报摘要内容

## 关键词分类配置
系统支持两种方式配置关键词分类：

### 1. 通过环境变量配置（推荐用于开发环境）
在 `.env.local` 文件中添加 `NEXT_PUBLIC_KEYWORD_CATEGORIES` 变量：
