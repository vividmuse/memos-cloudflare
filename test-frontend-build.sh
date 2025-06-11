#!/bin/bash

echo "🚀 Memos Frontend Build & Test Script"
echo "====================================="

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi

# 进入前端目录
if [ ! -d "memos-main/web" ]; then
    echo "❌ Frontend directory not found: memos-main/web"
    exit 1
fi

cd memos-main/web

echo ""
echo "📦 Installing frontend dependencies..."
pnpm install

echo ""
echo "🔧 Building frontend..."
pnpm build

echo ""
echo "📊 Build results:"
ls -la dist/

echo ""
echo "🌐 Starting preview server..."
echo "Frontend will be available at: http://localhost:4173"
echo "Backend should be running at: http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop the preview server"

# 启动预览服务器
pnpm preview --port 4173 --host 0.0.0.0 