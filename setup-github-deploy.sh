#!/bin/bash

echo "🚀 Setting up GitHub Deployment for Memos Cloudflare"
echo "==================================================="

# 检查是否已经是 Git repository
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# 添加所有文件到 Git
echo ""
echo "📝 Adding files to Git..."
git add .

# 提交初始版本
echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Memos Cloudflare migration project

Features:
- ✅ 100% API compatible Cloudflare Workers backend
- ✅ D1 database integration
- ✅ JWT authentication system
- ✅ User, memo, tag, and resource management
- ✅ Frontend deployment configuration
- ✅ GitHub Actions CI/CD
- ⚠️ R2 file storage (needs configuration)

Tech stack:
- Backend: Cloudflare Workers + Hono
- Database: Cloudflare D1 (SQLite)
- Frontend: React + Vite (from original Memos)
- Storage: Cloudflare R2 (S3 compatible)
- Deployment: GitHub Actions + Cloudflare"

echo ""
echo "🌐 Setting up remote repository..."
echo "Please follow these steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   Repository name: memos-cloudflare"
echo "   Description: Memos migration to Cloudflare Workers + D1 + R2"
echo "   Public/Private: Choose as needed"
echo ""
echo "2. Copy the repository URL and run:"
echo "   git remote add origin <your-repository-url>"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Set up GitHub Secrets in your repository settings:"
echo "   - CLOUDFLARE_API_TOKEN: Your Cloudflare API token"
echo "   - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID"
echo ""
echo "4. Set up GitHub Variables:"
echo "   - VITE_API_BASE_URL: Your API domain (e.g., https://api.memos.example.com)"
echo ""
echo "📋 Current Git status:"
git status --short

echo ""
echo "📚 Next steps after pushing to GitHub:"
echo "1. Configure Cloudflare Pages to connect to your GitHub repository"
echo "2. Set up custom domain (optional)"
echo "3. Configure R2 environment variables for file uploads"
echo "4. Test the deployment"
echo ""
echo "🎉 Setup complete! Ready to push to GitHub." 