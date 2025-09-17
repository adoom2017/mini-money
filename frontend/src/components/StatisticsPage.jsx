import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const StatisticsPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [month, setMonth] = React.useState(new Date().getMonth() + 1);
    const [activeTab, setActiveTab] = React.useState('expense');
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    // 定义美观的渐变色彩数组，确保每个分类都有对应的颜色
    const chartColors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
        '#43e97b', '#38ef7d', '#ebbba7', '#cfc7f8', '#ffecd2',
        '#a8edea', '#fed6e3', '#d299c2', '#fef9d7', '#89f7fe',
        '#66a6ff', '#89cff0', '#a7c6ed', '#b6a1b4', '#87ceeb'
    ];

    // 获取分类对应的颜色
    const getCategoryColor = (categoryKey, index) => {
        return chartColors[index % chartColors.length];
    };

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth(`/api/statistics?year=${year}&month=${month}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else if (response.status === 401) {
                // 401 is handled by fetchWithAuth, just clear data
                setStats({ totalIncome: 0, totalExpense: 0, expenseBreakdown: [], incomeBreakdown: [] });
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchStatistics();
    }, [year, month]);

    // 添加一个effect来处理页面切换时的图表刷新
    React.useEffect(() => {
        // 当统计页面变为可见时，延迟一点时间确保DOM完全渲染
        const timeoutId = setTimeout(() => {
            if (stats && chartRef.current && !chartInstance.current) {
                // 如果图表还没有创建，触发重新渲染
                const breakdown = activeTab === 'expense' ? stats.expenseBreakdown : stats.incomeBreakdown;
                if (breakdown && breakdown.length > 0) {
                    // 触发图表重新渲染的依赖项更新
                    setActiveTab(prev => prev);
                }
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, []); // 仅在组件挂载时运行一次

    React.useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }

        // 添加延迟确保DOM元素已经渲染
        const renderChart = () => {
            if (stats && chartRef.current) {
                const breakdown = activeTab === 'expense' ? stats.expenseBreakdown : stats.incomeBreakdown;
                if (!breakdown || breakdown.length === 0) return;

                const chartData = {
                    labels: breakdown.map(d => t(d.categoryKey)),
                    datasets: [{
                        data: breakdown.map(d => d.amount),
                        backgroundColor: breakdown.map((d, index) => getCategoryColor(d.categoryKey, index)),
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverBackgroundColor: breakdown.map((d, index) => {
                            // 创建悬停时的加亮效果
                            const color = getCategoryColor(d.categoryKey, index);
                            return color + 'DD'; // 添加透明度
                        }),
                        hoverBorderColor: '#ffffff',
                        hoverBorderWidth: 3
                    }]
                };

                try {
                    chartInstance.current = new Chart(chartRef.current, {
                        type: 'doughnut',
                        data: chartData,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '65%', // 增加环形图的内径
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    titleColor: '#2c3e50',
                                    bodyColor: '#2c3e50',
                                    borderColor: '#e9ecef',
                                    borderWidth: 1,
                                    cornerRadius: 8,
                                    displayColors: true,
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.parsed;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((value / total) * 100).toFixed(1);
                                            return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                                        }
                                    }
                                }
                            },
                            animation: {
                                animateRotate: true,
                                animateScale: true,
                                duration: 1000,
                                easing: 'easeInOutCubic'
                            },
                            elements: {
                                arc: {
                                    borderRadius: 4 // 圆角效果
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error creating chart:', error);
                }
            }
        };

        // 使用setTimeout确保DOM完全渲染后再创建图表
        const timeoutId = setTimeout(renderChart, 100);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [stats, activeTab, lang]);

    // 组件卸载时清理图表
    React.useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, []);

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const renderContent = () => {
        if (loading) {
            return (
                <>
                    {/* 统计摘要卡片 - 加载状态 */}
                    <div className="total-assets-card" style={{ marginBottom: '2rem' }}>
                        <div className="total-label">月度统计</div>
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3" style={{ color: '#6c757d', margin: '1rem 0 0 0' }}>{t('loading')}</p>
                        </div>
                    </div>

                    {/* 分类统计卡片 - 加载状态 */}
                    <div className="assets-list-card">
                        <div className="assets-list-header">
                            <h3 className="assets-list-title">
                                <i className="fas fa-chart-pie me-2" style={{ color: '#667eea' }}></i>
                                分类统计
                            </h3>
                        </div>
                        <div className="assets-list-content">
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        
        if (error) {
            return (
                <>
                    {/* 统计摘要卡片 - 错误状态 */}
                    <div className="total-assets-card" style={{ marginBottom: '2rem' }}>
                        <div className="total-label">月度统计</div>
                        <div className="text-center p-4">
                            <div className="alert alert-danger" style={{
                                borderRadius: '12px',
                                margin: '0',
                                border: 'none',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {t('error_fetching_stats')}
                            </div>
                        </div>
                    </div>

                    {/* 分类统计卡片 - 错误状态 */}
                    <div className="assets-list-card">
                        <div className="assets-list-header">
                            <h3 className="assets-list-title">
                                <i className="fas fa-chart-pie me-2" style={{ color: '#667eea' }}></i>
                                分类统计
                            </h3>
                        </div>
                        <div className="assets-list-content">
                            <div className="text-center p-5">
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}></i>
                                <p style={{ color: '#6c757d', margin: 0 }}>{t('error_fetching_stats')}</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        
        // 无数据或有数据都使用相同的结构
        const hasData = stats && (stats.summary.totalIncome !== 0 || stats.summary.totalExpense !== 0);
        const breakdown = hasData ? (activeTab === 'expense' ? stats.expenseBreakdown : stats.incomeBreakdown) : [];

        return (
            <>
                {/* 统计摘要卡片 - 始终保持相同结构 */}
                <div className="total-assets-card" style={{ marginBottom: '2rem' }}>
                    <div className="total-label">月度统计</div>
                    {hasData ? (
                        <div className="assets-summary">
                            <div className="summary-item">
                                <div className="summary-label">总收入</div>
                                <div className="summary-amount" style={{ color: '#28a745' }}>
                                    {t('currencySymbol')}{stats.summary.totalIncome.toFixed(2)}
                                </div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">总支出</div>
                                <div className="summary-amount" style={{ color: '#dc3545' }}>
                                    {t('currencySymbol')}{stats.summary.totalExpense.toFixed(2)}
                                </div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">净余额</div>
                                <div className="summary-amount" style={{ 
                                    color: stats.summary.balance >= 0 ? '#28a745' : '#dc3545' 
                                }}>
                                    {t('currencySymbol')}{stats.summary.balance.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <i className="fas fa-chart-bar" style={{ fontSize: '3rem', color: '#e9ecef', marginBottom: '1rem' }}></i>
                            <p style={{ color: '#6c757d', margin: 0 }}>{t('no_data_period')}</p>
                        </div>
                    )}
                </div>

                {/* 分类统计卡片 - 始终保持相同结构 */}
                <div className="assets-list-card">
                    <div className="assets-list-header">
                        <h3 className="assets-list-title">
                            <i className="fas fa-chart-pie me-2" style={{ color: '#667eea' }}></i>
                            分类统计
                        </h3>
                        {hasData && (
                            <div className="btn-group" role="group" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <button
                                    type="button"
                                    className={`btn ${activeTab === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={() => setActiveTab('expense')}
                                    style={{ fontSize: '14px', padding: '8px 16px' }}
                                >
                                    支出
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${activeTab === 'income' ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setActiveTab('income')}
                                    style={{ fontSize: '14px', padding: '8px 16px' }}
                                >
                                    收入
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="assets-list-content">
                        {breakdown.length > 0 ? (
                            <div className="row" style={{ padding: '0 1rem' }}>
                                <div className="col-md-7">
                                    <div className="breakdown-list">
                                        {breakdown.map((item, index) => (
                                            <div className="asset-item" key={item.categoryKey} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '12px',
                                                background: 'white',
                                                border: '1px solid #f0f0f0',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}>
                                                <div className="category-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div
                                                        className="color-indicator"
                                                        style={{ 
                                                            backgroundColor: getCategoryColor(item.categoryKey, index),
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%'
                                                        }}
                                                    ></div>
                                                    <span className="icon" style={{ fontSize: '1.2rem' }}>{categoryIconMap.get(item.categoryKey) || '❓'}</span>
                                                    <span style={{ fontWeight: '500', color: '#2c3e50' }}>{t(item.categoryKey)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{ fontWeight: '600', color: '#667eea' }}>
                                                        {t('currencySymbol')}{item.amount.toFixed(2)}
                                                    </span>
                                                    <div className="progress" style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#f8f9fa' }}>
                                                        <div 
                                                            className="progress-bar" 
                                                            role="progressbar" 
                                                            style={{
                                                                width: `${item.percentage}%`,
                                                                backgroundColor: getCategoryColor(item.categoryKey, index),
                                                                borderRadius: '3px'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span style={{ fontSize: '14px', color: '#6c757d', minWidth: '45px' }}>
                                                        {item.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-5 d-flex flex-column align-items-center justify-content-center">
                                    <div className="chart-container" style={{
                                        width: '280px',
                                        height: '280px',
                                        position: 'relative',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
                                        border: '1px solid rgba(255,255,255,0.8)'
                                    }}>
                                        <canvas ref={chartRef}></canvas>
                                        {/* 图表中心文字 */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center',
                                            pointerEvents: 'none'
                                        }}>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: activeTab === 'expense' ? '#dc3545' : '#28a745',
                                                marginBottom: '4px'
                                            }}>
                                                {activeTab === 'expense' ? '总支出' : '总收入'}
                                            </div>
                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: '#2c3e50'
                                            }}>
                                                ¥{(activeTab === 'expense' ? stats.summary.totalExpense : stats.summary.totalIncome).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row" style={{ padding: '0 1rem' }}>
                                <div className="col-md-7">
                                    <div className="text-center p-5" style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        minHeight: '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <i className="fas fa-chart-pie" style={{ fontSize: '3rem', color: '#e9ecef', marginBottom: '1rem' }}></i>
                                        <p style={{ color: '#6c757d', margin: 0 }}>{t('no_data_period')}</p>
                                    </div>
                                </div>
                                <div className="col-md-5 d-flex flex-column align-items-center justify-content-center">
                                    <div className="chart-container" style={{
                                        width: '280px',
                                        height: '280px',
                                        position: 'relative',
                                        background: '#f8f9fa',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <i className="fas fa-chart-pie" style={{ fontSize: '4rem', color: '#e9ecef', marginBottom: '1rem' }}></i>
                                        <p style={{ color: '#6c757d', margin: 0, fontSize: '14px', textAlign: 'center' }}>暂无图表数据</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="assets-inner-content">
            {/* 页面头部 */}
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h2 className="page-title">统计分析</h2>
                    <div className="stats-filter" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: '#667eea',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            <i className="fas fa-calendar-alt"></i>
                            筛选
                        </div>
                        <Select
                            value={year}
                            onChange={setYear}
                            disabled={loading}
                            style={{ 
                                width: 120,
                                fontSize: '14px'
                            }}
                            size="middle"
                            placeholder="选择年份"
                            dropdownStyle={{
                                borderRadius: '12px',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                border: 'none'
                            }}
                            className="stats-year-selector-visible"
                        >
                            {years.map(y => (
                                <Option key={y} value={y}>
                                    <span style={{ fontWeight: '500', color: '#333' }}>{y}年</span>
                                </Option>
                            ))}
                        </Select>
                        
                        <Select
                            value={month}
                            onChange={setMonth}
                            disabled={loading}
                            style={{ 
                                width: 100,
                                fontSize: '14px'
                            }}
                            size="middle"
                            placeholder="选择月份"
                            dropdownStyle={{
                                borderRadius: '12px',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                border: 'none'
                            }}
                            className="stats-month-selector-visible"
                        >
                            {months.map(m => (
                                <Option key={m} value={m}>
                                    <span style={{ fontWeight: '500', color: '#333' }}>{m}月</span>
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default StatisticsPage;
