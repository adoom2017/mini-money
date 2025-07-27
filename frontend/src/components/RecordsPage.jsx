import React from 'react';

const RecordsPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth, showToast }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState(''); // 实际用于搜索的值
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(null);
    const [dayTransactions, setDayTransactions] = React.useState([]);
    const [monthStats, setMonthStats] = React.useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    });

    // 获取交易数据
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // 获取当前月份的交易数据
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;

            const queryParams = new URLSearchParams();
            queryParams.append('month', monthKey);
            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }

            const response = await fetchWithAuth(`/api/transactions?${queryParams.toString()}`);
            
            // 检查响应是否成功
            if (!response.ok) {
                if (response.status === 401) {
                    // 401错误由fetchWithAuth处理，不显示错误
                    setTransactions([]);
                    setMonthStats({ totalIncome: 0, totalExpense: 0, balance: 0 });
                    setError(null);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 尝试解析JSON
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                // 如果JSON解析失败，检查是否收到了HTML响应
                const text = await response.text();
                if (text.trim().startsWith('<')) {
                    throw new Error('Server returned HTML page instead of JSON data');
                } else {
                    throw new Error('Invalid JSON response from server');
                }
            }
            
            setTransactions(data || []);
            calculateMonthStats(data || []);
            setError(null); // 清除错误状态
        } catch (error) {
            console.error('获取交易记录失败:', error);
            setError('获取交易记录失败: ' + error.message);
            setTransactions([]); // 清空交易数据
            setMonthStats({ totalIncome: 0, totalExpense: 0, balance: 0 }); // 重置统计
        } finally {
            setLoading(false);
        }
    };

    // 计算月度统计
    const calculateMonthStats = (transactionData) => {
        const stats = transactionData.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.totalIncome += transaction.amount;
            } else {
                acc.totalExpense += transaction.amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        stats.balance = stats.totalIncome - stats.totalExpense;
        setMonthStats(stats);
    };

    // 获取指定日期的交易记录
    const getTransactionsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
            return transactionDate === dateStr;
        });
    };

    // 获取日期的统计信息
    const getDayStats = (date) => {
        const dayTransactions = getTransactionsForDate(date);
        return dayTransactions.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.income += transaction.amount;
            } else {
                acc.expense += transaction.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    };

    // 处理日期点击
    const handleDateClick = (date) => {
        setSelectedDate(date);
        const transactions = getTransactionsForDate(date);
        setDayTransactions(transactions);
    };

    // 生成日历天数
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days = [];

        // 添加上个月的日期（空白）
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // 添加当月的日期
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    // 导航到上个月
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    // 导航到下个月
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    // 删除交易
    const handleDeleteTransaction = async (transactionId) => {
        if (!window.confirm('确定要删除这条记录吗？')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/transactions/${transactionId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 刷新数据
            fetchTransactions();
            if (selectedDate) {
                const updatedTransactions = getTransactionsForDate(selectedDate);
                setDayTransactions(updatedTransactions);
            }
            if (showToast) showToast('记录删除成功', 'success');
        } catch (error) {
            console.error('删除记录失败:', error);
            if (showToast) showToast('删除记录失败: ' + error.message, 'error');
        }
    };

    // 处理搜索
    const handleSearch = () => {
        setSearchQuery(searchTerm);
    };

    // 处理回车键搜索
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 清空搜索
    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchQuery('');
    };

    React.useEffect(() => {
        fetchTransactions();
    }, [currentDate, searchQuery]);

    const monthNames = {
        zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };

    const weekDays = {
        zh: ['日', '一', '二', '三', '四', '五', '六'],
        en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">加载中...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="records-card shadow-sm p-4">
            {/* 搜索框 */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        {searchQuery && (
                            <small className="text-muted">
                                搜索: "{searchQuery}"
                            </small>
                        )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                        <div className="position-relative" style={{ width: '300px' }}>
                            <input
                                type="text"
                                className="form-control pe-5"
                                placeholder={t && t('search_description') ? t('search_description') : '搜索备注...'}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
                                style={{ paddingRight: searchQuery ? '80px' : '40px' }}
                            />
                            <button 
                                type="button" 
                                className="btn p-0 position-absolute top-50 translate-middle-y"
                                onClick={handleSearch}
                                title="搜索"
                                style={{ 
                                    right: searchQuery ? '40px' : '10px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#6c757d',
                                    zIndex: 5
                                }}
                            >
                                <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.442 1.398a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11"/>
                                </svg>
                            </button>
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    className="btn p-0 position-absolute top-50 translate-middle-y"
                                    onClick={handleClearSearch}
                                    title="清空搜索"
                                    style={{ 
                                        right: '10px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#6c757d',
                                        zIndex: 5
                                    }}
                                >
                                    <svg width="14" height="14" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 月份统计 */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card text-center bg-success text-white">
                        <div className="card-body">
                            <h6 className="card-title">总收入</h6>
                            <h4>¥{monthStats.totalIncome.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card text-center bg-danger text-white">
                        <div className="card-body">
                            <h6 className="card-title">总支出</h6>
                            <h4>¥{monthStats.totalExpense.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className={`card text-center ${monthStats.balance >= 0 ? 'bg-primary' : 'bg-warning'} text-white`}>
                        <div className="card-body">
                            <h6 className="card-title">结余</h6>
                            <h4>¥{monthStats.balance.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* 日历导航 */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button className="btn btn-outline-primary" onClick={goToPreviousMonth}>
                    ← 上月
                </button>
                <h4 className="mb-0">
                    {currentDate.getFullYear()}年 {monthNames[lang] ? monthNames[lang][currentDate.getMonth()] : monthNames.zh[currentDate.getMonth()]}
                </h4>
                <button className="btn btn-outline-primary" onClick={goToNextMonth}>
                    下月 →
                </button>
            </div>

            {/* 日历 */}
            <div className="calendar-grid">
                {/* 星期标题 */}
                {(weekDays[lang] || weekDays.zh).map((day, index) => (
                    <div key={`header-${index}`} className="calendar-week-header">
                        {day}
                    </div>
                ))}

                {/* 日历天数 */}
                {generateCalendarDays().map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="calendar-empty-day"></div>;
                    }

                    const dayStats = getDayStats(date);
                    const hasTransactions = dayStats.income > 0 || dayStats.expense > 0;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                    return (
                        <div
                            key={`day-${index}`}
                            className={`calendar-day ${hasTransactions ? 'has-transactions' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDateClick(date)}
                        >
                            <div className="calendar-day-content">
                                <span className="calendar-date-number">
                                    {date.getDate()}
                                </span>
                                {hasTransactions && (
                                    <div className="text-end calendar-transaction-amount">
                                        {dayStats.income > 0 && (
                                            <div className="text-success">+¥{dayStats.income.toFixed(0)}</div>
                                        )}
                                        {dayStats.expense > 0 && (
                                            <div className="text-danger">-¥{dayStats.expense.toFixed(0)}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isToday && (
                                <div className="calendar-today-dot"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 选中日期的交易详情 */}
            {selectedDate && (
                <div className="mt-4">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 交易记录
                            </h5>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSelectedDate(null)}
                            >
                                收起
                            </button>
                        </div>
                        <div className="card-body">
                            {dayTransactions.length === 0 ? (
                                <p className="text-center text-muted mb-0">当日无交易记录</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {dayTransactions.map(transaction => (
                                        <div key={transaction.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <div className="d-flex align-items-center">
                                                <span className="me-3 fs-4">
                                                    {categoryIconMap.get(transaction.categoryKey) || '❓'}
                                                </span>
                                                <div>
                                                    <div className="fw-bold">{transaction.description || (t && t(transaction.categoryKey) ? t(transaction.categoryKey) : transaction.categoryKey)}</div>
                                                    <small className="text-muted">{t && t(transaction.categoryKey) ? t(transaction.categoryKey) : transaction.categoryKey}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={`fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                                    {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
                                                </span>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecordsPage;
