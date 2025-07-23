const RecordsPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth }) => {
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
            const response = await fetchWithAuth('/api/transactions');
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

// Export for global access
window.RecordsPage = RecordsPage;
