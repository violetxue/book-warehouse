# 清爽书库 · Book Warehouse

一个**开源、可独立部署**的图书存储仓库网站。支持从手机/电脑浏览器上传书籍、在线预览、下载、搜索、文件夹管理、批量改名、自定义排序与全量打包下载。

> 本项目已从豆包全栈平台（`@lark-apaas/*` 私有依赖、云存储、平台数据库）完整适配为**纯开源技术栈**：
> **React + Vite + NestJS + PostgreSQL (Drizzle ORM) + 本地磁盘文件存储**，可在任意服务器、任意 PostgreSQL 实例上独立构建与部署，手机与电脑浏览器直接打开即用，无需登录。

## 功能特性

- 📤 **上传书籍**：支持 epub / txt / pdf / docx / xlsx / pptx / mobi / azw 及其它大部分格式；可拖拽、批量上传，带进度条
- 🔍 **搜索书籍**：按书名、作者实时搜索，支持按文件类型筛选
- 👀 **在线预览**：TXT 直接全文预览、PDF 浏览器内阅读；其余格式提供下载
- ⬇️ **下载与打包**：单本下载 + 一键将全部书籍打包为 zip
- 🗂️ **文件夹管理**：创建 / 重命名 / 删除文件夹，书籍可移入文件夹，按文件夹浏览
- 🔢 **自定义排序**：每本书带上传序号，支持上移 / 下移调整顺序
- ✏️ **改名**：单本改名 + 批量改名（前缀 / 后缀 / 替换 / 顺序编号）
- 🚫 **上传去重**：同名同大小的文件自动识别并跳过，不可重复上传
- 🗑️ **删除书籍**：单本删除、多选批量删除（同时清理存储文件）
- 🌿 **护眼淡绿**：整体护眼淡绿、清晰明了的视觉风格
- 🌐 **免登录分享**：任何人打开链接即可浏览；无需注册登录

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + TanStack Query |
| 后端 | NestJS 10 + TypeScript（SWC 构建） |
| 数据库 | PostgreSQL + Drizzle ORM（postgres-js 驱动） |
| 文件存储 | 本地磁盘（`data/uploads`，通过 `/api/files/` 静态访问） |

## 快速开始（本地运行）

### 1. 准备 PostgreSQL

需要本机或任意可达的 PostgreSQL 实例（13+，`gen_random_uuid()` 需 PG 13+）。

```bash
# 创建数据库（以 psql 为例）
createdb book_warehouse
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，按需修改：

```bash
cp .env.example .env
```

关键配置：

- `DATABASE_URL`：PostgreSQL 连接串，默认 `postgres://postgres:postgres@localhost:5432/book_warehouse`
- `SERVER_HOST` / `SERVER_PORT`：监听地址与端口（默认 `0.0.0.0:3000`，手机可直接访问）
- `UPLOAD_DIR`：上传文件存储目录（默认 `data/uploads`）
- `ADMIN_TOKEN`（可选）：设置后，上传/删除/改名/排序等**写操作**需在请求头携带 `x-auth-token: <该值>`；不设置则完全免登录开放

### 4. 初始化数据库表

```bash
npm run db:init
```

### 5. 开发模式（前后端热更新）

```bash
npm run dev
```

- 前端 dev server：http://localhost:5173 （已代理 `/api` 到 3000）
- 后端 API：http://localhost:3000/api

### 6. 生产构建与启动

```bash
npm run build     # 产出 dist/server + dist/client
npm start         # node dist/server/main.js，单端口提供前端与 API
```

生产模式下直接访问 `http://<服务器IP>:3000` 即可，手机/电脑浏览器免登录使用。

## 部署到公网

本项目为纯开源全栈应用，可部署到任意支持 Node 22 + PostgreSQL 的平台，例如：

- **Vercel / Railway / Render**：绑定 PostgreSQL 云数据库（或 Neon / Supabase），设置 `DATABASE_URL`，构建命令 `npm run build`，启动命令 `npm start`
- **自有服务器**：`npm run build` 后 `npm start`，配合 Nginx 反代 `80/443` 端口
- **内网 / 局域网**：直接运行 `npm start`，同一局域网内的手机/电脑访问 `http://<电脑IP>:3000`（需防火墙放行 3000 端口）

> ⚠️ **安全提示**：默认免登录模式下，**写操作（上传/删除/改名/排序）同样公开**。部署到公网时建议设置 `ADMIN_TOKEN` 保护写操作，或加一层反向代理鉴权。

## API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/books` | 书籍列表（支持 keyword / fileType / folderId / 分页） |
| POST | `/api/books` | 创建书籍条目 |
| GET | `/api/books/:id` | 书籍详情 |
| PATCH | `/api/books/:id/name` | 单本改名 |
| PATCH | `/api/books/batch/rename` | 批量改名 |
| PATCH | `/api/books/:id/folder` | 移动文件夹 |
| POST | `/api/books/:id/reorder` | 上移/下移排序 |
| POST | `/api/books/check-duplicate` | 上传去重检测 |
| DELETE | `/api/books/:id` | 删除书籍 |
| GET | `/api/books/download/all` | 全部书籍打包 zip 下载 |
| POST | `/api/files/upload` | 文件上传（multipart，字段 `file`） |
| GET | `/api/files/:name` | 文件访问（下载/预览） |
| GET/POST/PATCH/DELETE | `/api/folders...` | 文件夹管理 |

## 目录结构

```
├── client/            # 前端（React + Vite + Tailwind）
│   └── src/
│       ├── pages/bookshelf/   # 书库主页面与各对话框组件
│       ├── hooks/             # TanStack Query hooks
│       ├── lib/               # 平台层（logger / axios / api-error）
│       └── components/ui/     # UI 组件
├── server/            # 后端（NestJS）
│   ├── platform/      # 自建平台层（数据库 / 文件存储 / 鉴权 / 用户上下文）
│   ├── modules/       # books / folders / files 业务模块
│   └── database/      # Drizzle schema
├── shared/            # 前后端共享类型
├── scripts/           # build.js / init-db.js / pg-smoke.js（本地验证）
└── .env.example       # 环境变量模板
```

## 常见问题

- **`npm start` 后提示无法连接数据库**：确认 PostgreSQL 已启动、数据库已创建、已执行 `npm run db:init`，且 `.env` 中 `DATABASE_URL` 正确
- **手机访问不了**：确认 `SERVER_HOST=0.0.0.0`、防火墙放行 `SERVER_PORT`、手机与服务器同一网络（公网部署需反向代理或平台托管）
- **上传超 500MB**：`server/modules/files/files.controller.ts` 中 `MAX_UPLOAD_SIZE` 可调整

## License

MIT
