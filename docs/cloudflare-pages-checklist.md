# ✅ Cloudflare Pages 快速配置清单

## 🎯 快速步骤概览

### 1. **访问 Pages**
- [ ] 登录 https://dash.cloudflare.com/
- [ ] 点击左侧 "Pages"
- [ ] 点击 "Create a project"

### 2. **连接 GitHub**
- [ ] 选择 "Connect to Git" → "GitHub"
- [ ] 授权 Cloudflare 访问您的 GitHub
- [ ] 选择 `memos-cloudflare` 仓库

### 3. **关键配置**

#### 🏗️ 构建设置
```
Project name: memos-frontend
Production branch: main
Framework preset: None 或 Vite
Build command: cd memos-main/web && pnpm install && pnpm build
Build output directory: memos-main/web/dist
Root directory: / (留空)
```

#### 🌍 环境变量
```
NODE_ENV = production
VITE_API_BASE_URL = https://memos.yourdomain.com
```

### 4. **部署**
- [ ] 点击 "Save and Deploy"
- [ ] 等待构建完成（2-5分钟）
- [ ] 记录访问地址：`https://项目名.pages.dev`

### 5. **后续配置**
- [ ] 配置自定义域名（可选）
- [ ] 测试前端页面加载
- [ ] 确认 API 连接正常

## 🚨 重要提醒

1. **构建命令必须正确**：`cd memos-main/web && pnpm install && pnpm build`
2. **输出目录**：`memos-main/web/dist`
3. **环境变量**：`VITE_API_BASE_URL` 要指向您的实际 API 地址
4. **路由文件**：确保 `_routes.json` 存在

## 📞 需要帮助？

如果遇到问题：
1. 查看构建日志
2. 检查配置是否正确
3. 确认 GitHub 仓库结构

**预计完成时间：5-10 分钟** ⏱️ 