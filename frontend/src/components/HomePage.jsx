import React, { useState, useEffect } from 'react';
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
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const { confirmState, showConfirm } = useConfirm();

    // 格式化日期
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', options);
    };

    // 获取统计数据
    const fetchStats = async () => {
        try {
            const response = await fetchWithAuth('/api/summary');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // 获取最近的交易记录
    const fetchRecentTransactions = async () => {
        try {
            const response = await fetchWithAuth('/api/transactions?limit=10');
            if (response.ok) {
                const data = await response.json();
                setRecentTransactions(data);
            }
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
            showToast('获取交易记录失败', 'error');
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
                fetchRecentTransactions();
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
            await Promise.all([fetchStats(), fetchRecentTransactions()]);
            setLoading(false);
        };
        
        loadData();
    }, [refreshTrigger]);

    // 刷新数据
    const refreshData = () => {
        fetchStats();
        fetchRecentTransactions();
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
        <div className="row">
            <div className="col-12">
                {/* 欢迎信息 */}
                <div className="welcome-section mb-4">
                    <h2 className="h4 mb-3">
                        {user ? `${t('welcome')}, ${user.username}!` : t('welcome')}
                    </h2>
                </div>

                {/* 统计卡片 */}
                <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                        <div className="card text-center h-100 border-success">
                            <div className="card-body">
                                <div className="text-success mb-2">
                                    <i className="fas fa-arrow-up fa-2x"></i>
                                </div>
                                <h5 className="card-title text-success">{t('totalIncome')}</h5>
                                <h3 className="card-text text-success">
                                    {formatCurrency(stats.totalIncome)}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card text-center h-100 border-danger">
                            <div className="card-body">
                                <div className="text-danger mb-2">
                                    <i className="fas fa-arrow-down fa-2x"></i>
                                </div>
                                <h5 className="card-title text-danger">{t('totalExpense')}</h5>
                                <h3 className="card-text text-danger">
                                    {formatCurrency(stats.totalExpense)}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className={`card text-center h-100 ${stats.balance >= 0 ? 'border-primary' : 'border-warning'}`}>
                            <div className="card-body">
                                <div className={`${stats.balance >= 0 ? 'text-primary' : 'text-warning'} mb-2`}>
                                    <i className="fas fa-wallet fa-2x"></i>
                                </div>
                                <h5 className={`card-title ${stats.balance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                    {t('balance')}
                                </h5>
                                <h3 className={`card-text ${stats.balance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                    {formatCurrency(stats.balance)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 添加交易按钮 */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">{t('recentTransactions')}</h4>
                    <button 
                        className="btn btn-primary"
                        onClick={onShowAddTransaction}
                    >
                        <i className="fas fa-plus me-2"></i>
                        {lang === 'zh' ? '添加交易' : 'Add Transaction'}
                    </button>
                </div>

                {/* 最近交易列表 */}
                <div className="card">
                    <div className="card-body">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <i className="fas fa-receipt fa-3x mb-3 opacity-50"></i>
                                <p>{t('no_transactions_yet')}</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={onShowAddTransaction}
                                >
                                    {lang === 'zh' ? '添加第一笔交易' : 'Add your first transaction'}
                                </button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('category')}</th>
                                            <th>{t('description')}</th>
                                            <th>{t('amount')}</th>
                                            <th>{lang === 'zh' ? '日期' : 'Date'}</th>
                                            <th>{lang === 'zh' ? '操作' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map(transaction => (
                                            <tr key={transaction.id}>
                                                <td>
                                                    <span 
                                                        className="me-2"
                                                        style={{
                                                            fontSize: '1.2rem'
                                                        }}
                                                    >
                                                        {categoryIconMap.get(transaction.categoryKey) || '📝'}
                                                    </span>
                                                    {t(transaction.categoryKey)}
                                                </td>
                                                <td>{transaction.description || '-'}</td>
                                                <td>
                                                    <span className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                                                        {transaction.type === 'income' ? '+' : '-'}
                                                        {formatCurrency(transaction.amount)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatDate(transaction.date)}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => deleteTransaction(transaction.id)}
                                                        title={t('delete')}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 刷新按钮 */}
                <div className="text-center mt-3">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={refreshData}
                    >
                        <i className="fas fa-sync-alt me-2"></i>
                        {lang === 'zh' ? '刷新数据' : 'Refresh Data'}
                    </button>
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
