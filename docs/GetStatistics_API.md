# GetStatistics API 接口说明

## 接口路径
`GET /api/statistics`

## 功能描述
获取用户的统计数据，支持按月和按年统计。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| year | int | 否 | 当前年份 | 统计年份 |
| month | int | 否 | - | 统计月份 (1-12) |
| period | string | 否 | "month" | 统计周期，可选值: "month", "year" |

## 请求示例

### 1. 按月统计 (原有API，保持兼容)
```
GET /api/statistics?year=2024&month=12
```

### 2. 按年统计 (新增功能)
```
GET /api/statistics?year=2024&period=year
```

### 3. 默认当前月份统计
```
GET /api/statistics
```

## 逻辑说明

1. **向后兼容**: 如果提供了 `month` 参数，则使用按月统计，忽略 `period` 参数
2. **按年统计**: 如果 `period=year` 且没有提供 `month` 参数，则统计整年数据
3. **默认行为**: 如果既没有提供 `month` 也没有设置 `period=year`，则默认统计当前月份

## 响应格式
```json
{
  "summary": {
    "totalIncome": 1000.0,
    "totalExpense": 800.0,
    "balance": 200.0
  },
  "expenseBreakdown": [
    {
      "category": "食物",
      "amount": 300.0,
      "percentage": 37.5
    }
  ],
  "incomeBreakdown": [
    {
      "category": "工资",
      "amount": 1000.0,
      "percentage": 100.0
    }
  ]
}
```

## 更新说明
- ✅ 支持原有的按月统计功能
- ✅ 新增按年统计功能
- ✅ 保持完全向后兼容
- ✅ 添加了 `period` 参数来明确指定统计类型