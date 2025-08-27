// Assets Page Component
import React from 'react';
import AssetTrendChart from './AssetTrendChart.jsx';

const AssetsPage = ({ lang, t, fetchWithAuth, showToast }) => {
    const [assets, setAssets] = React.useState([]);
    const [assetCategories, setAssetCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showRecordModal, setShowRecordModal] = React.useState(false);
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState(null);
    const [newAsset, setNewAsset] = React.useState({ name: '', categoryId: '' });
    const [newRecord, setNewRecord] = React.useState({ date: '', amount: '' });
    const [newCategory, setNewCategory] = React.useState({ name: '', icon: '', type: 'asset' });
    const [expandedCharts, setExpandedCharts] = React.useState({});
    const [expandedCategories, setExpandedCategories] = React.useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [assetToDelete, setAssetToDelete] = React.useState(null);

    // 切换图表展开状态
    const toggleChart = (assetId) => {
        setExpandedCharts(prev => ({
            ...prev,
            [assetId]: !prev[assetId]
        }));
    };

    // 切换分类展开状态
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Load assets and categories from API
    React.useEffect(() => {
        fetchAssets();
        fetchAssetCategories();
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
                    category: asset.category,
                    categoryId: asset.categoryId,
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

    const fetchAssetCategories = async () => {
        try {
            const response = await fetchWithAuth('/api/asset-categories');
            if (response.ok) {
                const data = await response.json();
                setAssetCategories(data || []);
                // Set default category if none selected
                if (!newAsset.categoryId && Array.isArray(data) && data.length > 0) {
                    setNewAsset(prev => ({ ...prev, categoryId: data[0].id }));
                }
            } else if (response.status !== 401) {
                showToast('Failed to load asset categories', 'error');
            }
        } catch (error) {
            console.error('Error fetching asset categories:', error);
            showToast('Error loading asset categories', 'error');
        }
    };

    // Add new asset
    const handleAddAsset = async () => {
        if (!newAsset.name.trim()) {
            showToast('请输入资产名称', 'error');
            return;
        }
        
        if (!newAsset.categoryId) {
            showToast('请选择资产类别', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newAsset.name.trim(),
                    categoryId: parseInt(newAsset.categoryId)
                })
            });

            if (response.ok) {
                const asset = await response.json();
                setAssets([...assets, { 
                    ...asset, 
                    records: [] 
                }]);
                const firstCategoryId = Array.isArray(assetCategories) && assetCategories.length > 0 
                    ? assetCategories[0].id 
                    : '';
                setNewAsset({ name: '', categoryId: firstCategoryId });
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

    // Add new asset category
    const handleAddCategory = async () => {
        if (!newCategory.name.trim() || !newCategory.icon.trim()) {
            showToast('请填写完整的类别信息', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth('/api/asset-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategory.name.trim(),
                    icon: newCategory.icon.trim(),
                    type: newCategory.type
                })
            });

            if (response.ok) {
                const createdCategory = await response.json();
                setAssetCategories(prev => [...prev, createdCategory]);
                setNewCategory({ name: '', icon: '', type: 'asset' });
                setShowCategoryModal(false);
                showToast('类别添加成功', 'success');
            } else {
                showToast('添加类别失败', 'error');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast('添加类别失败', 'error');
        }
    };

    // Delete asset category
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('确定要删除这个类别吗？')) {
            try {
                const response = await fetchWithAuth(`/api/asset-categories/${categoryId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setAssetCategories(prev => prev.filter(cat => cat.id !== categoryId));
                    showToast('类别删除成功', 'success');
                } else {
                    showToast('删除类别失败', 'error');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                showToast('删除类别失败', 'error');
            }
        }
    };

    // Get latest amount for an asset
    const getLatestAmount = (records) => {
        if (!records || records.length === 0) return 0;
        const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedRecords[0].amount || 0;
    };

    // Get display amount (negative for credit cards as they are liabilities)
    const getDisplayAmount = (asset) => {
        const amount = getLatestAmount(asset.records);
        // 信用卡作为负债，显示为负值
        return asset.category === 'card' ? -Math.abs(amount) : amount;
    };

    // Get total assets value (excluding liabilities)
    // Get category info by ID
    const getCategoryInfo = (categoryId) => {
        if (!assetCategories || !Array.isArray(assetCategories)) {
            return { name: '未分类', icon: '❓', type: 'asset' };
        }
        return assetCategories.find(cat => cat.id === categoryId) || 
               { name: '未分类', icon: '❓', type: 'asset' };
    };

    // Get total assets value (only asset type categories)
    const getTotalAssets = () => {
        return assets.reduce((total, asset) => {
            const categoryInfo = getCategoryInfo(asset.categoryId);
            if (categoryInfo.type === 'asset') {
                return total + getLatestAmount(asset.records);
            }
            return total;
        }, 0);
    };

    // Get total liabilities value (only liability type categories)
    const getTotalLiabilities = () => {
        return assets.reduce((total, asset) => {
            const categoryInfo = getCategoryInfo(asset.categoryId);
            if (categoryInfo.type === 'liability') {
                return total + getLatestAmount(asset.records);
            }
            return total;
        }, 0);
    };

    // Get net worth (total assets - total liabilities)
    const getNetWorth = () => {
        return getTotalAssets() - getTotalLiabilities();
    };

    // Group assets by category
    const groupAssetsByCategory = () => {
        return assets.reduce((groups, asset) => {
            const categoryInfo = getCategoryInfo(asset.categoryId);
            const categoryKey = `${categoryInfo.type}_${asset.category}`;
            if (!groups[categoryKey]) {
                groups[categoryKey] = {
                    assets: [],
                    categoryInfo: categoryInfo
                };
            }
            groups[categoryKey].assets.push(asset);
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
                <div className="page-header-buttons">
                    <button 
                        onClick={() => setShowCategoryModal(true)} 
                        className="manage-category-btn"
                    >
                        管理类别
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)} 
                        className="add-asset-btn-header"
                    >
                        + 添加资产
                    </button>
                </div>
            </div>

            {/* 总资产概览 */}
            <div className="total-assets-card">
                <div className="total-label">净资产</div>
                <div className="total-amount">{formatCurrency(getNetWorth())}</div>
                <div className="assets-summary">
                    <div className="summary-item">
                        <div className="summary-label">总资产</div>
                        <div className="summary-amount">{formatCurrency(getTotalAssets())}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">总负债</div>
                        <div className="summary-amount liability-amount">{formatCurrency(getTotalLiabilities())}</div>
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
                    {Object.entries(groupAssetsByCategory()).map(([category, categoryData]) => {
                        const categoryInfo = categoryData.categoryInfo;
                        const categoryAssets = categoryData.assets;
                        // 分类总计显示实际金额（信用卡也显示正值）
                        const categoryTotal = categoryAssets.reduce((sum, asset) => sum + getLatestAmount(asset.records), 0);
                        const isExpanded = expandedCategories[category] === true; // 默认收起
                        
                        return (
                            <div key={category} className="asset-category-section">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory(category)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="category-info">
                                        <span className="category-icon">{categoryInfo.icon}</span>
                                        <span className="category-name">{categoryInfo.name}</span>
                                    </div>
                                    <div className={`category-amount ${category === 'card' ? 'liability-category' : ''}`}>
                                        {formatCurrency(categoryTotal)}
                                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="category-assets">
                                    {categoryAssets.map(asset => {
                                        // 在分类列表中显示实际金额（信用卡也显示正值）
                                        const displayAmount = getLatestAmount(asset.records);
                                        
                                        return (
                                            <React.Fragment key={asset.id}>
                                                <div className={`asset-item ${asset.category === 'card' ? 'liability-item' : ''}`}>
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
                                                            {formatCurrency(displayAmount)}
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
                                )}
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
                                        value={newAsset.categoryId}
                                        onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
                                    >
                                        {Array.isArray(assetCategories) && assetCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
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

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">管理资产类别</h5>
                                <button onClick={() => setShowCategoryModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {/* Add New Category Form */}
                                <div className="category-form mb-4">
                                    <h6>添加新类别</h6>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">类别名称</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newCategory.name}
                                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                                placeholder="输入类别名称"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">图标</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newCategory.icon}
                                                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                                placeholder="输入图标 (如: 💰)"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">类型</label>
                                            <select
                                                className="form-select"
                                                value={newCategory.type}
                                                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                                            >
                                                <option value="asset">资产</option>
                                                <option value="liability">负债</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">&nbsp;</label>
                                            <button 
                                                className="btn btn-primary w-100"
                                                onClick={handleAddCategory}
                                                disabled={!newCategory.name.trim() || !newCategory.icon.trim()}
                                            >
                                                添加
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Existing Categories List */}
                                <div className="categories-list">
                                    <h6>现有类别</h6>
                                    <div className="list-group">
                                        {Array.isArray(assetCategories) && assetCategories.map((category) => (
                                            <div key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div className="category-info">
                                                    <span className="category-icon me-2">{category.icon}</span>
                                                    <span className="category-name">{category.name}</span>
                                                    <span className="badge bg-secondary ms-2">
                                                        {category.type === 'asset' ? '资产' : '负债'}
                                                    </span>
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    disabled={false} // 允许删除所有类别，后端会处理权限
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">
                                    关闭
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
