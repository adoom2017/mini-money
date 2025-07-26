@echo off
echo 测试 Docker 构建...
echo.

echo 1. 清理旧镜像...
docker rmi mini-money:latest 2>nul

echo.
echo 2. 开始构建...
docker build -t mini-money:latest .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 构建成功！
    echo.
    echo 可以运行以下命令启动容器：
    echo docker run -d --name mini-money -p 8080:8080 mini-money:latest
) else (
    echo.
    echo ❌ 构建失败！
    echo 请检查上面的错误信息。
)

echo.
pause
