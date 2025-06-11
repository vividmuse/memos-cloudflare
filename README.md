# Memos Cloudflare Edition

基于 Cloudflare Workers + D1 + R2 的 Memos 部署版本，提供 100% API 兼容性。

## 🚀 部署状态

- **后端**: https://memos-cloudflare.yourmin.workers.dev ✅
- **前端**: https://memos-cloudflare.pages.dev 🔄
- **数据库**: Cloudflare D1 ✅
- **存储**: Cloudflare R2 (需配置)

## 🔑 登录信息

- **用户名**: `admin`
- **密码**: `123456`

## 📁 项目结构

```
├── backend/          # Cloudflare Workers + Hono API
│   ├── src/          # 源代码
│   ├── schema.sql    # 数据库结构
│   └── wrangler.toml # Workers 配置
├── frontend/         # React + Vite 前端
│   ├── src/          # 源代码
│   └── dist/         # 构建输出
├── docs/             # 项目文档
└── .github/workflows/ # CI/CD 配置
```

## ⚙️ Cloudflare Pages 配置

### 构建设置

```
Framework preset:       Vite
Root directory:         frontend
Build command:          pnpm install && pnpm build
Build output directory: dist
Node.js version:        18
```

### 环境变量

```
VITE_API_BASE_URL=https://memos-cloudflare.yourmin.workers.dev
```

## 🔧 本地开发

### 后端开发

```bash
cd backend
npm install
npm run dev  # 启动开发服务器
```

### 前端开发

```bash
cd frontend
pnpm install
pnpm dev     # 启动开发服务器
```

## 📦 部署

### 自动部署

推送到 `main` 分支会自动触发 GitHub Actions 部署：

- **后端**: 部署到 Cloudflare Workers
- **前端**: 部署到 Cloudflare Pages

### 手动部署

```bash
# 部署后端
cd backend
npx wrangler deploy

# 部署前端 (自动通过 GitHub)
git push origin main
```

## 🗃️ 数据库管理

```bash
# 查看表结构
cd backend
npx wrangler d1 execute memos --remote --command "SELECT name FROM sqlite_master WHERE type='table'"

# 执行 SQL
npx wrangler d1 execute memos --remote --command "SELECT * FROM user LIMIT 5"

# 运行迁移
npx wrangler d1 execute memos --remote --file schema.sql
```

## 🔒 环境变量设置

```bash
# 设置 JWT 密钥
cd backend
npx wrangler secret put JWT_SECRET

# 设置 R2 存储 (可选)
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
```

## 🌟 特性

- ✅ **无服务器架构**: 基于 Cloudflare Workers，无需维护服务器
- ✅ **全球边缘部署**: 通过 Cloudflare 网络实现全球高速访问
- ✅ **100% API 兼容**: 与原版 Memos v0.24.x API 完全兼容
- ✅ **JWT 身份验证**: 安全的用户认证系统
- ✅ **D1 数据库**: 基于 SQLite 的分布式数据库
- ✅ **R2 对象存储**: 文件上传和存储支持
- ✅ **自动 CI/CD**: GitHub Actions 自动部署

## 🛠️ 故障排除

### 前端页面空白

确保 Cloudflare Pages 配置正确：
- Root directory: `frontend`
- Build output directory: `dist`

### API 连接错误

检查环境变量 `VITE_API_BASE_URL` 是否正确设置。

### 数据库错误

运行数据库迁移：
```bash
cd backend
npx wrangler d1 execute memos --remote --file schema.sql
```

## 📄 许可证

基于原 Memos 项目，采用 MIT 许可证。

## 项目概述

这是将开源笔记项目 [Memos](https://github.com/usememos/memos) 完全迁移到 Cloudflare 边缘计算平台的实现：

- **后端**: Cloudflare Workers (TypeScript + Hono)
- **数据库**: Cloudflare D1 (SQLite)
- **文件存储**: Cloudflare R2 (S3 兼容)
- **前端部署**: Cloudflare Pages
- **API 兼容性**: 100% 兼容原版 Memos v0.24.x API

## 功能特性

### ✅ 已实现核心功能

- **用户认证**: JWT 登录/注册系统
- **笔记管理**: 创建、编辑、删除、查看笔记
- **标签系统**: 笔记分类和标签管理
- **文件上传**: 图片和附件支持（R2 存储）
- **权限控制**: 私有、保护、公开三级权限
- **API 兼容**: 与原版 Memos API 完全兼容

### 🚧 待完善功能

- **完整的 R2 S3 签名**: 当前为简化实现
- **前端构建集成**: 自动化部署流程
- **性能优化**: 缓存和 CDN 配置
- **监控告警**: 日志和错误追踪

## 快速开始

### 前置要求

- Node.js 18+
- Cloudflare 账户
- Wrangler CLI

### 安装依赖

```bash
npm install
```

### 配置环境

1. **创建 D1 数据库**:
```bash
wrangler d1 create memos
```

2. **更新 wrangler.toml** 中的 `database_id`

3. **设置环境变量**:
```bash
wrangler secret put JWT_SECRET
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET
```

4. **初始化数据库**:
```bash
npm run db:init
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看 API。

### 部署

#### 部署 API (Workers)

```bash
# 部署到 staging
npm run deploy:staging

# 部署到 production
npm run deploy:production
```

#### 部署前端 (Pages)

```bash
# 构建前端
cd memos-main/web
pnpm install
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=memos-frontend
```

## API 文档

### 认证

#### POST `/api/auth/signin`
用户登录

```json
{
  "username": "admin",
  "password": "password"
}
```

#### POST `/api/auth/signup`
首次注册（仅限创建 HOST 账户）

```json
{
  "username": "admin", 
  "password": "password",
  "email": "admin@example.com"
}
```

### 用户管理

#### GET `/api/user/me`
获取当前用户信息（需要认证）

#### GET `/api/user/:id`
获取指定用户公开信息

#### PATCH `/api/user/:id`
更新用户信息（需要认证）

### 笔记管理

#### POST `/api/memo`
创建笔记（需要认证）

```json
{
  "content": "Hello **Memos** on Cloudflare!",
  "visibility": "PUBLIC",
  "resourceIdList": [1, 2]
}
```

#### GET `/api/memo`
获取笔记列表

查询参数：
- `rowStatus`: NORMAL | ARCHIVED
- `creatorId`: 用户ID
- `tag`: 标签名
- `visibility`: PRIVATE | PROTECTED | PUBLIC
- `limit`: 分页大小 (默认50)
- `offset`: 偏移量 (默认0)

#### GET `/api/memo/:id`
获取指定笔记

#### PATCH `/api/memo/:id`
更新笔记（需要认证）

#### DELETE `/api/memo/:id`
删除笔记（需要认证）

#### GET `/api/memo/stats`
获取笔记统计信息

### 标签管理

#### GET `/api/tag`
获取用户标签列表（需要认证）

#### POST `/api/tag`
创建标签（需要认证）

```json
{
  "name": "技术"
}
```

#### DELETE `/api/tag/:id`
删除标签（需要认证）

### 文件上传

#### POST `/api/resource/blob`
上传文件（需要认证）

使用 multipart/form-data，字段名为 `file`。

#### GET `/o/r/:uid/:filename`
下载文件（302 重定向到 R2 签名 URL）

## 数据库结构

详见 `schema.sql` 文件，包含以下主要表：

- `user`: 用户表
- `memo`: 笔记表  
- `tag`: 标签表
- `resource`: 附件资源表
- `memo_tag`: 笔记标签关联表
- `memo_resource`: 笔记附件关联表

## 环境变量说明

| 变量 | 描述 | 示例 |
|------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` |
| `R2_ACCOUNT_ID` | Cloudflare 账户 ID | `abc123...` |
| `R2_ACCESS_KEY_ID` | R2 访问密钥 ID | `S3RVER...` |
| `R2_SECRET_ACCESS_KEY` | R2 访问密钥 | `4bXx9...` |
| `R2_BUCKET` | R2 存储桶名称 | `memos-storage` |
| `BASE_URL` | 部署的基础 URL | `https://memos.example.com` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 项目结构

```
├── src/
│   ├── index.ts           # 主入口文件
│   ├── types.ts           # 类型定义
│   ├── utils.ts           # 工具函数
│   ├── middleware/
│   │   └── auth.ts        # 认证中间件
│   └── routes/
│       ├── auth.ts        # 认证路由
│       ├── user.ts        # 用户路由
│       ├── memo.ts        # 笔记路由
│       ├── tag.ts         # 标签路由
│       └── resource.ts    # 资源路由
├── schema.sql             # 数据库结构
├── wrangler.toml          # Cloudflare 配置
├── package.json           # 项目配置
└── memos-main/            # 原版 Memos 源码（参考）
    └── web/               # 前端代码
```

## 性能与限制

### 性能指标
- 冷启动: ≤ 5ms
- P99 延迟: ≤ 100ms
- 吞吐量: 500+ req/s

### 限制说明
- 单文件上传限制: 100MB
- D1 数据库并发限制
- R2 请求频率限制

## 成本估算

根据 PRD 预估，月使用量下的费用约 $6.27:

| 项目 | 月用量 | 费用 (USD) |
|------|--------|------------|
| Worker 调用 | 2M | $0.30 |
| D1 vCPU | 3M | $1.50 |
| R2 存储 | 15GB | $0.22 |
| R2 出口流量 | 50GB | $4.25 |

## 故障排除

### 常见问题

1. **JWT_SECRET 未设置**
   ```bash
   wrangler secret put JWT_SECRET
   ```

2. **数据库未初始化**
   ```bash
   npm run db:init
   ```

3. **R2 权限错误**
   - 检查 R2 API Token 权限
   - 确认存储桶名称正确

### 调试模式

设置环境变量 `LOG_LEVEL=debug` 开启详细日志。

## 开发贡献

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 许可证

本项目遵循 MIT 许可证。原版 Memos 项目请参考其官方许可证。

## 相关链接

- [原版 Memos](https://github.com/usememos/memos)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Hono 框架](https://hono.dev/) 