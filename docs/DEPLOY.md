# 🚀 GitHub 自动部署指南

## 快速开始

### 1. 运行设置脚本

```bash
chmod +x setup-github-deploy.sh
./setup-github-deploy.sh
```

### 2. 在 GitHub 创建新仓库

1. 访问 [GitHub](https://github.com/new)
2. 仓库名称：`memos-cloudflare`
3. 描述：`Memos migration to Cloudflare Workers + D1 + R2`
4. 选择 Public 或 Private
5. **不要** 初始化 README、.gitignore 或 LICENSE

### 3. 推送代码到 GitHub

```bash
# 替换为您的仓库 URL
git remote add origin https://github.com/您的用户名/memos-cloudflare.git
git branch -M main
git push -u origin main
```

### 4. 配置 GitHub Secrets

在您的 GitHub 仓库设置中添加以下 Secrets：

**Settings > Secrets and variables > Actions > New repository secret**

| 名称 | 值 | 获取方式 |
|------|----|---------| 
| `CLOUDFLARE_API_TOKEN` | `YOUR_TOKEN` | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | `YOUR_ACCOUNT_ID` | [Cloudflare Dashboard](https://dash.cloudflare.com/) 右侧栏 |

### 5. 配置 GitHub Variables

**Settings > Secrets and variables > Actions > Variables tab > New repository variable**

| 名称 | 值 | 说明 |
|------|----|----|
| `VITE_API_BASE_URL` | `https://memos.your-domain.com` | 前端访问的 API 地址 |

### 6. 配置 Cloudflare Pages

#### 选项 A: 自动配置（推荐）
GitHub Actions 会自动部署到 Cloudflare Pages

#### 选项 B: 手动配置
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Pages** > **Create a project**
3. 连接到 GitHub > 选择您的仓库
4. 配置构建设置：
   - **Framework preset**: `None`
   - **Build command**: `cd memos-main/web && pnpm install && pnpm build`
   - **Build output directory**: `memos-main/web/dist`
   - **Root directory**: `/`

## 🎯 部署架构

```
GitHub Repository
       ↓ (push)
GitHub Actions
       ↓
   ┌─────────────────┬─────────────────┐
   ↓                 ↓                 ↓
Cloudflare      Cloudflare        Tests
 Workers         Pages            (lint/test)
(后端 API)      (前端界面)
```

## 🔧 自定义域名设置

### 1. Workers 域名
```bash
# 设置自定义域名
wrangler route add "api.memos.example.com/*" memos-cloudflare
```

### 2. Pages 域名
1. Pages 设置 > Custom domains
2. 添加 `memos.example.com`
3. 配置 DNS 记录

## 📋 环境变量完整列表

### Workers (wrangler.toml)
```toml
[vars]
LOG_LEVEL = "info"
BASE_URL = "https://memos.example.com"

# Secrets (通过 wrangler secret put 设置)
# JWT_SECRET
# R2_ACCOUNT_ID
# R2_ACCESS_KEY_ID  
# R2_SECRET_ACCESS_KEY
# R2_BUCKET
```

### Pages (GitHub Variables)
```env
VITE_API_BASE_URL=https://memos.example.com
NODE_ENV=production
```

## 🚨 故障排除

### 常见问题

1. **部署失败**: 检查 GitHub Secrets 是否正确设置
2. **前端 404**: 确认 `_routes.json` 文件存在
3. **API 无法访问**: 检查 CORS 配置和域名设置
4. **权限错误**: 确认 Cloudflare API Token 权限

### 查看部署日志

- **GitHub Actions**: Repository > Actions tab
- **Cloudflare Workers**: Wrangler CLI 或 Dashboard
- **Cloudflare Pages**: Pages 项目 > Functions tab

## 🎉 验证部署

部署完成后访问：
- 前端：`https://memos-frontend.pages.dev` 或您的自定义域名
- 后端：`https://memos-cloudflare.your-subdomain.workers.dev` 或您的自定义域名

测试 API：
```bash
curl https://your-api-domain.com/health
```

## 📚 更多信息

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GitHub Actions 文档](https://docs.github.com/en/actions) 