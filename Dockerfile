# 使用Node.js镜像构建前端
FROM node:lts-alpine AS frontend-builder

WORKDIR /app/frontend
# 复制package文件
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
# 安装所有依赖（包括开发依赖，因为构建需要）
RUN npm ci

COPY frontend/ ./
RUN npm run build

# 使用官方Go镜像作为构建环境
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的依赖，包括CGO所需的编译工具
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
    && apk add --no-cache \
    git \
    gcc \
    musl-dev \
    sqlite-dev

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main .

# 使用轻量级的alpine镜像作为运行环境
FROM alpine:latest

# 安装sqlite和ca-certificates
RUN apk --no-cache add ca-certificates sqlite

# 设置工作目录
WORKDIR /app/

# 从构建阶段复制可执行文件
COPY --from=builder /app/main .

# 复制构建后的前端资源
COPY --from=frontend-builder /app/frontend/dist ./frontend

# 创建数据目录
RUN mkdir -p /app/data

# 确保数据目录有写权限
RUN chmod 755 /app/data

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV GIN_MODE=release

# 运行应用
CMD ["./main"]
