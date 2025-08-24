import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ModernBarChart = ({ dailyStats, t }) => {
  // 如果没有数据，显示当前月份的空图表
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  let chartData = dailyStats;
  
  // 如果没有数据，创建当前月份的空数据
  if (!dailyStats || dailyStats.length === 0) {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    chartData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      chartData.push({
        day,
        income: 0,
        expense: 0,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }
  }

  // 准备图表数据
  const labels = chartData.map(item => `${item.day}日`);
  const incomeData = chartData.map(item => item.income);
  const expenseData = chartData.map(item => item.expense);

  const data = {
    labels,
    datasets: [
      {
        label: '收入',
        data: incomeData,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: '支出',
        data: expenseData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ¥${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: function(value) {
            return '¥' + value;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ModernBarChart;
