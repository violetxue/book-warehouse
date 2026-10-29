# book-warehouse 📚

图书存储仓库网站：个人书库的**上传 / 预览 / 下载 / 搜索 / 删除 / 排序 / 文件夹管理**一体化 Web 应用，支持手机与电脑浏览器访问。

> 本项目最初在豆包全栈应用平台上开发并运行（fullstack 应用），此处为完整源码开源。仓库内代码依赖平台私有包（见「平台依赖说明」），脱离平台后需要做少量适配才能独立构建运行。

## 功能清单

- **上传书籍**：支持 epub / txt / pdf 及大部分常见格式；支持手机文件导入、拖拽上传、上传进度展示
- **上传去重**：自动检测重复文件并跳过，不允许重复上传
- **预览书籍**：PDF 内嵌预览、TXT 纯文本预览等
- **下载书籍**：单本下载；一键把全部书籍打包成 **zip** 一次性下载
- **搜索书籍**：按书名 / 作者搜索，支持按类型 Badge 筛选
- **删除书籍**：二次确认后删除
- **自定义排序**：书籍带上传序号，支持上移 / 下移调整顺序
- **批量管理**：单本改名 + 批量改名（前缀 / 后缀 / 替换 / 顺序编号）
- **文件夹管理**：创建 / 重命名 / 删除文件夹，把书籍移入文件夹，按文件夹浏览，显示各夹书籍数
- **分享浏览**：网站可分享给他人浏览（阅读权限取决于部署环境的访问控制）
- **护眼淡绿主题**：整体护眼淡绿、清晰明了的界面（色板固化在 `client/src/tailwind-theme.css`）
- **响应式布局**：手机 / 电脑自适应（响应式网格 + 抽屉侧栏 + 底部浮动上传按钮）

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| 后端 | NestJS + Drizzle ORM |
| 数据库 | PostgreSQL |
| 文件存储 | 平台云存储（FileService） |

## 目录结构

```
├── client/                 # 前端工程（React + Vite）
│   ├── src/pages/bookshelf # 书库主页面（上传/排序/文件夹/改名等业务组件）
│   ├── src/components/ui   # shadcn/ui 基础组件
│   └── src/components/business-ui  # 平台业务组件（表单/用户选择等模板）
├── server/                 # 后端工程（NestJS）
│   └── modules/books       # 书籍模块（上传/预览/下载/搜索/改名/排序/去重/zip 打包）
│   └── modules/folders     # 文件夹模块
├── shared/                 # 前后端共享类型
└── scripts/                # 开发与构建脚本
```

## 环境要求

- Node.js >= 22
- npm >= 10
- PostgreSQL（独立部署时需自建）

## 快速开始

```bash
npm install
npm run dev
```

> 注意：默认开发脚本面向豆包全栈平台运行时，本地裸跑需先完成「平台依赖适配」。

## 平台依赖说明

本项目在豆包全栈应用平台上开发，源码引用了以下平台私有依赖：

- `@lark-apaas/fullstack-nestjs-core`：提供 `DRIZZLE_DATABASE` 注入、`FileService` 云存储、`NeedLogin` 装饰器
- `@lark-apaas/client-toolkit`：提供 `axiosForBackend` / `logger` / `dataloom` 存储上传
- `@lark-apaas/coding-preset-vite-react`：前端构建预设
- `@lark-apaas/fullstack-presets`：全栈工程预设

**脱离平台后这些包无法安装运行**，需要将上述能力替换为自建实现（本地文件存储 + 通用数据库访问 + 自行实现鉴权）后即可独立部署。其余业务代码均为通用 React / NestJS 代码，可直接复用。

## 安全说明

- `.env` 仅包含日志配置（`LOG_DIR` / `LOG_REQUEST_BODY` / `LOG_RESPONSE_BODY`），无任何密钥，可安全公开
- 读取类接口（GET / books、GET / check-duplicate）已开放匿名访问；写操作（上传 / 改名 / 删除 / 排序 / 文件夹管理）默认需要登录态（`@NeedLogin`）

## License

MIT
