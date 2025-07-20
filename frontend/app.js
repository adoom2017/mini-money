const translations = {
    en: {
        // General
        currencySymbol: "$",
        title: "Simple Bookkeeping",
        bookkeeping: "Bookkeeping",
        statistics: "Statistics",
        totalIncome: "Total Income",
        totalExpense: "Total Expense",
        balance: "Balance",
        expense: "Expense",
        income: "Income",
        amount: "Amount",
        category: "Category",
        description: "Description (Optional)",
        description_placeholder: "Add a note...",
        save: "Save",
        recentTransactions: "Recent Transactions",
        // Statistics Page
        statistics_title: "Monthly Statistics",
        select_year: "Select Year",
        select_month: "Select Month",
        monthly_summary: "Monthly Summary",
        category_breakdown: "Category Breakdown",
        loading: "Loading...",
        error_fetching_stats: "Error fetching statistics.",
        no_data_period: "No data for this period.",
        // Records Page
        records: "Records",
        records_title: "Transaction Records",
        all_records: "All Records",
        filter_by_type: "Filter by Type",
        all_types: "All Types",
        search_description: "Search by description...",
        no_records: "No records found.",
        edit: "Edit",
        delete: "Delete",
        confirm_delete: "Are you sure you want to delete this transaction?",
        // Categories
        food: "Food", medical: "Medical", transport: "Transport", housing: "Housing", snacks: "Snacks",
        learning: "Learning", communication: "Communication", social: "Social", investment: "Investment", shopping: "Shopping",
        salary: "Salary", part_time: "Part-time", financial: "Financial", red_packet: "Red Packet", other: "Other",
    },
    zh: {
        // General
        currencySymbol: "¥",
        title: "极简记账",
        bookkeeping: "记账",
        statistics: "统计",
        totalIncome: "总收入",
        totalExpense: "总支出",
        balance: "余额",
        expense: "支出",
        income: "收入",
        amount: "金额",
        category: "分类",
        description: "备注 (可选)",
        description_placeholder: "添加备注...",
        save: "保存",
        recentTransactions: "最近的交易",
        // Statistics Page
        statistics_title: "月度统计",
        select_year: "选择年份",
        select_month: "选择月份",
        monthly_summary: "本月小结",
        category_breakdown: "分类排行",
        loading: "加载中...",
        error_fetching_stats: "加载统计数据失败。",
        no_data_period: "该时段无数据。",
        // Records Page
        records: "记录",
        records_title: "交易记录",
        all_records: "全部记录",
        filter_by_type: "按类型筛选",
        all_types: "全部类型",
        search_description: "搜索备注...",
        no_records: "暂无记录。",
        edit: "编辑",
        delete: "删除",
        confirm_delete: "确定要删除这条记录吗？",
        // Categories
        food: "早午晚餐", medical: "医疗", transport: "出行交通", housing: "住房", snacks: "零食烟酒",
        learning: "学习", communication: "通讯", social: "社交", investment: "金融投资", shopping: "购物",
        salary: "工资", part_time: "兼职", financial: "理财", red_packet: "红包", other: "其他",
    }
};

const App = () => {
    const [lang, setLang] = React.useState('zh');
    const [page, setPage] = React.useState('bookkeeping');
    const [allCategories, setAllCategories] = React.useState({ expense: [], income: [] });
    const t = (key) => translations[lang][key] || key;

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setAllCategories(data);
        } catch (error) { console.error('Error fetching categories:', error); }
    };

    React.useEffect(() => {
        fetchCategories();
    }, []);
    
    const categoryIconMap = React.useMemo(() => {
        const map = new Map();
        if (allCategories.expense) {
            allCategories.expense.forEach(c => map.set(c.key, c.icon));
        }
        if (allCategories.income) {
            allCategories.income.forEach(c => map.set(c.key, c.icon));
        }
        return map;
    }, [allCategories]);

    const commonProps = { lang, t, allCategories, categoryIconMap };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h1 className="mb-0">{t('title')}</h1>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
                    {lang === 'en' ? '中文' : 'English'}
                </button>
            </div>

            <ul className="nav nav-tabs main-nav">
                <li className="nav-item">
                    <a className={`nav-link ${page === 'bookkeeping' ? 'active' : ''}`} href="#" onClick={() => setPage('bookkeeping')}>{t('bookkeeping')}</a>
                </li>
                <li className="nav-item">
                    <a className={`nav-link ${page === 'records' ? 'active' : ''}`} href="#" onClick={() => setPage('records')}>{t('records')}</a>
                </li>
                <li className="nav-item">
                    <a className={`nav-link ${page === 'statistics' ? 'active' : ''}`} href="#" onClick={() => setPage('statistics')}>{t('statistics')}</a>
                </li>
            </ul>

            {page === 'bookkeeping' ? <BookkeepingPage {...commonProps} /> : 
             page === 'records' ? <RecordsPage {...commonProps} /> :
             <StatisticsPage {...commonProps} />}
        </div>
    );
};

const BookkeepingPage = ({ lang, t, allCategories, categoryIconMap }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [summary, setSummary] = React.useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [activeTab, setActiveTab] = React.useState('expense');
    const [form, setForm] = React.useState({ amount: '', categoryKey: '', description: '' });

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/transactions');
            const data = await response.json();
            setTransactions(data || []);
        } catch (error) { console.error('Error fetching transactions:', error); }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetch('/api/summary');
            const data = await response.json();
            setSummary(data);
        } catch (error) { console.error('Error fetching summary:', error); }
    };

    const fetchAllData = () => {
        fetchTransactions();
        fetchSummary();
    };

    React.useEffect(fetchAllData, []);
    
    React.useEffect(() => {
        if (allCategories.expense.length > 0 && form.categoryKey === '') {
            setForm(prev => ({...prev, categoryKey: allCategories.expense[0].key}));
        }
    }, [allCategories]);


    const handleAmountChange = (e) => setForm({ ...form, amount: e.target.value });
    const handleDescriptionChange = (e) => setForm({ ...form, description: e.target.value });
    const handleCategoryClick = (categoryKey) => setForm({ ...form, categoryKey });

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        const defaultCategoryKey = allCategories[tab].length > 0 ? allCategories[tab][0].key : '';
        setForm({ ...form, categoryKey: defaultCategoryKey });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.categoryKey) {
            alert('Please enter an amount and select a category.');
            return;
        }
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(form.amount),
                    type: activeTab,
                    categoryKey: form.categoryKey,
                    description: form.description,
                }),
            });
            if (response.ok) {
                setForm({ ...form, amount: '', description: '' });
                fetchAllData();
            } else { console.error('Failed to add transaction'); }
        } catch (error) { console.error('Error adding transaction:', error); }
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', options);
    };

    const renderCategoryGrid = (type) => (
        <div className="row g-2 text-center">
            {(allCategories[type] || []).map(cat => (
                <div className="col-3" key={cat.key}>
                    <div className={`category-item ${form.categoryKey === cat.key ? 'active' : ''}`} onClick={() => handleCategoryClick(cat.key)}>
                        <div className="icon">{cat.icon}</div>
                        <div className="name">{t(cat.key)}</div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <div className="card summary-card shadow-sm">
                <div className="card-body">
                    <div className="row text-center">
                        <div className="col"><h6>{t('totalIncome')}</h6><p className="text-success fs-5 mb-0">{t('currencySymbol')}{summary.totalIncome.toFixed(2)}</p></div>
                        <div className="col"><h6>{t('totalExpense')}</h6><p className="text-danger fs-5 mb-0">{t('currencySymbol')}{summary.totalExpense.toFixed(2)}</p></div>
                        <div className="col"><h6>{t('balance')}</h6><p className="fs-5 mb-0">{t('currencySymbol')}{summary.balance.toFixed(2)}</p></div>
                    </div>
                </div>
            </div>
            <div className="card transaction-form shadow-sm">
                <div className="card-body">
                    <ul className="nav nav-tabs nav-fill mb-3">
                        <li className="nav-item"><a className={`nav-link ${activeTab === 'expense' ? 'active' : ''}`} href="#" onClick={() => handleTabClick('expense')}>{t('expense')}</a></li>
                        <li className="nav-item"><a className={`nav-link ${activeTab === 'income' ? 'active' : ''}`} href="#" onClick={() => handleTabClick('income')}>{t('income')}</a></li>
                    </ul>
                    <div className="mb-3"><label htmlFor="amount" className="form-label">{t('amount')}</label><input type="number" className="form-control" id="amount" name="amount" placeholder="0.00" value={form.amount} onChange={handleAmountChange} required /></div>
                    <div className="mb-3"><label className="form-label">{t('category')}</label>{activeTab === 'expense' ? renderCategoryGrid('expense') : renderCategoryGrid('income')}</div>
                    <div className="mb-3"><label htmlFor="description" className="form-label">{t('description')}</label><input type="text" className="form-control" id="description" name="description" placeholder={t('description_placeholder')} value={form.description} onChange={handleDescriptionChange} /></div>
                    <button type="button" className="btn btn-primary w-100" onClick={handleSubmit}>{t('save')}</button>
                </div>
            </div>
            <div className="transaction-list mt-4">
                <h5 className="mb-3">{t('recentTransactions')}</h5>
                <div className="list-group">
                    {transactions.map(item => (
                        <div key={item.id} className="list-group-item transaction-item">
                            <div className="d-flex align-items-center">
                                <div className="me-3 fs-4">{categoryIconMap.get(item.categoryKey) || '❓'}</div>
                                <div>
                                    <span className="description">{item.description || t(item.categoryKey)}</span>
                                    <small className="d-block text-muted">{formatDate(item.date)}</small>
                                </div>
                            </div>
                            <span className={`amount ${item.type}`}>{item.type === 'income' ? '+' : '-'}{t('currencySymbol')}{item.amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

const StatisticsPage = ({ lang, t, categoryIconMap }) => {
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
            const response = await fetch(`/api/statistics?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setStats(data);
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

const RecordsPage = ({ lang, t, allCategories, categoryIconMap }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filterType, setFilterType] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/transactions');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setTransactions(data || []);
            setFilteredTransactions(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTransactions();
    }, []);

    React.useEffect(() => {
        let filtered = transactions;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType);
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t(item.categoryKey).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredTransactions(filtered);
    }, [transactions, filterType, searchTerm, t]);

    const handleDelete = async (id) => {
        if (confirm(t('confirm_delete'))) {
            try {
                const response = await fetch(`/api/transactions/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchTransactions();
                } else {
                    console.error('Failed to delete transaction');
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', options);
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-5">{t('loading')}</div>;
        if (error) return <div className="alert alert-danger">{t('error_fetching_stats')}</div>;
        if (filteredTransactions.length === 0) {
            return <div className="text-center p-5">{t('no_records')}</div>;
        }

        return (
            <div className="list-group">
                {filteredTransactions.map(item => (
                    <div key={item.id} className="list-group-item transaction-item">
                        <div className="transaction-left">
                            <div className="me-3 fs-4">{categoryIconMap.get(item.categoryKey) || '❓'}</div>
                            <div>
                                <div className="description">{item.description || t(item.categoryKey)}</div>
                                <small className="d-block text-muted">{formatDate(item.date)}</small>
                                <small className="d-block text-muted">{t(item.categoryKey)}</small>
                            </div>
                        </div>
                        <div className="transaction-right">
                            <span className={`amount ${item.type} fs-5`}>
                                {item.type === 'income' ? '+' : '-'}{t('currencySymbol')}{item.amount.toFixed(2)}
                            </span>
                            <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="records-card shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>{t('records_title')}</h4>
                <div className="records-filter">
                    <select 
                        className="form-select me-2" 
                        value={filterType} 
                        onChange={e => setFilterType(e.target.value)}
                        disabled={loading}
                    >
                        <option value="all">{t('all_types')}</option>
                        <option value="income">{t('income')}</option>
                        <option value="expense">{t('expense')}</option>
                    </select>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('search_description')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>
            
            <div className="mb-3 text-muted">
                {t('all_records')}: {filteredTransactions.length}
            </div>
            
            {renderContent()}
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));