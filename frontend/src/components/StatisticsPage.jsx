import React from 'react';

const StatisticsPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [month, setMonth] = React.useState(new Date().getMonth() + 1);
    const [activeTab, setActiveTab] = React.useState('expense');
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    // 定义固定的颜色数组，确保每个分类都有对应的颜色
    const chartColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#C9CBCF', '#E7E9ED', '#7FDBFF', '#F012BE',
        '#FF851B', '#2ECC40', '#FFDC00', '#001F3F', '#85144B'
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
                        borderWidth: 1,
                    }]
                };

                try {
                    chartInstance.current = new Chart(chartRef.current, {
                        type: 'doughnut',
                        data: chartData,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            animation: {
                                animateRotate: true,
                                animateScale: false
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
        if (loading) return <div className="text-center p-5">{t('loading')}</div>;
        if (error) return <div className="alert alert-danger">{t('error_fetching_stats')}</div>;
        if (!stats || (stats.summary.totalIncome === 0 && stats.summary.totalExpense === 0)) {
            return <div className="text-center p-5">{t('no_data_period')}</div>;
        }

        const breakdown = activeTab === 'expense' ? stats.expenseBreakdown : stats.incomeBreakdown;

        return (
            <>
                <div className="row text-center my-4 stats-summary">
                    <div className="col"><h6>{t('totalIncome')}</h6><p className="text-success fs-5 mb-0">{t('currencySymbol')}{stats.summary.totalIncome.toFixed(2)}</p></div>
                    <div className="col"><h6>{t('totalExpense')}</h6><p className="text-danger fs-5 mb-0">{t('currencySymbol')}{stats.summary.totalExpense.toFixed(2)}</p></div>
                    <div className="col"><h6>{t('balance')}</h6><p className="fs-5 mb-0">{t('currencySymbol')}{stats.summary.balance.toFixed(2)}</p></div>
                </div>

                <ul className="nav nav-tabs nav-fill mb-3">
                    <li className="nav-item"><a className={`nav-link ${activeTab === 'expense' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('expense')}>{t('expense')}</a></li>
                    <li className="nav-item"><a className={`nav-link ${activeTab === 'income' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('income')}>{t('income')}</a></li>
                </ul>

                {breakdown.length > 0 ? (
                    <div className="row">
                        <div className="col-md-7 breakdown-list">
                            <ul className="list-group list-group-flush">
                                {breakdown.map((item, index) => (
                                    <li className="list-group-item" key={item.categoryKey}>
                                        <div className="category-info">
                                            <div
                                                className="color-indicator"
                                                style={{ backgroundColor: getCategoryColor(item.categoryKey, index) }}
                                            ></div>
                                            <span className="icon">{categoryIconMap.get(item.categoryKey) || '❓'}</span>
                                            <span>{t(item.categoryKey)}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span>{t('currencySymbol')}{item.amount.toFixed(2)}</span>
                                            <div className="progress"><div className="progress-bar" role="progressbar" style={{width: `${item.percentage}%`}}></div></div>
                                            <span>{item.percentage.toFixed(1)}%</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-md-5 d-flex flex-column align-items-center justify-content-center">
                            <div className="chart-container">
                                <canvas ref={chartRef}></canvas>
                            </div>
                            <div className="chart-legend mt-3">
                                {breakdown.map((item, index) => (
                                    <div key={item.categoryKey} className="legend-item">
                                        <div
                                            className="legend-color"
                                            style={{ backgroundColor: getCategoryColor(item.categoryKey, index) }}
                                        ></div>
                                        <span className="legend-text">{t(item.categoryKey)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-5">{t('no_data_period')}</div>
                )}
            </>
        );
    };

    return (
        <div className="stats-card shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center">
                <h4>{t('statistics_title')}</h4>
                <div className="stats-filter">
                    <select className="form-select" value={year} onChange={e => setYear(e.target.value)} disabled={loading}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="form-select" value={month} onChange={e => setMonth(e.target.value)} disabled={loading}>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default StatisticsPage;
