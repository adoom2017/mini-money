@echo off
echo 开始部署 Mini Money 应用...

:: 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker 未安装，请先安装 Docker
    pause
    exit /b 1
)

:: 检查Docker Compose是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

:: 创建数据目录
if not exist "data" mkdir data

:: 停止现有容器
echo 停止现有容器...
docker-compose down

:: 构建并启动服务
echo 构建并启动服务...
docker-compose up -d --build

:: 等待服务启动
echo 等待服务启动...
timeout /t 10 /nobreak >nul

:: 检查容器状态
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ 部署成功！
    echo 应用访问地址: http://localhost:8080
    echo 查看日志: docker-compose logs -f
    echo 停止服务: docker-compose down
) else (
    echo ❌ 部署失败！
    echo 查看错误日志: docker-compose logs
    pause
    exit /b 1
)

:: 显示容器状态
echo.
echo 容器状态:
docker-compose ps

pause
