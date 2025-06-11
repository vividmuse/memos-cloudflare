# 🌟 Cloudflare Pages 创建详细步骤

## 📋 前提条件

- ✅ 已将代码推送到 GitHub
- ✅ GitHub 仓库：`memos-cloudflare`
- ✅ 拥有 Cloudflare 账号

## 🚀 步骤 1：登录 Cloudflare Dashboard

1. 访问：**https://dash.cloudflare.com/**
2. 使用您的 Cloudflare 账号登录

## 📄 步骤 2：进入 Pages 服务

1. 在左侧导航栏中找到 **"Pages"**
2. 点击 **"Pages"** 进入页面
3. 点击 **"Create a project"** 按钮

## 🔗 步骤 3：连接 GitHub 仓库

1. 选择 **"Connect to Git"**
2. 选择 **"GitHub"** 作为 Git 提供商
3. 如果首次使用，需要授权 Cloudflare 访问您的 GitHub
   - 点击 **"Connect GitHub"**
   - 在弹出的 GitHub 授权页面中点击 **"Authorize"**
   - 选择要授权的组织/账户

## 📁 步骤 4：选择仓库

1. 在仓库列表中找到 **`memos-cloudflare`**
2. 点击仓库名旁边的 **"Begin setup"** 按钮

## ⚙️ 步骤 5：配置项目设置

### 基本设置：
- **Project name**: `memos-frontend` (或您喜欢的名称)
- **Production branch**: `main`

### 构建设置：
- **Framework preset**: 选择 **"None"** 或 **"Vite"**
- **Build command**: 
  ```bash
  cd memos-main/web && pnpm install && pnpm build
  ```
- **Build output directory**: 
  ```
  memos-main/web/dist
  ```
- **Root directory (optional)**: 留空或填 `/`

### 环境变量（构建时）：
点击 **"Environment variables (advanced)"** 展开：

| Variable name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `VITE_API_BASE_URL` | `https://memos.yourdomain.com` (您的 API 地址) |

## 🚀 步骤 6：开始部署

1. 检查所有设置无误
2. 点击 **"Save and Deploy"** 按钮
3. Cloudflare 将开始构建和部署过程

## 📊 步骤 7：监控部署状态

1. 您将看到部署日志实时更新
2. 等待构建完成（通常需要 2-5 分钟）
3. 看到 **"Success!"** 表示部署成功

## 🌐 步骤 8：获取访问地址

部署成功后，您将获得：
- **页面 URL**: `https://memos-frontend.pages.dev`
- **自定义域名**: 可在稍后配置

## 🔧 步骤 9：配置生产环境变量

1. 在 Pages 项目详情页面
2. 点击 **"Settings"** 选项卡
3. 选择 **"Environment variables"**
4. 点击 **"Add variable"** 添加：

### 生产环境变量：
| Variable name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://api.memos.example.com` | `Production` |
| `NODE_ENV` | `production` | `Production` |

5. 点击 **"Save"**

## 📁 步骤 10：配置路由规则

1. 在项目根目录确保有 `memos-main/web/_routes.json` 文件：
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

2. 如果需要，可以在 Pages 设置中配置重定向规则

## 🌍 步骤 11：配置自定义域名（可选）

1. 在 Pages 项目页面，点击 **"Custom domains"**
2. 点击 **"Set up a custom domain"**
3. 输入您的域名：`memos.example.com`
4. 根据提示配置 DNS 记录：
   - 添加 CNAME 记录：`memos.example.com` → `memos-frontend.pages.dev`
5. 等待 DNS 传播（可能需要几分钟到几小时）

## 🔄 步骤 12：触发重新部署

如果需要重新部署：
1. 在 Pages 项目页面
2. 点击 **"Deployments"** 选项卡
3. 点击 **"Retry deployment"** 或推送新代码到 GitHub

## ✅ 验证部署

访问您的 Pages 地址，检查：
- ✅ 前端页面正常加载
- ✅ 可以访问登录页面
- ✅ API 请求指向正确的后端地址

## 🔍 常见问题解决

### 构建失败
- 检查构建命令是否正确
- 确认 `memos-main/web` 目录存在
- 查看构建日志中的错误信息

### 页面 404
- 检查 `_routes.json` 文件是否存在
- 确认构建输出目录设置正确

### API 无法访问
- 检查 `VITE_API_BASE_URL` 环境变量
- 确认后端 Workers 已部署
- 检查 CORS 配置

## 🎉 完成！

现在您的前端已经成功部署到 Cloudflare Pages！

**访问地址：**
- **临时地址**: `https://您的项目名.pages.dev`
- **自定义域名**: `https://memos.example.com` (如果已配置)

## 📋 下一步

1. 部署后端 Workers
2. 配置 D1 数据库
3. 设置 R2 文件存储
4. 测试完整功能

---

**🚀 享受您的 Cloudflare Pages 部署！** 