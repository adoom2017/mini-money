# Mini Money - 极简记账应用

一个简洁易用的个人记账应用，支持收支记录、分类统计和数据可视化。

## 功能特性

- 💰 **收支记录**: 快速添加收入和支出记录
- 📊 **数据统计**: 月度收支统计和分类占比分析  
- 📈 **可视化图表**: 饼状图显示支出分布
- 🗂️ **分类管理**: 预设分类图标，直观易用
- 📱 **响应式设计**: 支持桌面和移动设备
- 💾 **数据持久化**: SQLite数据库存储，重启后数据不丢失

## 快速开始

### 环境要求
- Go 1.19+
- 现代浏览器

### 运行应用

1. 启动服务器：
```bash
go run .
```

2. 打开浏览器访问：`http://localhost:8080`

### 构建应用

```bash
go build -o mini-money
./mini-money
```

## API 接口

- `GET /api/transactions` - 获取所有交易记录
- `POST /api/transactions` - 添加新的交易记录
- `DELETE /api/transactions/:id` - 删除指定交易记录
- `GET /api/summary` - 获取总体财务摘要
- `GET /api/categories` - 获取所有分类
- `GET /api/statistics` - 获取月度统计数据

## 技术栈

**后端:**
- Go + Gin框架
- SQLite数据库
- RESTful API

**前端:**
- HTML5 + CSS3
- JavaScript (ES6+)
- React (CDN版本)
- Bootstrap 5
- Chart.js

## 许可证

MIT License
