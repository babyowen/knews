# KeyWord News AI Summary 项目需求文档

## 1. 项目概述
KeyWord News AI Summary 是一个基于关键词的新闻AI摘要系统，用户可以通过选择日期和关键词来获取相关新闻的AI摘要。该系统旨在帮助用户快速了解特定主题的新闻动态。

## 2. 功能需求

### 2.1 日期选择功能
- 用户可以选择特定日期查看新闻摘要
- 系统默认显示前一天的日期
- 提供日期选择器界面

### 2.2 关键词管理
- 系统从后端获取预设的关键词列表
- 关键词按类别分组显示
- 支持多个关键词的同时选择
- 支持一键选择/取消某个分类下的所有关键词
- 提供清除所有已选关键词的功能

### 2.3 新闻摘要查询
- 用户必须至少选择一个关键词才能进行查询
- 根据选定的日期和关键词组合查询新闻摘要
- 查询结果按照用户选择关键词的顺序排序显示
- 每个新闻摘要包含关键词、日期和AI生成的摘要内容
- 同时展示从newstable中获取的原始新闻内容
- 新闻内容与AI摘要对应显示，方便用户对照查看

### 2.4 用户界面要求
- 响应式设计，支持移动端和桌面端
- 左侧边栏包含日期选择器和关键词选择区
- 右侧主区域显示新闻摘要列表
- 提供加载状态提示
- 无数据时显示友好的提示信息

## 3. 技术要求

### 3.1 前端技术栈
- 使用 Next.js 框架
- 使用 TypeScript 进行开发
- 使用 Tailwind CSS 进行样式设计
- 使用 React Hooks 管理状态
- 使用 Heroicons 图标库

### 3.2 API 集成
- 支持飞书多维表格API接口
- 需要处理租户访问令牌（Tenant Access Token）
- 实现关键词获取接口
- 实现新闻摘要获取接口
- 实现原始新闻内容获取接口（从newstable表格）

### 3.3 环境配置
需要配置以下环境变量：
- APP_ID
- APP_SECRET
- APP_TOKEN
- TABLE_ID

## 4. 性能要求
- 关键词加载时间控制在3秒内
- 新闻摘要查询响应时间控制在5秒内
- 支持错误处理和异常恢复
- 提供详细的控制台日志用于调试

## 5. 安全要求
- 环境变量安全存储
- API 访问令牌安全管理
- 敏感信息脱敏处理

## 6. 用户体验要求
- 提供清晰的操作引导
- 优雅的加载动画
- 友好的错误提示
- 流畅的交互体验
- 直观的选中状态展示

## 7. 后续优化方向
- 添加新闻原文链接
- 支持更多的筛选条件
- 添加新闻收藏功能
- 支持自定义关键词
- 添加数据导出功能
- 优化移动端体验

## 8. 项目限制
- 仅支持查询已存储的关键词相关新闻
- 新闻数据依赖后端API的可用性
- 查询日期范围可能受限于数据存储时间

## 9. 验收标准
- 所有核心功能正常运行
- 响应式布局正常显示
- 错误处理机制完善
- 用户界面符合设计规范
- 加载状态正确显示
- API调用正常且高效 