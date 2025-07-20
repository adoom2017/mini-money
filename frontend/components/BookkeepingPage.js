const BookkeepingPage = ({ lang, t, allCategories, categoryIconMap, fetchWithAuth }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [summary, setSummary] = React.useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [activeTab, setActiveTab] = React.useState('expense');
    const [form, setForm] = React.useState({ amount: '', categoryKey: '', description: '' });

    const fetchTransactions = async () => {
        try {
            const response = await fetchWithAuth('/api/transactions');
            const data = await response.json();
            setTransactions(data || []);
        } catch (error) { console.error('Error fetching transactions:', error); }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetchWithAuth('/api/summary');
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
            const response = await fetchWithAuth('/api/transactions', {
                method: 'POST',
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

// Export for global access
window.BookkeepingPage = BookkeepingPage;
