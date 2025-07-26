#!/bin/bash

echo "准备迁移前端到 Vite 构建系统..."

# 创建 src 目录结构
mkdir -p frontend/src/components
mkdir -p frontend/src/utils

# 移动文件到 src 目录
echo "移动组件文件..."
mv frontend/components/*.js frontend/src/components/ 2>/dev/null || true
mv frontend/utils/*.js frontend/src/utils/ 2>/dev/null || true

# 将 app.js 重命名为 App.jsx
echo "重命名主应用文件..."
mv frontend/app.js frontend/src/App.jsx 2>/dev/null || true

# 复制样式文件
cp frontend/styles.css frontend/src/ 2>/dev/null || true

# 替换新的 index.html
mv frontend/index_new.html frontend/index.html

echo "安装依赖..."
cd frontend
npm install

echo "迁移完成！现在可以使用以下命令："
echo "开发模式: npm run dev"
echo "构建生产版本: npm run build"
