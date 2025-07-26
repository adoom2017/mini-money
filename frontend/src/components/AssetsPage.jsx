// Assets Page Component
import React from 'react';

const AssetsPage = ({ lang, t, fetchWithAuth }) => {
    const [assets, setAssets] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showRecordModal, setShowRecordModal] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState(null);
    const [newAsset, setNewAsset] = React.useState({ name: '' });
    const [newRecord, setNewRecord] = React.useState({ date: '', amount: '' });
    const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'chart'

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
                    records: asset.records || [],
                    expanded: false
                }));
                setAssets(transformedAssets);
            } else if (response.status !== 401) {
                // Don't show error for 401 - it's handled by fetchWithAuth
                showToast('Failed to load assets', 'error');
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            showToast('Error loading assets', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Toggle asset expansion
    const toggleAsset = (assetId) => {
        setAssets(assets.map(asset =>
            asset.id === assetId
                ? { ...asset, expanded: !asset.expanded }
                : asset
        ));
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
                body: JSON.stringify({ name: newAsset.name.trim() })
            });

            if (response.ok) {
                const asset = await response.json();
                const newAssetItem = {
                    id: asset.id,
                    name: asset.name,
                    records: [],
                    expanded: false
                };
                setAssets([...assets, newAssetItem]);
                setNewAsset({ name: '' });
                setShowAddModal(false);
                showToast('资产添加成功', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || '添加资产失败', 'error');
            }
        } catch (error) {
            console.error('Error creating asset:', error);
            showToast('添加资产失败', 'error');
        }
    };

    // Add new record to asset
    const handleAddRecord = async () => {
        if (!newRecord.date || !newRecord.amount) {
            showToast('请填写完整信息', 'error');
            return;
        }

        const amount = parseFloat(newRecord.amount);
        if (isNaN(amount) || amount < 0) {
            showToast('请输入有效金额', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/assets/${selectedAsset.id}/records`, {
                method: 'POST',
                body: JSON.stringify({
                    date: newRecord.date,
                    amount: amount
                })
            });

            if (response.ok) {
                const record = await response.json();
                const updatedAssets = assets.map(asset => {
                    if (asset.id === selectedAsset.id) {
                        const newRecords = [...asset.records, record].sort((a, b) => new Date(b.date) - new Date(a.date));
                        return { ...asset, records: newRecords };
                    }
                    return asset;
                });

                setAssets(updatedAssets);
                setNewRecord({ date: '', amount: '' });
                setShowRecordModal(false);
                setSelectedAsset(null);
                showToast('记录添加成功', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || '添加记录失败', 'error');
            }
        } catch (error) {
            console.error('Error creating asset record:', error);
            showToast('添加记录失败', 'error');
        }
    };

    // Delete asset
    const handleDeleteAsset = async (assetId) => {
        if (!confirm('确定要删除这个资产吗？所有相关记录也会被删除。')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/assets/${assetId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setAssets(assets.filter(asset => asset.id !== assetId));
                showToast('资产删除成功', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || '删除资产失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            showToast('删除资产失败', 'error');
        }
    };

    // Delete record
    const handleDeleteRecord = async (assetId, recordId) => {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/assets/${assetId}/records/${recordId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const updatedAssets = assets.map(asset => {
                    if (asset.id === assetId) {
                        const newRecords = asset.records.filter(record => record.id !== recordId);
                        return { ...asset, records: newRecords };
                    }
                    return asset;
                });
                setAssets(updatedAssets);
                showToast('记录删除成功', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || '删除记录失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting asset record:', error);
            showToast('删除记录失败', 'error');
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(amount);
    };

    // Get latest amount for asset
    const getLatestAmount = (records) => {
        if (records.length === 0) return 0;
        return records[0].amount; // records are sorted by date desc
    };

    // Initialize charts when view mode changes to chart
    React.useEffect(() => {
        if (viewMode === 'chart') {
            // Small delay to ensure DOM elements are rendered
            setTimeout(() => {
                assets.forEach(asset => {
                    if (asset.records.length > 0) {
                        const chartId = `chart-${asset.id}`;
                        const ctx = document.getElementById(chartId);
                        if (ctx) {
                            // Destroy existing chart if it exists
                            if (window.assetCharts && window.assetCharts[chartId]) {
                                window.assetCharts[chartId].destroy();
                            }

                            // Prepare data for chart (sort by date ascending for proper line chart)
                            const sortedRecords = [...asset.records].sort((a, b) => new Date(a.date) - new Date(b.date));
                            const labels = sortedRecords.map(record => record.date);
                            const data = sortedRecords.map(record => record.amount);

                            // Create new chart
                            const chart = new Chart(ctx, {
                                type: 'line',
                                data: {
                                    labels: labels,
                                    datasets: [{
                                        label: asset.name,
                                        data: data,
                                        borderColor: 'rgb(13, 110, 253)',
                                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                        tension: 0.1,
                                        fill: true
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function(value) {
                                                    return '¥' + value.toLocaleString();
                                                }
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top'
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return asset.name + ': ¥' + context.parsed.y.toLocaleString();
                                                }
                                            }
                                        }
                                    }
                                }
                            });

                            // Store chart instance for cleanup
                            if (!window.assetCharts) {
                                window.assetCharts = {};
                            }
                            window.assetCharts[chartId] = chart;
                        }
                    }
                });
            }, 100);
        }

        // Cleanup function
        return () => {
            if (window.assetCharts) {
                Object.values(window.assetCharts).forEach(chart => {
                    if (chart && typeof chart.destroy === 'function') {
                        chart.destroy();
                    }
                });
                window.assetCharts = {};
            }
        };
    }, [viewMode, assets]);

    // Render chart container for a single asset
    const renderAssetChart = (asset) => {
        const chartId = `chart-${asset.id}`;

        return (
            <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
                <canvas id={chartId}></canvas>
            </div>
        );
    };

    // Calculate total assets
    const totalAssets = assets.reduce((sum, asset) => sum + getLatestAmount(asset.records), 0);

    return (
        <div className="assets-page">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="mb-1">{t('assets')}</h3>
                    <div className="text-muted">
                        总资产: <span className="fw-bold text-primary">{formatCurrency(totalAssets)}</span>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    {/* View Mode Toggle */}
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('table')}
                            disabled={loading}
                        >
                            <i className="bi bi-table"></i> 表格
                        </button>
                        <button
                            type="button"
                            className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('chart')}
                            disabled={loading || assets.length === 0}
                        >
                            <i className="bi bi-graph-up"></i> 图表
                        </button>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={loading}
                    >
                        <span className="me-1">+</span>
                        添加资产
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">加载中...</span>
                    </div>
                </div>
            ) : (
                /* Assets Content */
                <div className="assets-content">
                    {assets.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="text-muted mb-3">
                                <i className="bi bi-wallet2" style={{fontSize: '3rem'}}>💰</i>
                            </div>
                            <h5 className="text-muted">暂无资产记录</h5>
                            <p className="text-muted">点击"添加资产"按钮开始记录您的资产</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        /* Table View */
                        <div className="assets-list">
                            {assets.map(asset => (
                                <div key={asset.id} className="card mb-3">
                                    {/* Asset Header */}
                                    <div
                                        className="card-header d-flex justify-content-between align-items-center cursor-pointer"
                                        onClick={() => toggleAsset(asset.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                    <div className="d-flex align-items-center">
                                        <span className="me-2">
                                            {asset.expanded ? '▼' : '▶'}
                                        </span>
                                        <div>
                                            <h6 className="mb-0">{asset.name}</h6>
                                            <small className="text-muted">
                                                最新: {formatCurrency(getLatestAmount(asset.records))}
                                                {asset.records.length > 0 && (
                                                    <span className="ms-2">({asset.records.length}条记录)</span>
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAsset(asset);
                                                setNewRecord({ date: new Date().toISOString().split('T')[0], amount: '' });
                                                setShowRecordModal(true);
                                            }}
                                        >
                                            添加记录
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAsset(asset.id);
                                            }}
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>

                                {/* Asset Records */}
                                {asset.expanded && (
                                    <div className="card-body">
                                        {asset.records.length === 0 ? (
                                            <div className="text-center text-muted py-3">
                                                暂无记录，点击"添加记录"按钮开始记录
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>日期</th>
                                                            <th className="text-end">金额</th>
                                                            <th className="text-end" width="80">操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {asset.records.map((record) => (
                                                            <tr key={record.id}>
                                                                <td>{record.date}</td>
                                                                <td className="fw-bold text-end">{formatCurrency(record.amount)}</td>
                                                                <td className="text-end">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleDeleteRecord(asset.id, record.id)}
                                                                    >
                                                                        删除
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    ) : (
                        /* Chart View */
                        <div className="charts-container">
                            {assets.map(asset => (
                                asset.records.length > 0 && (
                                    <div key={asset.id} className="card mb-3">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-0">{asset.name}</h6>
                                                    <small className="text-muted">
                                                        当前: {formatCurrency(getLatestAmount(asset.records))}
                                                    </small>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAsset(asset);
                                                            setNewRecord({ date: '', amount: '' });
                                                            setShowRecordModal(true);
                                                        }}
                                                    >
                                                        添加记录
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAsset(asset.id);
                                                        }}
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {renderAssetChart(asset)}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Asset Modal */}
            {showAddModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">添加资产</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowAddModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">资产名称</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="例如：招商银行、支付宝等"
                                        value={newAsset.name}
                                        onChange={(e) => setNewAsset({ name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddAsset}
                                >
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Record Modal */}
            {showRecordModal && selectedAsset && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">添加记录 - {selectedAsset.name}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRecordModal(false)}
                                ></button>
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
                                        className="form-control"
                                        placeholder="输入资产金额"
                                        value={newRecord.amount}
                                        onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowRecordModal(false)}
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddRecord}
                                >
                                    添加
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
