import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const AssetTrendChart = ({ records, assetName, color }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Prepare data for the chart
        const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedRecords.length === 0) {
            return;
        }

        const labels = sortedRecords.map(record => {
            const date = new Date(record.date);
            return date.toLocaleDateString('zh-CN', { 
                month: '2-digit', 
                day: '2-digit' 
            });
        });

        const data = sortedRecords.map(record => record.amount);

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: assetName,
                    data: data,
                    borderColor: color,
                    backgroundColor: 'transparent', // 透明背景，不填充区域
                    borderWidth: 3, // 增加线条宽度使其更清晰
                    fill: false, // 不填充区域，只显示折线
                    tension: 0.3,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5, // 增加点的大小
                    pointHoverRadius: 7, // 增加悬停时点的大小
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `金额: ¥${context.parsed.y.toLocaleString('zh-CN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: '#f3f4f6',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return '¥' + value.toLocaleString('zh-CN');
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.3
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [records, color, assetName]);

    if (records.length === 0) {
        return (
            <div className="asset-trend-chart no-data">
                <div className="no-data-message">
                    <span>📊</span>
                    <p>暂无数据</p>
                    <small>添加记录后查看趋势</small>
                </div>
            </div>
        );
    }

    return (
        <div className="asset-trend-chart">
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default AssetTrendChart;
