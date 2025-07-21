#!/bin/bash

# Mini Money 部署脚本

echo "开始部署 Mini Money 应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建数据目录
mkdir -p ./data

# 停止现有容器
echo "停止现有容器..."
docker-compose down

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

# 检查服务状态
echo "等待服务启动..."
sleep 10

# 检查容器状态
if docker-compose ps | grep -q "Up"; then
    echo "✅ 部署成功！"
    echo "应用访问地址: http://localhost:8080"
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
else
    echo "❌ 部署失败！"
    echo "查看错误日志: docker-compose logs"
    exit 1
fi

# 显示容器状态
echo ""
echo "容器状态:"
docker-compose ps
