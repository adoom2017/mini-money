// Assets Page Component
import React from 'react';
import { Input, Select, Button, Modal, Form, Row, Col, List, Tag, Popover, Grid } from 'antd';
import { PlusOutlined, DeleteOutlined, SmileOutlined } from '@ant-design/icons';
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
    const [showIconPicker, setShowIconPicker] = React.useState(false);
    const [expandedCharts, setExpandedCharts] = React.useState({});
    const [expandedCategories, setExpandedCategories] = React.useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [assetToDelete, setAssetToDelete] = React.useState(null);
    const [form] = Form.useForm();

    // 预设图标列表
    const presetIcons = {
        asset: [
            '💰', '💳', '🏦', '💵', '💸', '📱', '💎', '🏠', 
            '🚗', '📈', '📊', '💹', '🎯', '💳', '🎁', '🏆',
            '⚡', '🔋', '📟', '💻', '🖥️', '📺', '⌚', '📷'
        ],
        liability: [
            '💳', '🏠', '🚗', '📱', '💊', '🎓', '💸', '📋',
            '⚠️', '📉', '💰', '🏦', '📄', '✍️', '🔴', '❌',
            '⏰', '📅', '💔', '🚫', '⛔', '🔻', '📌', '🎯'
        ]
    };

    // 图标选择器组件
    const IconSelector = ({ value, onChange, type = 'asset' }) => {
        const iconOptions = presetIcons[type] || presetIcons.asset || [];
        
        if (!iconOptions.length) {
            return (
                <Button style={{ width: '100%', height: 42 }}>
                    无可用图标
                </Button>
            );
        }
        
        const iconGrid = (
            <div style={{ 
                width: 280, 
                maxHeight: 200, 
                overflowY: 'auto',
                padding: 8
            }}>
                <Row gutter={[8, 8]}>
                    {iconOptions.map((icon, index) => (
                        <Col span={4} key={index}>
                            <Button
                                type={value === icon ? 'primary' : 'default'}
                                size="large"
                                style={{ 
                                    width: '100%', 
                                    height: 40,
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={() => {
                                    onChange(icon);
                                    setShowIconPicker(false);
                                }}
                            >
                                {icon}
                            </Button>
                        </Col>
                    ))}
                </Row>
            </div>
        );

        return (
            <Popover
                content={iconGrid}
                title="选择图标"
                trigger="click"
                open={showIconPicker}
                onOpenChange={setShowIconPicker}
                placement="bottom"
            >
                <Button
                    style={{ width: '100%', height: 42 }}
                    icon={value ? null : <SmileOutlined />}
                >
                    {value ? value : '选择图标'}
                </Button>
            </Popover>
        );
    };

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
    const handleAddCategory = async (formValues = null) => {
        // 使用表单值或当前状态值
        const values = formValues || newCategory;
        
        if (!values.name?.trim() || !values.icon?.trim()) {
            showToast('请填写完整的类别信息', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth('/api/asset-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name.trim(),
                    icon: values.icon.trim(),
                    type: values.type
                })
            });

            if (response.ok) {
                const createdCategory = await response.json();
                setAssetCategories(prev => [...prev, createdCategory]);
                setNewCategory({ name: '', icon: '', type: 'asset' });
                setShowIconPicker(false);
                form.resetFields();
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
    // 鲜艳的颜色配色方案
    const vibrantColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
        '#EE5A24', '#009432', '#0652DD', '#9980FA', '#FFC312',
        '#C44569', '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8'
    ];

    // Get category info by ID
    const getCategoryInfo = (categoryId) => {
        if (!assetCategories || !Array.isArray(assetCategories)) {
            return { name: '未分类', icon: '❓', type: 'asset', color: vibrantColors[0] };
        }
        const category = assetCategories.find(cat => cat.id === categoryId);
        if (!category) {
            return { name: '未分类', icon: '❓', type: 'asset', color: vibrantColors[0] };
        }
        
        // 为每个分类分配鲜艳颜色（根据分类ID的哈希值）
        const colorIndex = Math.abs(categoryId.toString().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0)) % vibrantColors.length;
        
        return {
            ...category,
            color: vibrantColors[colorIndex] // 覆盖后端返回的颜色，使用更鲜艳的配色
        };
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
        <div className="assets-inner-content">
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
                <div 
                    className="modal fade show" 
                    style={{ 
                        display: 'block', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1050
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAddModal(false);
                        }
                    }}
                >
                    <div 
                        className="modal-dialog" 
                        style={{
                            position: 'relative',
                            margin: '1.75rem auto',
                            maxWidth: '500px',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 'calc(100vh - 3.5rem)'
                        }}
                    >
                        <div className="modal-content assets-modal">
                            <div className="modal-header assets-modal-header">
                                <h5 className="modal-title assets-modal-title">
                                    <i className="fas fa-plus me-2"></i>
                                    添加新资产
                                </h5>
                                <button 
                                    className="ant-modal-close" 
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        zIndex: 10,
                                        padding: 0,
                                        color: 'rgba(0, 0, 0, 0.45)',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        textDecoration: 'none',
                                        background: 'transparent',
                                        border: 0,
                                        cursor: 'pointer',
                                        width: '22px',
                                        height: '22px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.color = 'rgba(0, 0, 0, 0.75)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.color = 'rgba(0, 0, 0, 0.45)';
                                    }}
                                >
                                    <span className="ant-modal-close-x">
                                        <svg width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
                                            <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"/>
                                        </svg>
                                    </span>
                                </button>
                            </div>
                            <div className="modal-body assets-modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="fas fa-tag me-2" style={{ color: '#667eea' }}></i>
                                        资产名称
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAsset.name}
                                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                        placeholder="输入资产名称"
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #e0e6ed',
                                            padding: '0.75rem 1rem',
                                            transition: 'all 0.2s ease',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="fas fa-list me-2" style={{ color: '#667eea' }}></i>
                                        资产类别
                                    </label>
                                    <select
                                        className="form-select"
                                        value={newAsset.categoryId}
                                        onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #e0e6ed',
                                            padding: '0.75rem 1rem',
                                            transition: 'all 0.2s ease',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {Array.isArray(assetCategories) && assetCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {(category.icon || '📊')} {(category.name || '未命名类别')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer assets-modal-footer">
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleAddAsset}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '500',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.2s ease',
                                        width: '100%'
                                    }}
                                >
                                    <i className="fas fa-plus me-2"></i>
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Record Modal */}
            {showRecordModal && selectedAsset && (
                <div 
                    className="modal fade show" 
                    style={{ 
                        display: 'block', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1050
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowRecordModal(false);
                        }
                    }}
                >
                    <div 
                        className="modal-dialog" 
                        style={{
                            position: 'relative',
                            margin: '1.75rem auto',
                            maxWidth: '500px',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 'calc(100vh - 3.5rem)'
                        }}
                    >
                        <div className="modal-content assets-modal">
                            <div className="modal-header assets-modal-header">
                                <h5 className="modal-title assets-modal-title">
                                    <i className="fas fa-chart-line me-2"></i>
                                    为 {selectedAsset.name} 添加记录
                                </h5>
                                <button 
                                    className="ant-modal-close" 
                                    onClick={() => setShowRecordModal(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        zIndex: 10,
                                        padding: 0,
                                        color: 'rgba(0, 0, 0, 0.45)',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        textDecoration: 'none',
                                        background: 'transparent',
                                        border: 0,
                                        cursor: 'pointer',
                                        width: '22px',
                                        height: '22px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.color = 'rgba(0, 0, 0, 0.75)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.color = 'rgba(0, 0, 0, 0.45)';
                                    }}
                                >
                                    <span className="ant-modal-close-x">
                                        ×
                                    </span>
                                </button>
                            </div>
                            <div className="modal-body assets-modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="fas fa-calendar me-2" style={{ color: '#667eea' }}></i>
                                        日期
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newRecord.date}
                                        onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #e0e6ed',
                                            padding: '0.75rem 1rem',
                                            transition: 'all 0.2s ease',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="fas fa-dollar-sign me-2" style={{ color: '#667eea' }}></i>
                                        金额
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={newRecord.amount}
                                        onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                                        placeholder="输入金额"
                                        style={{
                                            borderRadius: '8px',
                                            border: '1px solid #e0e6ed',
                                            padding: '0.75rem 1rem',
                                            transition: 'all 0.2s ease',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer assets-modal-footer">
                                <button 
                                    className="btn btn-default me-2"
                                    onClick={() => setShowRecordModal(false)}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        border: '1px solid #e0e6ed',
                                        background: 'white',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    取消
                                </button>
                                <button 
                                    className="btn btn-danger me-2"
                                    onClick={() => {
                                        handleDeleteAsset(selectedAsset.id);
                                        setShowRecordModal(false);
                                    }}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-trash me-2"></i>
                                    删除资产
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleAddRecord}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '500',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-save me-2"></i>
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    className="modal fade show" 
                    style={{ 
                        display: 'block', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1050
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteConfirm(false);
                        }
                    }}
                >
                    <div 
                        className="modal-dialog modal-sm" 
                        style={{
                            position: 'relative',
                            margin: '1.75rem auto',
                            maxWidth: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 'calc(100vh - 3.5rem)'
                        }}
                    >
                        <div className="modal-content assets-modal">
                            <div className="modal-header assets-modal-header" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
                                <h5 className="modal-title assets-modal-title">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    确认删除
                                </h5>
                            </div>
                            <div className="modal-body assets-modal-body">
                                <div className="text-center">
                                    <div className="mb-3">
                                        <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                        确定要删除这个资产吗？
                                    </p>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                                        删除后无法恢复，请谨慎操作。
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer assets-modal-footer">
                                <button 
                                    className="btn btn-default me-2"
                                    onClick={cancelDeleteAsset}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        border: '1px solid #e0e6ed',
                                        background: 'white',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    取消
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={confirmDeleteAsset}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '500',
                                        boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-trash me-2"></i>
                                    确认删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Management Modal - Ant Design Version */}
            <Modal
                title="管理资产类别"
                open={showCategoryModal}
                onCancel={() => {
                    setShowCategoryModal(false);
                    setShowIconPicker(false);
                    form.resetFields();
                }}
                footer={null}
                width={800}
                styles={{
                    body: { padding: '0' },
                    mask: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
                }}
                wrapClassName="category-modal-wrap"
                maskClosable={true}
            >
                {/* Add New Category Form */}
                <div style={{ 
                    padding: '24px 0 0 0',
                    marginBottom: '24px'
                }}>
                    <h3 style={{ marginBottom: '16px', color: '#667eea', padding: '0 24px' }}>添加新类别</h3>
                    <div style={{ padding: '0 24px' }}>
                        <Form
                        form={form}
                        layout="horizontal"
                        onFinish={(values) => {
                            // 直接将表单值传递给handleAddCategory
                            handleAddCategory(values);
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="类别名称"
                                    name="name"
                                    rules={[{ required: true, message: '请输入类别名称' }]}
                                >
                                    <Input 
                                        placeholder="输入类别名称"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="图标"
                                    name="icon"
                                    rules={[{ required: true, message: '请选择图标' }]}
                                >
                                    <IconSelector 
                                        value={newCategory.icon}
                                        onChange={(icon) => {
                                            setNewCategory(prev => ({ ...prev, icon }));
                                            form.setFieldsValue({ icon });
                                        }}
                                        type={newCategory.type}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    label="类型"
                                    name="type"
                                    initialValue="asset"
                                >
                                    <Select 
                                        size="large"
                                        onChange={(value) => {
                                            setNewCategory(prev => ({ ...prev, type: value, icon: '' }));
                                            form.setFieldsValue({ icon: '' });
                                        }}
                                    >
                                        <Select.Option value="asset">资产</Select.Option>
                                        <Select.Option value="liability">负债</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label=" " colon={false}>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit"
                                        size="large"
                                        icon={<PlusOutlined />}
                                        style={{ width: '100%' }}
                                    >
                                        添加
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                    </div>
                </div>

                {/* Existing Categories List */}
                <div style={{ padding: '0 24px 24px 24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#667eea' }}>现有类别</h3>
                    <List
                        bordered
                        dataSource={assetCategories}
                        renderItem={(category) => (
                            <List.Item
                                actions={[
                                    <Button 
                                        danger 
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteCategory(category.id)}
                                    >
                                        删除
                                    </Button>
                                ]}
                                style={{ padding: '12px 16px' }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div style={{ 
                                            fontSize: '24px', 
                                            width: '40px', 
                                            textAlign: 'center' 
                                        }}>
                                            {category.icon || '📊'}
                                        </div>
                                    }
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 500 }}>
                                                {category.name || '未命名类别'}
                                            </span>
                                            <Tag color={category.type === 'asset' ? 'green' : 'orange'}>
                                                {category.type === 'asset' ? '资产' : '负债'}
                                            </Tag>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </Modal>

            {/* 悬浮添加按钮 */}
            <button 
                onClick={() => setShowAddModal(true)} 
                className="floating-add-btn"
                title="添加资产"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
    );
};

export default AssetsPage;
