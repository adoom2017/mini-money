@echo off
echo 准备迁移前端到 Vite 构建系统...

REM 创建 src 目录结构
if not exist "frontend\src\components" mkdir frontend\src\components
if not exist "frontend\src\utils" mkdir frontend\src\utils

REM 移动文件到 src 目录
echo 移动组件文件...
if exist "frontend\components\*.js" move frontend\components\*.js frontend\src\components\ >nul 2>&1
if exist "frontend\utils\*.js" move frontend\utils\*.js frontend\src\utils\ >nul 2>&1

REM 将 app.js 重命名为 App.jsx
echo 重命名主应用文件...
if exist "frontend\app.js" move frontend\app.js frontend\src\App.jsx >nul 2>&1

REM 复制样式文件
if exist "frontend\styles.css" copy frontend\styles.css frontend\src\ >nul 2>&1

REM 替换新的 index.html
if exist "frontend\index_new.html" move frontend\index_new.html frontend\index.html

echo 安装依赖...
cd frontend
npm install

echo 迁移完成！现在可以使用以下命令：
echo 开发模式: npm run dev
echo 构建生产版本: npm run build
pause
