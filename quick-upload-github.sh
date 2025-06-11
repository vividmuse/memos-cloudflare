#!/bin/bash

echo "🚀 Quick Upload to GitHub"
echo "========================"

# 检查 Git 状态
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git..."
    git init
    git branch -M main
fi

# 添加所有文件
echo "📝 Adding all files..."
git add .

# 检查是否有变更
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "feat: Complete Memos Cloudflare migration

✅ Features implemented:
- 100% API compatible backend with Cloudflare Workers + Hono
- D1 database integration with complete schema
- JWT authentication system
- User, memo, tag, resource management
- GitHub Actions CI/CD for auto-deployment
- Frontend deployment configuration

🛠️ Tech Stack:
- Backend: Cloudflare Workers + Hono framework
- Database: Cloudflare D1 (SQLite compatible)
- Frontend: React + Vite (original Memos web)
- Storage: Cloudflare R2 (S3 compatible, needs config)
- Deployment: GitHub Actions + Cloudflare

📋 Next steps:
1. Configure GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
2. Set GitHub Variables (VITE_API_BASE_URL)  
3. Push will trigger auto-deployment
4. Configure R2 environment variables for file uploads"
fi

echo ""
echo "🌐 Ready to push to GitHub!"
echo ""
echo "Now run these commands:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "2. Repository name: memos-cloudflare"
echo "3. Then run:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/memos-cloudflare.git"
echo "git push -u origin main"
echo ""
echo "🎯 After pushing, configure GitHub Secrets:"
echo "- CLOUDFLARE_API_TOKEN"
echo "- CLOUDFLARE_ACCOUNT_ID"
echo "- VITE_API_BASE_URL (as Variable)" 