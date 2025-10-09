# 交易分类管理 API 文档

## 概述
交易分类现已从硬编码改为数据库存储，支持用户自定义添加、修改和删除分类。

## 数据库结构变更

### 新增表：transaction_categories
```sql
CREATE TABLE transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, key, type)
);
```

### Category 模型更新
```go
type Category struct {
    Key  string `json:"key"`
    Name string `json:"name"`  // 新增字段
    Icon string `json:"icon"`
}
```

## API 接口

### 1. 获取分类列表
**GET** `/api/categories`

**响应示例：**
```json
{
  "expense": [
    {
      "key": "food",
      "name": "餐饮",
      "icon": "🍽️"
    }
  ],
  "income": [
    {
      "key": "salary",
      "name": "工资", 
      "icon": "💰"
    }
  ]
}
```

### 2. 创建新分类
**POST** `/api/categories`

**请求体：**
```json
{
  "key": "custom_category",
  "name": "自定义分类",
  "icon": "🎯",
  "type": "expense"
}
```

### 3. 更新分类
**PUT** `/api/categories/:key`

**请求体：**
```json
{
  "name": "更新后的名称",
  "icon": "🎯",
  "type": "expense"
}
```

### 4. 删除分类
**DELETE** `/api/categories/:key?type=expense`

**查询参数：**
- `type`: 分类类型 ("income" 或 "expense")

**注意：** 只能删除自定义分类（is_default=false），默认分类不可删除

## 默认分类

### 支出分类 (expense)
- 餐饮 (food) 🍽️
- 购物 (shopping) 🛍️
- 服饰 (clothing) 👗
- 日用 (daily) 🏠
- 数码 (digital) 📱
- 美妆 (beauty) 💄
- 护肤 (skincare) 🧴
- 应用软件 (software) 💻
- 住房 (housing) 🏡
- 交通 (transport) 🚗
- 娱乐 (entertainment) 🎮
- 医疗 (medical) 🏥
- 通讯 (communication) 📞
- 汽车 (car) 🚙
- 学习 (education) 📚
- 办公 (office) 🏢
- 运动 (sports) ⚽
- 社交 (social) 👥
- 人情 (gifts) 🎁
- 育儿 (childcare) 👶
- 宠物 (pets) 🐕
- 旅行 (travel) ✈️
- 度假 (vacation) 🏖️
- 烟酒 (tobacco_alcohol) 🍺
- 彩票 (lottery) 🎲

### 收入分类 (income)
- 工资 (salary) 💰
- 奖金 (bonus) 🎯
- 加班 (overtime) ⏰
- 福利 (benefits) 🎁
- 公积金 (fund) 🏦
- 红包 (gift_money) 🧧
- 兼职 (part_time) 👔
- 副业 (side_business) 💼
- 退税 (tax_refund) 📄
- 投资 (investment) 📈
- 意外收入 (windfall) 💸
- 其他 (other_income) ❓

## 迁移说明

1. **新用户注册**：自动初始化默认分类
2. **现有用户**：需要运行迁移脚本初始化分类数据
3. **API兼容性**：`/api/categories` 从公开接口变更为需要认证的接口
4. **前端适配**：需要更新前端代码以支持新的分类数据结构

## 注意事项

- 所有分类操作都需要用户认证
- 分类的 `key` 在同一用户的同一类型中必须唯一
- 默认分类不可删除，只可修改名称和图标
- 删除分类时需要确保没有交易记录使用该分类