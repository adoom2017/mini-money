import React, { useState, useEffect } from 'react';
import { FiTrash2, FiEdit, FiFilter, FiSearch } from 'react-icons/fi';

const DetailsPage = ({ 
    categoryIconMap, 
    categoryColorMap, 
    fetchWithAuth, 
    showToast, 
    t, 
    lang,
    user,
    onShowAddTransaction
}) => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    
    // 筛选条件
    const [filters, setFilters] = useState({
        dateRange: 'month', // 'week', 'month', '3months', 'year', 'custom'
        type: 'all', // 'all', 'income', 'expense'
        category: 'all',
        searchText: '',
        startDate: '',
        endDate: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        count: 0
    });

    // 格式化日期
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', options);
    };

    // 格式化金额
    const formatAmount = (amount) => {
        return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // 获取日期范围
    const getDateRange = (range) => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (range) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return { start: '', end: '' };
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    };

    // 获取分类数据
    const fetchCategories = async () => {
        try {
            const response = await fetchWithAuth('/api/categories');
            if (response.ok) {
                const data = await response.json();
                // 后端返回的是 {expense: [...], income: [...]}，我们需要合并成一个数组
                const allCategories = [];
                if (data.expense) {
                    allCategories.push(...data.expense.map(cat => cat.key));
                }
                if (data.income) {
                    allCategories.push(...data.income.map(cat => cat.key));
                }
                // 去重
                const uniqueCategories = [...new Set(allCategories)];
                setCategories(uniqueCategories);
            } else {
                console.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // 获取交易数据
    const fetchTransactions = async (currentFilters = filters) => {
        setLoading(true);
        try {
            let url = '/api/transactions';
            const params = new URLSearchParams();

            // 根据筛选条件构建查询参数
            if (currentFilters.dateRange !== 'custom') {
                const { start, end } = getDateRange(currentFilters.dateRange);
                if (start && end) {
                    // 对于跨月查询，使用start_date和end_date参数
                    params.append('start_date', start);
                    params.append('end_date', end);
                }
            } else if (currentFilters.startDate && currentFilters.endDate) {
                // 自定义日期范围
                params.append('start_date', currentFilters.startDate);
                params.append('end_date', currentFilters.endDate);
            }

            if (currentFilters.type !== 'all') {
                params.append('type', currentFilters.type);
            }

            // 注意：后端不直接支持分类筛选，我们在前端处理

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetchWithAuth(url);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data || []);
            } else {
                console.error('Failed to fetch transactions');
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // 筛选和搜索交易
    const filterTransactions = () => {
        let filtered = [...transactions];

        // 分类筛选（前端处理）
        if (filters.category !== 'all') {
            filtered = filtered.filter(transaction => 
                transaction.categoryKey === filters.category
            );
        }

        // 日期范围筛选（前端处理，用于更精确的日期筛选）
        if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
            
            filtered = filtered.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        } else if (filters.dateRange !== 'month' && filters.dateRange !== 'custom') {
            // 对于其他日期范围，进行前端筛选以获得更精确的结果
            const { start, end } = getDateRange(filters.dateRange);
            if (start && end) {
                const startDate = new Date(start);
                const endDate = new Date(end);
                
                filtered = filtered.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
            }
        }

        // 文本搜索
        if (filters.searchText) {
            const searchText = filters.searchText.toLowerCase();
            filtered = filtered.filter(transaction => 
                transaction.description?.toLowerCase().includes(searchText) ||
                transaction.categoryKey?.toLowerCase().includes(searchText)
            );
        }

        setFilteredTransactions(filtered);

        // 计算汇总信息
        const summary = filtered.reduce((acc, transaction) => {
            acc.count++;
            if (transaction.type === 'income') {
                acc.totalIncome += transaction.amount;
            } else {
                acc.totalExpense += transaction.amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0, count: 0 });

        summary.balance = summary.totalIncome - summary.totalExpense;
        setSummary(summary);
    };

    // 删除交易
    const deleteTransaction = async (id) => {
        if (!window.confirm('确定要删除这笔交易吗？')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/transactions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('交易删除成功', 'success');
                fetchTransactions(); // 重新获取数据
            } else {
                showToast('删除失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showToast('删除失败', 'error');
        }
    };

    // 处理筛选条件变化
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // 应用筛选
    const applyFilters = async () => {
        // 重新获取数据（会根据筛选条件获取相应数据）
        await fetchTransactions(filters);
        setShowFilters(false);
    };

    // 重置筛选
    const resetFilters = async () => {
        const defaultFilters = {
            dateRange: 'month',
            type: 'all',
            category: 'all',
            searchText: '',
            startDate: '',
            endDate: ''
        };
        setFilters(defaultFilters);
        // 重置后重新获取数据
        await fetchTransactions(defaultFilters);
    };

    useEffect(() => {
        fetchCategories();
        fetchTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [transactions, filters.searchText, filters.category, filters.startDate, filters.endDate]);

    return (
        <div className="assets-inner-content">
            <div className="details-page">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i className="fas fa-list-ul me-2"></i>
                        交易明细
                    </h2>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            background: 'linear-gradient(135deg, #e8e3ff, #d1c9ff)',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '0.6rem 1.2rem',
                            color: '#5a4fcf',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(209, 201, 255, 0.3)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(209, 201, 255, 0.4)';
                            e.target.style.background = 'linear-gradient(135deg, #d1c9ff, #c4b8ff)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(209, 201, 255, 0.3)';
                            e.target.style.background = 'linear-gradient(135deg, #e8e3ff, #d1c9ff)';
                        }}
                    >
                        <FiFilter />
                        筛选
                    </button>
                </div>

            {/* 筛选面板 */}
            {showFilters && (
                <div className="filter-panel card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            {/* 日期范围 */}
                            <div className="col-md-3">
                                <label className="form-label">时间范围</label>
                                <select 
                                    className="form-select form-select-sm"
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                >
                                    <option value="week">最近一周</option>
                                    <option value="month">最近一个月</option>
                                    <option value="3months">最近三个月</option>
                                    <option value="year">最近一年</option>
                                    <option value="custom">自定义</option>
                                </select>
                            </div>

                            {/* 自定义日期范围 */}
                            {filters.dateRange === 'custom' && (
                                <>
                                    <div className="col-md-3">
                                        <label className="form-label">开始日期</label>
                                        <input 
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">结束日期</label>
                                        <input 
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* 交易类型 */}
                            <div className="col-md-3">
                                <label className="form-label">类型</label>
                                <select 
                                    className="form-select form-select-sm"
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                >
                                    <option value="all">全部</option>
                                    <option value="income">收入</option>
                                    <option value="expense">支出</option>
                                </select>
                            </div>

                            {/* 分类 */}
                            <div className="col-md-3">
                                <label className="form-label">分类</label>
                                <select 
                                    className="form-select form-select-sm"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    <option value="all">全部分类</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {t(category)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={resetFilters}
                            >
                                重置
                            </button>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={applyFilters}
                            >
                                应用筛选
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 搜索框 */}
            <div className="search-box mb-4">
                <div className="input-group" style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    <span className="input-group-text" style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#667eea',
                        padding: '1rem 1.25rem',
                        fontSize: '1.1rem'
                    }}>
                        <FiSearch />
                    </span>
                    <input 
                        type="text"
                        className="search-input-custom"
                        placeholder="搜索交易描述..."
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '1rem 1.25rem',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: 'none',

                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            width: '100%',
                            flex: '1'
                        }}
                        onFocus={(e) => {
                            e.target.style.outline = 'none !important';
                            e.target.style.boxShadow = 'none !important';
                            e.target.style.border = 'none !important';
                            e.target.style.borderColor = 'transparent !important';
                            // 为整个容器添加微妙的焦点效果
                            e.target.parentElement.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.12)';
                            e.target.parentElement.style.transform = 'translateY(-1px)';
                        }}
                        onBlur={(e) => {
                            // 恢复原始阴影
                            e.target.parentElement.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)';
                            e.target.parentElement.style.transform = 'translateY(0)';
                        }}
                    />
                </div>
            </div>

            {/* 汇总信息 */}
            <div className="summary-cards row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card text-center" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                    }}>
                        <div className="card-body" style={{ padding: '1.5rem' }}>
                            <h6 className="card-title text-muted" style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '500',
                                marginBottom: '0.75rem',
                                color: '#6c757d'
                            }}>总收入</h6>
                            <h4 className="text-success" style={{ 
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                margin: 0,
                                color: '#28a745'
                            }}>{formatAmount(summary.totalIncome)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                    }}>
                        <div className="card-body" style={{ padding: '1.5rem' }}>
                            <h6 className="card-title text-muted" style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '500',
                                marginBottom: '0.75rem',
                                color: '#6c757d'
                            }}>总支出</h6>
                            <h4 className="text-danger" style={{ 
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                margin: 0,
                                color: '#dc3545'
                            }}>{formatAmount(summary.totalExpense)}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                    }}>
                        <div className="card-body" style={{ padding: '1.5rem' }}>
                            <h6 className="card-title text-muted" style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '500',
                                marginBottom: '0.75rem',
                                color: '#6c757d'
                            }}>净收益</h6>
                            <h4 className={summary.balance >= 0 ? 'text-success' : 'text-danger'} style={{ 
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                margin: 0,
                                color: summary.balance >= 0 ? '#28a745' : '#dc3545'
                            }}>
                                {formatAmount(summary.balance)}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                    }}>
                        <div className="card-body" style={{ padding: '1.5rem' }}>
                            <h6 className="card-title text-muted" style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '500',
                                marginBottom: '0.75rem',
                                color: '#6c757d'
                            }}>交易数量</h6>
                            <h4 className="text-info" style={{ 
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                margin: 0,
                                color: '#17a2b8'
                            }}>{summary.count}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* 交易列表 */}
            <div className="transactions-list">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">加载中...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p className="text-muted">暂无交易记录</p>
                    </div>
                ) : (
                    <div className="details-table-container" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        padding: '0',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0" style={{
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}>
                                <thead className="table-light" style={{
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <tr>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>日期</th>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>分类</th>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>描述</th>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>类型</th>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>金额</th>
                                        <th style={{ 
                                            borderTop: 'none',
                                            padding: '1rem 1.25rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            fontSize: '0.9rem'
                                        }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction, index) => (
                                        <tr key={transaction.id} style={{
                                            borderBottom: index === filteredTransactions.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                                            transition: 'background-color 0.2s ease'
                                        }}>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle'
                                            }}>{formatDate(transaction.date)}</td>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle'
                                            }}>
                                                <span className="category-badge" style={{
                                                    backgroundColor: 'transparent',
                                                    color: categoryColorMap.get(transaction.categoryKey) || '#6c757d',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85em',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    border: `1px solid ${categoryColorMap.get(transaction.categoryKey) || '#6c757d'}`,
                                                    fontWeight: '500',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <span style={{ fontSize: '1.1em' }}>
                                                        {categoryIconMap.get(transaction.categoryKey) || '📝'}
                                                    </span>
                                                    <span>{t(transaction.categoryKey)}</span>
                                                </span>
                                            </td>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle',
                                                color: '#6c757d'
                                            }}>{transaction.description || '-'}</td>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle'
                                            }}>
                                                <span className={`badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}`} style={{
                                                    borderRadius: '12px',
                                                    padding: '6px 12px',
                                                    fontSize: '0.8em',
                                                    fontWeight: '500'
                                                }}>
                                                    {transaction.type === 'income' ? '收入' : '支出'}
                                                </span>
                                            </td>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle'
                                            }}>
                                                <span className={transaction.type === 'income' ? 'text-success' : 'text-danger'} style={{
                                                    fontWeight: '600',
                                                    fontSize: '1rem'
                                                }}>
                                                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
                                                </span>
                                            </td>
                                            <td style={{ 
                                                padding: '1rem 1.25rem',
                                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                                verticalAlign: 'middle'
                                            }}>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => deleteTransaction(transaction.id)}
                                                    title="删除"
                                                    style={{
                                                        borderRadius: '8px',
                                                        padding: '6px 12px',
                                                        border: '1px solid #dc3545',
                                                        backgroundColor: 'transparent',
                                                        color: '#dc3545',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#dc3545';
                                                        e.target.style.color = 'white';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = 'transparent';
                                                        e.target.style.color = '#dc3545';
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 悬浮的添加按钮 */}
            <button 
                className="floating-add-btn"
                onClick={onShowAddTransaction}
                title={t('addTransaction', '记一笔')}
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
        </div>
    );
};

export default DetailsPage;