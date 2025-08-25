// Assets Page Component
import React from 'react';
import AssetTrendChart from './AssetTrendChart.jsx';

const AssetsPage = ({ lang, t, fetchWithAuth, showToast }) => {
    const [assets, setAssets] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showRecordModal, setShowRecordModal] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState(null);
    const [newAsset, setNewAsset] = React.useState({ name: '', category: 'card' });
    const [newRecord, setNewRecord] = React.useState({ date: '', amount: '' });
    const [expandedCharts, setExpandedCharts] = React.useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [assetToDelete, setAssetToDelete] = React.useState(null);

    // 切换图表展开状态
    const toggleChart = (assetId) => {
        setExpandedCharts(prev => ({
            ...prev,
            [assetId]: !prev[assetId]
        }));
    };

    // 资产类别配置
    const assetCategories = {
        card: { name: '信用卡', icon: '💳', color: '#ff6b6b' },
        cash: { name: '资金', icon: '💰', color: '#4ecdc4' },
        investment: { name: '投资理财', icon: '📈', color: '#45b7d1' }
    };

    // Load assets from API
    React.useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth('/api/assets');
            if (response.ok) {
                const data = await response.json();
                // Transform data to match frontend format
                const transformedAssets = data.map(asset => ({
                    id: asset.id,
                    name: asset.name,
                    category: asset.category || 'card', // 默认为信用卡类别
                    records: asset.records || [],
                }));
                setAssets(transformedAssets);
            } else if (response.status !== 401) {
                showToast('Failed to load assets', 'error');
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            showToast('Error loading assets', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Add new asset
    const handleAddAsset = async () => {
        if (!newAsset.name.trim()) {
            showToast('请输入资产名称', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newAsset.name.trim(),
                    category: newAsset.category 
                })
            });

            if (response.ok) {
                const asset = await response.json();
                setAssets([...assets, { 
                    ...asset, 
                    category: newAsset.category,
                    records: [] 
                }]);
                setNewAsset({ name: '', category: 'card' });
                setShowAddModal(false);
                showToast('资产添加成功', 'success');
            } else {
                showToast('添加资产失败', 'error');
            }
        } catch (error) {
            console.error('Error adding asset:', error);
            showToast('添加资产失败', 'error');
        }
    };

    // Add new record for an asset
    const handleAddRecord = async () => {
        if (!selectedAsset || !newRecord.date || !newRecord.amount) {
            showToast('请填写完整的记录信息', 'error');
            return;
        }

        const amount = parseFloat(newRecord.amount);
        if (isNaN(amount)) {
            showToast('请输入有效的金额', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/assets/${selectedAsset.id}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: newRecord.date,
                    amount: amount
                })
            });

            if (response.ok) {
                const record = await response.json();
                setAssets(assets.map(asset => 
                    asset.id === selectedAsset.id 
                        ? { ...asset, records: [...asset.records, record] }
                        : asset
                ));
                setNewRecord({ date: '', amount: '' });
                setShowRecordModal(false);
                showToast('记录添加成功', 'success');
            } else {
                showToast('添加记录失败', 'error');
            }
        } catch (error) {
            console.error('Error adding record:', error);
            showToast('添加记录失败', 'error');
        }
    };

    // Delete asset
    const handleDeleteAsset = async (assetId) => {
        setAssetToDelete(assetId);
        setShowDeleteConfirm(true);
    };

    // Confirm delete asset
    const confirmDeleteAsset = async () => {
        if (!assetToDelete) return;

        try {
            const response = await fetchWithAuth(`/api/assets/${assetToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setAssets(assets.filter(asset => asset.id !== assetToDelete));
                showToast('资产删除成功', 'success');
            } else {
                showToast('删除资产失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            showToast('删除资产失败', 'error');
        } finally {
            setShowDeleteConfirm(false);
            setAssetToDelete(null);
        }
    };

    // Cancel delete asset
    const cancelDeleteAsset = () => {
        setShowDeleteConfirm(false);
        setAssetToDelete(null);
    };

    // Get latest amount for an asset
    const getLatestAmount = (records) => {
        if (!records || records.length === 0) return 0;
        const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedRecords[0].amount || 0;
    };

    // Get total assets value
    const getTotalAssets = () => {
        return assets.reduce((total, asset) => {
            return total + getLatestAmount(asset.records);
        }, 0);
    };

    // Group assets by category
    const groupAssetsByCategory = () => {
        return assets.reduce((groups, asset) => {
            const category = asset.category || 'card';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(asset);
            return groups;
        }, {});
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(amount);
    };

    // Open add record modal
    const openAddRecordModal = (asset) => {
        setSelectedAsset(asset);
        setNewRecord({ 
            date: new Date().toISOString().split('T')[0], 
            amount: '' 
        });
        setShowRecordModal(true);
    };

    if (loading) {
        return <div className="text-center">Loading assets...</div>;
    }

    return (
        <div className="assets-page-mobile">
            {/* 页面头部 */}
            <div className="page-header">
                <h2 className="page-title">资产管理</h2>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    className="add-asset-btn-header"
                >
                    + 添加资产
                </button>
            </div>

            {/* 总资产概览 */}
            <div className="total-assets-card">
                <div className="total-label">净资产</div>
                <div className="total-amount">{formatCurrency(getTotalAssets())}</div>
                <div className="assets-summary">
                    <div className="summary-item">
                        <div className="summary-label">总资产</div>
                        <div className="summary-amount">{formatCurrency(getTotalAssets())}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">总负债</div>
                        <div className="summary-amount">0.00</div>
                    </div>
                </div>
                <div className="income-expense-summary">
                    <div className="summary-item">
                        <span className="income-icon">📥</span>
                        <div>
                            <div className="summary-label">总借入</div>
                            <div className="summary-amount">0.00</div>
                        </div>
                    </div>
                    <div className="summary-item">
                        <span className="expense-icon">📤</span>
                        <div>
                            <div className="summary-label">总借出</div>
                            <div className="summary-amount">0.00</div>
                        </div>
                    </div>
                </div>
            </div>

            {assets.length === 0 ? (
                <div className="empty-assets">
                    <div className="empty-message">
                        <span className="empty-icon">💰</span>
                        <p>暂无资产记录</p>
                        <button 
                            onClick={() => setShowAddModal(true)} 
                            className="btn btn-primary"
                        >
                            添加第一个资产
                        </button>
                    </div>
                </div>
            ) : (
                <div className="assets-categories">
                    {Object.entries(groupAssetsByCategory()).map(([category, categoryAssets]) => {
                        const categoryInfo = assetCategories[category] || assetCategories.card;
                        const categoryTotal = categoryAssets.reduce((sum, asset) => sum + getLatestAmount(asset.records), 0);
                        
                        return (
                            <div key={category} className="asset-category-section">
                                <div className="category-header">
                                    <div className="category-info">
                                        <span className="category-icon">{categoryInfo.icon}</span>
                                        <span className="category-name">{categoryInfo.name}</span>
                                    </div>
                                    <div className="category-amount">
                                        {formatCurrency(categoryTotal)}
                                        <span className="expand-icon">▶</span>
                                    </div>
                                </div>
                                
                                <div className="category-assets">
                                    {categoryAssets.map(asset => {
                                        const latestAmount = getLatestAmount(asset.records);
                                        
                                        return (
                                            <React.Fragment key={asset.id}>
                                                <div className="asset-item">
                                                    <div className="asset-info">
                                                        <span className="asset-icon">{categoryInfo.icon}</span>
                                                        <div className="asset-details">
                                                            <div className="asset-name">{asset.name}</div>
                                                            {asset.records && asset.records.length > 0 && (
                                                                <div className="asset-meta">
                                                                    {asset.records.length} 条记录
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="asset-actions">
                                                        <div className="asset-amount">
                                                            {formatCurrency(latestAmount)}
                                                        </div>
                                                        <div className="action-buttons">
                                                            <button 
                                                                onClick={() => toggleChart(asset.id)}
                                                                className="action-btn chart-btn"
                                                                title="查看趋势"
                                                            >
                                                                📊
                                                            </button>
                                                            <button 
                                                                onClick={() => openAddRecordModal(asset)}
                                                                className="action-btn add-btn"
                                                                title="添加记录"
                                                            >
                                                                ➕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* 趋势图展开区域 - 独立行 */}
                                                {expandedCharts[asset.id] && asset.records && asset.records.length > 0 && (
                                                    <div className="asset-chart-row">
                                                        <AssetTrendChart 
                                                            records={asset.records} 
                                                            assetName={asset.name}
                                                            color={categoryInfo.color}
                                                        />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Asset Modal */}
            {showAddModal && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">添加新资产</h5>
                                <button onClick={() => setShowAddModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">资产名称</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAsset.name}
                                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                        placeholder="输入资产名称"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">资产类别</label>
                                    <select
                                        className="form-select"
                                        value={newAsset.category}
                                        onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                                    >
                                        {Object.entries(assetCategories).map(([key, category]) => (
                                            <option key={key} value={key}>
                                                {category.icon} {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowAddModal(false)}>取消</button>
                                <button onClick={handleAddAsset} className="primary">添加</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Record Modal */}
            {showRecordModal && selectedAsset && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">为 {selectedAsset.name} 添加记录</h5>
                                <button onClick={() => setShowRecordModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">日期</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newRecord.date}
                                        onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">金额</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={newRecord.amount}
                                        onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                                        placeholder="输入金额"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowRecordModal(false)}>取消</button>
                                <button 
                                    onClick={() => {
                                        handleDeleteAsset(selectedAsset.id);
                                        setShowRecordModal(false);
                                    }}
                                    className="danger"
                                >
                                    删除资产
                                </button>
                                <button onClick={handleAddRecord} className="primary">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-sm">
                        <div className="modal-content delete-confirm-modal">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <span className="delete-icon">⚠️</span>
                                    确认删除
                                </h5>
                            </div>
                            <div className="modal-body">
                                <p>确定要删除这个资产吗？</p>
                                <p className="text-muted">删除后无法恢复，请谨慎操作。</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    onClick={cancelDeleteAsset} 
                                    className="btn btn-secondary"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={confirmDeleteAsset} 
                                    className="btn btn-danger"
                                >
                                    确认删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetsPage;
