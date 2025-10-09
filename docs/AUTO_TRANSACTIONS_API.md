# 自动记账 API 文档

Mini Money 自动记账功能提供了完整的定时记账规则管理，支持按日、周、月、年的周期性自动记账。

## 基础信息

- **API 基础路径**: `/api/auto-transactions`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 数据模型

### AutoTransaction 结构

```json
{
  "id": 1,
  "userId": 123,
  "type": "expense",
  "amount": 299.00,
  "categoryKey": "housing_rent",
  "description": "每月房租",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "dayOfWeek": 0,
  "nextExecutionDate": "2025-11-01T00:00:00Z",
  "lastExecutionDate": "2025-10-01T00:00:00Z",
  "isActive": true,
  "createdAt": "2025-09-01T10:30:00Z",
  "updatedAt": "2025-10-01T00:00:05Z"
}
```

### 字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | number | 自动记账规则ID |
| `userId` | number | 用户ID |
| `type` | string | 交易类型：`"income"` 或 `"expense"` |
| `amount` | number | 金额（必须大于0） |
| `categoryKey` | string | 分类键值（对应交易分类） |
| `description` | string | 描述信息 |
| `frequency` | string | 执行频率：`"daily"`, `"weekly"`, `"monthly"`, `"yearly"` |
| `dayOfMonth` | number | 每月执行日期（1-31，用于月度/年度频率） |
| `dayOfWeek` | number | 每周执行星期（0=周日, 1=周一...6=周六，用于周频率） |
| `nextExecutionDate` | string | 下次执行时间（ISO 8601格式） |
| `lastExecutionDate` | string\|null | 上次执行时间（ISO 8601格式） |
| `isActive` | boolean | 是否启用 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## API 接口

### 1. 获取所有自动记账规则

**GET** `/api/auto-transactions`

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应
```json
[
  {
    "id": 1,
    "userId": 123,
    "type": "expense",
    "amount": 2999.00,
    "categoryKey": "housing_rent",
    "description": "每月房租",
    "frequency": "monthly",
    "dayOfMonth": 1,
    "dayOfWeek": 0,
    "nextExecutionDate": "2025-11-01T00:00:00Z",
    "lastExecutionDate": "2025-10-01T00:00:00Z",
    "isActive": true,
    "createdAt": "2025-09-01T10:30:00Z",
    "updatedAt": "2025-10-01T00:00:05Z"
  },
  {
    "id": 2,
    "userId": 123,
    "type": "income",
    "amount": 12000.00,
    "categoryKey": "salary",
    "description": "工资收入",
    "frequency": "monthly",
    "dayOfMonth": 25,
    "dayOfWeek": 0,
    "nextExecutionDate": "2025-10-25T00:00:00Z",
    "lastExecutionDate": null,
    "isActive": true,
    "createdAt": "2025-09-15T14:20:00Z",
    "updatedAt": "2025-09-15T14:20:00Z"
  }
]
```

### 2. 创建自动记账规则

**POST** `/api/auto-transactions`

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 请求体
```json
{
  "type": "expense",
  "amount": 299.00,
  "categoryKey": "housing_rent",
  "description": "每月房租",
  "frequency": "monthly",
  "dayOfMonth": 1
}
```

#### 请求参数说明

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `type` | string | 是 | 交易类型：`"income"` 或 `"expense"` |
| `amount` | number | 是 | 金额，必须大于0 |
| `categoryKey` | string | 是 | 分类键值 |
| `description` | string | 否 | 描述信息 |
| `frequency` | string | 是 | 频率：`"daily"`, `"weekly"`, `"monthly"`, `"yearly"` |
| `dayOfMonth` | number | 否 | 月度执行日期（1-31），用于 `monthly`/`yearly` 频率 |
| `dayOfWeek` | number | 否 | 周执行日期（0-6），用于 `weekly` 频率 |

#### 响应
```json
{
  "id": 3,
  "userId": 123,
  "type": "expense",
  "amount": 299.00,
  "categoryKey": "housing_rent",
  "description": "每月房租",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "dayOfWeek": 0,
  "nextExecutionDate": "2025-11-01T10:30:00Z",
  "lastExecutionDate": null,
  "isActive": true,
  "createdAt": "2025-10-09T10:30:00Z",
  "updatedAt": "2025-10-09T10:30:00Z"
}
```

### 3. 更新自动记账规则

**PUT** `/api/auto-transactions/:id`

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 请求体
```json
{
  "type": "expense",
  "amount": 3299.00,
  "categoryKey": "housing_rent",
  "description": "每月房租（已涨价）",
  "frequency": "monthly",
  "dayOfMonth": 5,
  "isActive": true
}
```

#### 请求参数说明

与创建接口相同，另外增加：

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `isActive` | boolean | 否 | 是否启用该规则 |

#### 响应
```json
{
  "id": 1,
  "userId": 123,
  "type": "expense",
  "amount": 3299.00,
  "categoryKey": "housing_rent",
  "description": "每月房租（已涨价）",
  "frequency": "monthly",
  "dayOfMonth": 5,
  "dayOfWeek": 0,
  "nextExecutionDate": "2025-11-05T10:30:00Z",
  "lastExecutionDate": "2025-10-01T00:00:00Z",
  "isActive": true,
  "createdAt": "2025-09-01T10:30:00Z",
  "updatedAt": "2025-10-09T10:35:00Z"
}
```

### 4. 删除自动记账规则

**DELETE** `/api/auto-transactions/:id`

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应
```json
{
  "message": "Auto transaction deleted successfully"
}
```

### 5. 切换自动记账规则状态

**PUT** `/api/auto-transactions/:id/toggle`

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应
```json
{
  "message": "Auto transaction status toggled successfully"
}
```

## 频率设置详解

### 1. 日频率 (daily)
- **描述**: 每天执行一次
- **必要字段**: 无
- **执行时间**: 每天同一时间（基于创建时间）

**示例**：
```json
{
  "frequency": "daily",
  "description": "每日咖啡"
}
```

### 2. 周频率 (weekly)
- **描述**: 每周指定星期执行
- **必要字段**: `dayOfWeek` (0=周日, 1=周一, ..., 6=周六)
- **执行时间**: 每周指定星期的同一时间

**示例**：
```json
{
  "frequency": "weekly",
  "dayOfWeek": 1,
  "description": "周一健身房费用"
}
```

### 3. 月频率 (monthly)
- **描述**: 每月指定日期执行
- **必要字段**: `dayOfMonth` (1-31)
- **执行时间**: 每月指定日期的同一时间
- **特殊处理**: 如果指定日期在某月不存在（如2月30日），将使用该月最后一天

**示例**：
```json
{
  "frequency": "monthly",
  "dayOfMonth": 15,
  "description": "每月水电费"
}
```

### 4. 年频率 (yearly)
- **描述**: 每年同一日期执行
- **必要字段**: `dayOfMonth` (使用创建时的月份和指定日期)
- **执行时间**: 每年同一月日的同一时间
- **特殊处理**: 处理闰年2月29日的情况

**示例**：
```json
{
  "frequency": "yearly",
  "dayOfMonth": 1,
  "description": "年度保险费用"
}
```

## 错误响应

所有接口遵循统一的错误响应格式：

```json
{
  "error": "错误描述信息"
}
```

### 常见错误码

| HTTP状态码 | 错误描述 |
|------------|----------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |

### 参数验证错误示例

```json
{
  "error": "Key: 'CreateAutoTransactionRequest.Amount' Error:Field validation for 'Amount' failed on the 'gt' tag"
}
```

## 使用示例

### JavaScript/TypeScript 客户端示例

```javascript
class AutoTransactionAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async getAutoTransactions() {
    const response = await fetch(`${this.baseURL}/api/auto-transactions`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async createAutoTransaction(data) {
    const response = await fetch(`${this.baseURL}/api/auto-transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async updateAutoTransaction(id, data) {
    const response = await fetch(`${this.baseURL}/api/auto-transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async deleteAutoTransaction(id) {
    const response = await fetch(`${this.baseURL}/api/auto-transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async toggleAutoTransaction(id) {
    const response = await fetch(`${this.baseURL}/api/auto-transactions/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }
}

// 使用示例
const api = new AutoTransactionAPI('http://localhost:8080', 'your-jwt-token');

// 创建每月房租自动记账
await api.createAutoTransaction({
  type: 'expense',
  amount: 2999.00,
  categoryKey: 'housing_rent',
  description: '每月房租',
  frequency: 'monthly',
  dayOfMonth: 1
});

// 获取所有自动记账规则
const autoTransactions = await api.getAutoTransactions();
console.log(autoTransactions);
```

## 自动执行机制

系统每小时检查一次是否有到期的自动记账规则需要执行：

1. **检查频率**: 每小时检查一次
2. **执行条件**: `isActive = true` 且 `nextExecutionDate <= 当前时间`
3. **执行后处理**: 
   - 创建对应的交易记录
   - 更新 `lastExecutionDate` 为当前时间
   - 根据频率计算并更新 `nextExecutionDate`

## 注意事项

1. **时区处理**: 所有时间均为服务器本地时区
2. **月末处理**: 对于月度/年度频率，如果指定日期不存在（如2月30日），将使用该月最后一天
3. **分类验证**: `categoryKey` 必须是用户已有的有效分类
4. **金额精度**: 建议使用2位小数精度
5. **并发安全**: 系统保证同一自动记账规则不会在同一时间重复执行

## 前端UI建议

1. **频率选择器**: 提供下拉菜单选择频率类型
2. **动态字段**: 根据频率类型显示/隐藏相应的日期字段
3. **预览功能**: 显示下次执行时间预览
4. **状态指示**: 清晰显示规则的启用/禁用状态
5. **执行历史**: 显示最后执行时间和执行状态

这样的完整API文档应该能帮助您在前端实现自动记账功能的所有需求。