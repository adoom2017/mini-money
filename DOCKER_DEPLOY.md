# Mini Money Docker 部署指南

## 快速部署

### 前置要求
- Docker
- Docker Compose

### 部署步骤

#### 方法1: 使用部署脚本
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

#### 方法2: 手动部署
```bash
# 1. 构建并启动服务
docker-compose up -d --build

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f
```

## 访问应用
- 应用地址: http://localhost:8080
- 数据持久化: ./data 目录

## 管理命令

### 查看日志
```bash
docker-compose logs -f mini-money
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新应用
```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 配置选项

### 环境变量
- `GIN_MODE`: 运行模式 (release/debug)
- `PORT`: 端口号 (默认: 8080)

### 数据持久化
数据库文件保存在 `./data` 目录中，确保该目录有适当的权限。

### 使用Nginx反向代理
```bash
# 启动包含nginx的完整服务
docker-compose --profile with-nginx up -d --build
```

## 故障排除

### 端口被占用
如果8080端口被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8081:8080"  # 改为其他端口
```

### 数据库权限问题
```bash
# 修复数据目录权限
sudo chown -R 1000:1000 ./data
```

### 查看详细错误
```bash
# 查看构建日志
docker-compose build --no-cache

# 查看运行时日志
docker-compose logs --tail=100 mini-money
```

## 生产环境注意事项

1. **SSL证书**: 配置HTTPS证书到 `./ssl` 目录
2. **环境变量**: 设置适当的环境变量
3. **备份**: 定期备份 `./data` 目录
4. **监控**: 使用健康检查监控应用状态
5. **更新**: 定期更新Docker镜像和应用代码
