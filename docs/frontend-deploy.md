# Memos Cloudflare 前端部署配置指南

## 📋 概述

本指南说明如何将 Memos 前端部署到 Cloudflare Pages，并配置与 Cloudflare Workers 后端的连接。

## 🔧 部署步骤

### 1. 构建前端

```bash
# 进入前端目录
cd memos-main/web

# 安装依赖
pnpm install

# 构建生产版本
pnpm build
```

### 2. 部署到 Cloudflare Pages

```bash
# 使用 Wrangler 部署
npx wrangler pages deploy dist --project-name=memos-frontend

# 或手动上传到 Cloudflare Pages Dashboard
```

### 3. 配置 Pages 环境变量

在 Cloudflare Pages 的设置中配置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|---------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://memos-api.example.com` |
| `NODE_ENV` | 环境模式 | `production` |

### 4. 配置 Pages Functions 路由

创建 `_routes.json` 文件以正确处理 API 代理：

```json
{
  "version": 1,
  "include": [
    "/*"
  ],
  "exclude": [
    "/api/*"
  ]
}
```

### 5. 配置反向代理

在 Pages 设置中，配置以下重定向规则：

```
/api/* -> https://your-worker-domain.workers.dev/api/* 301
```

## 🌍 环境配置

### 开发环境

开发时使用 Vite 代理：

```typescript
// vite.config.mts
export default defineConfig({
  server: {
    proxy: {
      "^/api": {
        target: "http://localhost:8787", // 本地 Worker
        xfwd: true,
      },
    },
  },
});
```

### 生产环境

生产环境中，前端通过以下方式调用 API：

1. **同域部署**: 如果前端和后端在同一域名下，直接使用相对路径 `/api/*`
2. **跨域部署**: 配置 CORS 并使用完整的后端 API URL

## 🔐 环境变量配置

### Pages 部署时的环境变量

在 Cloudflare Pages 的环境变量中设置：

```env
# 生产环境
VITE_API_BASE_URL=https://memos-api.yourdomain.com

# 测试环境  
VITE_API_BASE_URL=https://memos-api-staging.yourdomain.com
```

### 本地开发环境变量

创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8787
DEV_PROXY_SERVER=http://localhost:8787
```

## 📁 项目结构

```
memos-cloudflare/
├── src/                    # Workers 后端代码
├── memos-main/web/         # 前端源码
│   ├── dist/              # 构建输出 (用于部署)
│   ├── src/
│   └── vite.config.mts
├── wrangler.toml          # Workers 配置
└── _routes.json           # Pages 路由配置
```

## 🚀 自动部署

### GitHub Actions 配置

```yaml
name: Deploy Frontend to Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        working-directory: memos-main/web
        
      - name: Build
        run: pnpm build
        working-directory: memos-main/web
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          
      - name: Deploy to Pages
        run: npx wrangler pages deploy dist --project-name=memos-frontend
        working-directory: memos-main/web
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🌐 域名配置

### 推荐架构

```
Frontend: https://memos.yourdomain.com (Pages)
Backend:  https://api.memos.yourdomain.com (Workers)
```

### 单域名架构

```
https://memos.yourdomain.com     # 前端 (Pages)
https://memos.yourdomain.com/api # 后端 (Workers) 
```

使用 `_routes.json` 将 `/api/*` 路径路由到 Workers。

## 🔧 调试指南

### 1. 检查 API 连接

```bash
# 测试后端是否可访问
curl https://your-api-domain.com/health

# 测试前端是否正确代理
curl https://your-frontend-domain.com/api/health
```

### 2. 检查 CORS 配置

确保后端 Workers 配置了正确的 CORS：

```typescript
app.use('*', cors({
  origin: 'https://your-frontend-domain.com',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

### 3. 查看网络请求

在浏览器开发者工具中检查：
- API 请求是否指向正确的后端地址
- 是否存在 CORS 错误
- 认证 token 是否正确发送

## 📝 注意事项

1. **环境变量**: 前端环境变量必须以 `VITE_` 开头才能在构建时被包含
2. **CORS**: 确保后端正确配置 CORS 以允许前端域名访问
3. **路由**: 使用 `_routes.json` 正确分配前端和 API 路由
4. **缓存**: Pages 会缓存静态资源，更新后可能需要清除缓存
5. **HTTPS**: 生产环境必须使用 HTTPS

## 🎯 最佳实践

1. **分离部署**: 前端和后端分别部署，便于独立更新
2. **环境隔离**: 为不同环境使用不同的 API 地址
3. **监控**: 配置 Cloudflare Analytics 监控前端性能
4. **CDN**: 利用 Cloudflare 的全球 CDN 加速静态资源访问
5. **安全**: 配置适当的 CSP 头和安全策略 