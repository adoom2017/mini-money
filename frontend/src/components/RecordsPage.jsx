import React from 'react';

const RecordsPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filterType, setFilterType] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
    const [filterMonth, setFilterMonth] = React.useState('all');
    const [allTransactions, setAllTransactions] = React.useState([]); // Store all transactions for month options

    // Fetch all transactions once for month options
    const fetchAllTransactions = async () => {
        try {
            const response = await fetchWithAuth('/api/transactions');
            if (response.ok) {
                const data = await response.json();
                console.log('All transactions for month options:', data);
                setAllTransactions(data || []);
            }
        } catch (error) {
            console.error('Error fetching all transactions for month options:', error);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // 构建查询参数
            const params = new URLSearchParams();
            
            if (filterType !== 'all') {
                params.append('type', filterType);
            }
            
            if (filterMonth !== 'all') {
                params.append('month', filterMonth);
            }
            
            if (debouncedSearchTerm.trim()) {
                params.append('search', debouncedSearchTerm.trim());
            }
            
            const url = `/api/transactions${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetchWithAuth(url);
            
            if (response.ok) {
                const data = await response.json();
                setTransactions(data || []);
                setFilteredTransactions(data || []);
            } else if (response.status === 401) {
                // 401 is handled by fetchWithAuth, just clear data
                setTransactions([]);
                setFilteredTransactions([]);
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
        fetchAllTransactions(); // Fetch all transactions once for month options
        fetchTransactions(); // Fetch filtered transactions
    }, []);

    // Debounce search term
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

    React.useEffect(() => {
        fetchTransactions();
    }, [filterType, filterMonth, debouncedSearchTerm]);

    // Remove the old client-side filtering useEffect since we now filter on the server

    const handleDelete = async (id) => {
        if (confirm(t('confirm_delete'))) {
            try {
                const response = await fetchWithAuth(`/api/transactions/${id}`, {
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

    // Generate available months from all transactions
    const getAvailableMonths = () => {
        const months = new Set();
        console.log('Processing transactions for months:', allTransactions);
        allTransactions.forEach(item => {
            // Parse Go's time format: "2025-07-21 13:07:14.189539231 +0000 UTC"
            // Extract just the year-month part
            const dateStr = item.date.toString();
            console.log('Processing date:', dateStr);
            const match = dateStr.match(/^(\d{4})-(\d{2})/);
            if (match) {
                const monthKey = `${match[1]}-${match[2]}`;
                console.log('Found month:', monthKey);
                months.add(monthKey);
            }
        });
        
        const result = Array.from(months).sort().reverse(); // Most recent first
        console.log('Available months:', result);
        return result;
    };

    const formatMonthDisplay = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
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
                <div className="records-filter d-flex gap-2">
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        disabled={loading}
                        style={{ minWidth: '120px' }}
                    >
                        <option value="all">{t('all_types')}</option>
                        <option value="income">{t('income')}</option>
                        <option value="expense">{t('expense')}</option>
                    </select>
                    <select
                        className="form-select"
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                        disabled={loading}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">{lang === 'zh' ? '所有月份' : 'All Months'}</option>
                        {getAvailableMonths().map(month => (
                            <option key={month} value={month}>
                                {formatMonthDisplay(month)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('search_description')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        disabled={loading}
                        style={{ minWidth: '200px' }}
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

export default RecordsPage;
