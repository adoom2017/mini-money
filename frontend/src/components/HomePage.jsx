import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import ModernBarChart from './ModernBarChart';
import ModernPieChart from './ModernPieChart';
import ModernCalendar from './ModernCalendar';
import ConfirmModal from './ConfirmModal';
import { useConfirm } from '../utils/useConfirm';

const HomePage = ({ 
    categoryIconMap, 
    categoryColorMap, 
    fetchWithAuth, 
    showToast, 
    t, 
    lang,
    user,
    onShowAddTransaction,
    refreshTrigger 
}) => {
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    });
    const [categoryStats, setCategoryStats] = useState([]);
    const [incomeStats, setIncomeStats] = useState([]);
    const [expenseStats, setExpenseStats] = useState([]);
    const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
    const [dailyStats, setDailyStats] = useState([]); // 按天的收支统计
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date()); // 选中的日期，默认为今天
    const [selectedDateTransactions, setSelectedDateTransactions] = useState([]); // 选中日期的交易明细
    const [currentMonth, setCurrentMonth] = useState(new Date()); // 当前选中的月份
    
    const { confirmState, showConfirm } = useConfirm();

    // 格式化日期
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', options);
    };

    // 获取统计数据和分类统计
    const fetchStats = async (targetMonth = currentMonth) => {
        try {
            const year = targetMonth.getFullYear();
            const month = targetMonth.getMonth() + 1;
            
            // 获取指定月份的统计数据（包含汇总和分类明细）
            const statsResponse = await fetchWithAuth(`/api/statistics?year=${year}&month=${month}`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('Monthly stats data:', statsData);
                
                // 设置月度汇总数据
                setStats(statsData.summary || { totalIncome: 0, totalExpense: 0, balance: 0 });
                
                // 设置分类统计数据
                setExpenseStats(statsData.expenseBreakdown || []);
                setIncomeStats(statsData.incomeBreakdown || []);
                // 保持向后兼容，默认显示支出
                setCategoryStats(statsData.expenseBreakdown || []);
            } else {
                console.error('Failed to fetch monthly stats:', statsResponse.status, statsResponse.statusText);
                showToast(lang === 'zh' ? '获取月度统计失败' : 'Failed to fetch monthly stats', 'error');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            showToast(lang === 'zh' ? '网络错误' : 'Network error', 'error');
        }
    };

    // 获取当前月份按天的收支统计
    const fetchDailyStats = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        await fetchDailyStatsForMonth(year, month);
    };

    // 获取指定月份按天的收支统计
    const fetchDailyStatsForMonth = async (year, month) => {
        try {
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
            
            console.log('Fetching daily stats for month:', monthStr);
            
            // 更新当前选中的月份
            const targetMonth = new Date(year, month - 1, 1);
            setCurrentMonth(targetMonth);
            
            // 获取指定月份的所有交易
            const response = await fetchWithAuth(`/api/transactions?month=${monthStr}`);
            console.log('Daily stats API response status:', response.status, response.statusText);
            
            if (response.ok) {
                const transactions = await response.json();
                console.log('Transactions for daily stats:', transactions);
                console.log('Number of transactions:', transactions.length);
                
                // 处理按天统计
                const dailyData = processDailyStats(transactions, year, month);
                console.log('Setting daily stats:', dailyData);
                setDailyStats(dailyData);
                
                // 同时更新该月份的汇总统计
                await fetchStats(targetMonth);
            } else {
                console.error('Failed to fetch transactions for daily stats:', response.status, response.statusText);
                
                // 如果是401错误，说明用户未登录
                if (response.status === 401) {
                    console.log('User not authenticated, cannot fetch daily stats');
                    return;
                }
                
                showToast(lang === 'zh' ? '获取日统计失败' : 'Failed to fetch daily stats', 'error');
            }
        } catch (error) {
            console.error('Error fetching daily stats:', error);
            showToast(lang === 'zh' ? '网络错误' : 'Network error', 'error');
        }
    };

    // 处理按天统计数据
    const processDailyStats = (transactions, year, month) => {
        console.log('Processing daily stats:', { transactions, year, month });
        
        // 获取该月的总天数
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // 创建按天分组的数据，初始化所有日期为0
        const dailyMap = new Map();
        
        // 先为该月的每一天初始化数据
        for (let day = 1; day <= daysInMonth; day++) {
            dailyMap.set(day, { day, income: 0, expense: 0 });
        }
        
        // 然后处理实际的交易数据
        if (transactions && transactions.length > 0) {
            transactions.forEach(t => {
                const transactionDate = new Date(t.date);
                const day = transactionDate.getDate();
                
                // 确保该日期在当前月份范围内
                if (day >= 1 && day <= daysInMonth) {
                    if (t.type === 'income') {
                        dailyMap.get(day).income += t.amount;
                    } else if (t.type === 'expense') {
                        dailyMap.get(day).expense += t.amount;
                    }
                }
            });
        }
        
        // 转换为数组并排序
        const dailyData = Array.from(dailyMap.values())
            .sort((a, b) => a.day - b.day)
            .map(item => ({
                ...item,
                date: `${year}-${month.toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`
            }));
        
        console.log('Processed daily data with all days:', dailyData);
        return dailyData;
    };

    // 处理日历日期点击
    const handleDateClick = async (clickedDate) => {
        try {
            setSelectedDate(clickedDate);
            
            // 格式化日期为YYYY-MM-DD格式（使用本地时间而不是UTC）
            const year = clickedDate.getFullYear();
            const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
            const day = String(clickedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            console.log('Clicked date:', clickedDate, 'Formatted date:', dateStr);
            
            // 获取该日期的交易记录
            const response = await fetchWithAuth(`/api/transactions?date=${dateStr}`);
            if (response.ok) {
                const transactions = await response.json();
                setSelectedDateTransactions(transactions);
            } else {
                console.error('Failed to fetch date transactions');
                setSelectedDateTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching date transactions:', error);
            setSelectedDateTransactions([]);
        }
    };

    // 删除交易
    const deleteTransaction = async (id) => {
        const confirmed = await showConfirm({
            title: lang === 'zh' ? '删除交易' : 'Delete Transaction',
            message: lang === 'zh' ? '确定要删除这条交易记录吗？此操作无法撤销。' : 'Are you sure you want to delete this transaction? This action cannot be undone.',
            confirmText: lang === 'zh' ? '删除' : 'Delete',
            cancelText: lang === 'zh' ? '取消' : 'Cancel',
            confirmType: 'danger'
        });

        if (!confirmed) return;

        try {
            const response = await fetchWithAuth(`/api/transactions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast(lang === 'zh' ? '删除成功！' : 'Deleted successfully!');
                fetchStats();
                fetchDailyStats();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showToast(lang === 'zh' ? '删除失败' : 'Delete failed', 'error');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchStats(), fetchDailyStats()]);
            
            // 初始化时自动加载今天的交易
            const today = new Date();
            await handleDateClick(today);
            
            setLoading(false);
        };
        
        loadData();
    }, [refreshTrigger]);

    // 监听activeTab变化，更新categoryStats
    useEffect(() => {
        setCategoryStats(getCurrentCategoryStats());
    }, [activeTab, expenseStats, incomeStats]);

    // 获取当前选中标签页对应的分类统计数据
    const getCurrentCategoryStats = () => {
        return activeTab === 'expense' ? expenseStats : incomeStats;
    };

    // 刷新数据
    const refreshData = () => {
        fetchStats();
        fetchDailyStats();
    };

    const formatCurrency = (amount) => {
        const symbol = t('currencySymbol');
        return `${symbol}${Math.abs(amount).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">{t('loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="new-homepage-layout">
            {/* 顶部区域 */}
            <div className="top-section">
                {/* 月份标题 */}
                <div className="month-header">
                    <h2>{currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}财务概览</h2>
                </div>
                
                {/* 统计卡片区域 */}
                <div className="stats-cards-container">
                    <div className="stats-card expense-card">
                        <div className="stats-icon">
                            <i className="fas fa-arrow-down"></i>
                        </div>
                        <div className="stats-content">
                            <div className="stats-label">支出</div>
                            <div className="stats-amount">{Math.abs(stats.totalExpense).toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div className="stats-card income-card">
                        <div className="stats-icon">
                            <i className="fas fa-arrow-up"></i>
                        </div>
                        <div className="stats-content">
                            <div className="stats-label">收入</div>
                            <div className="stats-amount">{Math.abs(stats.totalIncome).toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div className="stats-card balance-card">
                        <div className="stats-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="stats-content">
                            <div className="stats-label">结余</div>
                            <div className="stats-amount">{stats.balance.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 主要内容区域 */}
            <div className="main-content-area">
                {/* 左侧图表区域 */}
                <div className="charts-section">
                    <div className="section-title">
                        <FiRefreshCw className="section-icon" />
                        收支分析
                    </div>
                    
                    {/* 现代化柱状图 */}
                    <div className="modern-chart-container">
                        <ModernBarChart dailyStats={dailyStats} t={t} />
                    </div>

                    {/* 现代化饼图区域 */}
                    <div className="pie-chart-container">
                        {/* 标签页导航 */}
                        <div className="tab-navigation">
                            <button 
                                className={`tab-button ${activeTab === 'expense' ? 'active' : ''}`}
                                onClick={() => setActiveTab('expense')}
                            >
                                {t('expense')}
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'income' ? 'active' : ''}`}
                                onClick={() => setActiveTab('income')}
                            >
                                {t('income')}
                            </button>
                        </div>
                        
                        <ModernPieChart 
                            categoryStats={getCurrentCategoryStats()} 
                            activeTab={activeTab}
                            t={t} 
                        />
                    </div>
                </div>

                {/* 右侧日历和交易记录区域 */}
                <div className="sidebar-section">
                    {/* 现代化日历 */}
                    <ModernCalendar 
                        dailyStats={dailyStats} 
                        t={t} 
                        fetchDailyStatsForMonth={fetchDailyStatsForMonth}
                        onDateClick={handleDateClick}
                        selectedDateTransactions={selectedDateTransactions}
                        selectedDate={selectedDate}
                        categoryIconMap={categoryIconMap}
                    />
                </div>
            </div>
            
            {/* 确认删除对话框 */}
            <ConfirmModal
                show={confirmState.show}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                confirmType={confirmState.confirmType}
                onConfirm={confirmState.onConfirm}
                onCancel={confirmState.onCancel}
            />
        </div>
    );
};

export default HomePage;
