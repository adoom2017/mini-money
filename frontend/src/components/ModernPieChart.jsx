import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ModernPieChart = ({ categoryStats, activeTab, t }) => {
  if (!categoryStats || categoryStats.length === 0) {
    return (
      <div className="no-data-message" style={{ height: '200px' }}>
        <div>
          <div style={{marginBottom: '8px'}}>📊 暂无{activeTab === 'expense' ? '支出' : '收入'}数据</div>
          <div style={{fontSize: '12px', color: '#9ca3af'}}>
            点击右下角"+"按钮添加交易记录
          </div>
        </div>
      </div>
    );
  }

  // 准备饼图数据
  const data = categoryStats.map(item => ({
    name: t(item.categoryKey),
    value: item.amount,
    percentage: item.percentage,
    categoryKey: item.categoryKey,
  }));

  // 定义颜色调色板
  const colors = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#98D8C8', // 薄荷绿
    '#F7DC6F', // 金黄色
  ];

  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">
            金额: ¥{data.value.toFixed(2)}
          </p>
          <p className="tooltip-percentage">
            占比: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // 小于5%不显示标签
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={renderCustomTooltip} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: '12px' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernPieChart;
