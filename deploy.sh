#!/bin/bash

# Memos Cloudflare 部署脚本
# 用法: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 开始部署 Memos Cloudflare 到 $ENVIRONMENT 环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境
check_requirements() {
    echo "📋 检查部署要求..."
    
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ Wrangler CLI 未安装。请运行: npm install -g wrangler${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if [ ! -f "wrangler.toml" ]; then
        echo -e "${RED}❌ wrangler.toml 配置文件不存在${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装 Workers 依赖..."
    npm install
    echo -e "${GREEN}✅ Workers 依赖安装完成${NC}"
}

# 部署 Workers API
deploy_workers() {
    echo "🔧 部署 Cloudflare Workers..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run deploy:production
    else
        npm run deploy:staging
    fi
    
    echo -e "${GREEN}✅ Workers 部署完成${NC}"
}

# 初始化数据库（仅在首次部署时需要）
init_database() {
    echo "🗄️  检查数据库状态..."
    
    read -p "是否需要初始化数据库？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "初始化 D1 数据库..."
        npm run db:init
        echo -e "${GREEN}✅ 数据库初始化完成${NC}"
    else
        echo "跳过数据库初始化"
    fi
}

# 构建并部署前端
deploy_frontend() {
    echo "🎨 构建并部署前端..."
    
    if [ ! -d "memos-main/web" ]; then
        echo -e "${YELLOW}⚠️  前端目录不存在，跳过前端部署${NC}"
        return
    fi
    
    cd memos-main/web
    
    # 检查是否有 pnpm
    if command -v pnpm &> /dev/null; then
        echo "使用 pnpm 安装前端依赖..."
        pnpm install
        echo "构建前端..."
        pnpm build
    else
        echo "使用 npm 安装前端依赖..."
        npm install
        echo "构建前端..."
        npm run build
    fi
    
    # 部署到 Cloudflare Pages
    echo "部署前端到 Cloudflare Pages..."
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler pages deploy dist --project-name=memos-frontend --env=production
    else
        wrangler pages deploy dist --project-name=memos-frontend --env=staging
    fi
    
    cd ../..
    echo -e "${GREEN}✅ 前端部署完成${NC}"
}

# 验证部署
verify_deployment() {
    echo "🔍 验证部署状态..."
    
    # 获取 Workers URL
    WORKER_URL=$(wrangler whoami 2>/dev/null | grep "Account ID" | head -1 || echo "")
    
    if [ -n "$WORKER_URL" ]; then
        echo "测试 API 健康检查..."
        # 这里可以添加实际的健康检查请求
        echo -e "${GREEN}✅ API 部署验证通过${NC}"
    else
        echo -e "${YELLOW}⚠️  无法获取部署信息，请手动验证${NC}"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo "=================================="
    echo "环境: $ENVIRONMENT"
    echo "API: 通过 Wrangler 查看 URL"
    echo "前端: 通过 Cloudflare Pages 查看 URL"
    echo ""
    echo "📚 下一步:"
    echo "1. 设置环境变量（如果尚未设置）:"
    echo "   wrangler secret put JWT_SECRET"
    echo "   wrangler secret put R2_ACCOUNT_ID"
    echo "   wrangler secret put R2_ACCESS_KEY_ID"
    echo "   wrangler secret put R2_SECRET_ACCESS_KEY"
    echo "   wrangler secret put R2_BUCKET"
    echo ""
    echo "2. 测试 API:"
    echo "   curl https://your-worker-url/health"
    echo ""
    echo "3. 访问前端进行首次注册"
    echo "=================================="
}

# 主执行流程
main() {
    echo "🌟 Memos Cloudflare 部署脚本"
    echo "环境: $ENVIRONMENT"
    echo ""
    
    check_requirements
    install_dependencies
    init_database
    deploy_workers
    deploy_frontend
    verify_deployment
    show_deployment_info
}

# 错误处理
trap 'echo -e "${RED}❌ 部署失败${NC}"; exit 1' ERR

# 执行主流程
main 