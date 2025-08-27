import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { zhCN } from 'date-fns/locale';

const AddTransactionModal = ({ 
    show, 
    onClose, 
    onSave, 
    categoryIconMap, 
    categoryColorMap, 
    t, 
    lang 
}) => {
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        categoryKey: 'food',
        description: '',
        date: new Date() // 默认为今天，现在使用 Date 对象
    });
    const [saving, setSaving] = useState(false);

    const expenseCategories = ['food', 'medical', 'transport', 'housing', 'snacks', 'learning', 'communication', 'social', 'investment', 'shopping', 'other'];
    const incomeCategories = ['salary', 'part_time', 'financial', 'red_packet', 'other'];

    const getCurrentCategories = () => {
        return formData.type === 'expense' ? expenseCategories : incomeCategories;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            date: date
        }));
    };

    const handleTypeChange = (type) => {
        const categories = type === 'expense' ? expenseCategories : incomeCategories;
        setFormData(prev => ({
            ...prev,
            type,
            categoryKey: categories[0] // 重置为第一个分类
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert(lang === 'zh' ? '请输入有效的金额' : 'Please enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            // 确保 amount 是数字类型，date 是正确格式
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: formData.date.toISOString().split('T')[0] // 转换为 YYYY-MM-DD 格式
            };
            
            await onSave(transactionData);
            // 重置表单
            setFormData({
                type: 'expense',
                amount: '',
                categoryKey: 'food',
                description: '',
                date: new Date() // 重置为新的 Date 对象
            });
            onClose();
        } catch (error) {
            console.error('Error saving transaction:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!show) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="modal fade show" 
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} 
            tabIndex="-1"
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-plus me-2"></i>
                            {lang === 'zh' ? '添加交易' : 'Add Transaction'}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            disabled={saving}
                        ></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* 交易类型选择 */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    {lang === 'zh' ? '交易类型' : 'Transaction Type'}
                                </label>
                                <div className="btn-group w-100" role="group">
                                    <button
                                        type="button"
                                        className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`}
                                        onClick={() => handleTypeChange('expense')}
                                    >
                                        <i className="fas fa-arrow-down me-2"></i>
                                        {t('expense')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${formData.type === 'income' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => handleTypeChange('income')}
                                    >
                                        <i className="fas fa-arrow-up me-2"></i>
                                        {t('income')}
                                    </button>
                                </div>
                            </div>

                            {/* 金额和日期输入 - 同一行 */}
                            <div className="mb-4">
                                <div className="row g-3">
                                    {/* 金额输入 */}
                                    <div className="col-md-4">
                                        <label htmlFor="amount" className="form-label fw-bold">
                                            {t('amount')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                {t('currencySymbol')}
                                            </span>
                                            <input
                                                type="number"
                                                className="form-control"
                                                id="amount"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 日期选择 */}
                                    <div className="col-md-8">
                                        <label className="form-label fw-bold">
                                            {lang === 'zh' ? '交易日期' : 'Transaction Date'}
                                        </label>
                                        <DatePicker
                                            selected={formData.date}
                                            onChange={handleDateChange}
                                            dateFormat="yyyy-MM-dd"
                                            className="form-control custom-datepicker"
                                            placeholderText={lang === 'zh' ? '选择日期' : 'Select date'}
                                            showYearDropdown
                                            showMonthDropdown
                                            dropdownMode="select"
                                            maxDate={new Date()}
                                            locale={lang === 'zh' ? zhCN : undefined}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 分类选择 */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    {t('category')}
                                </label>
                                <div className="row g-2">
                                    {getCurrentCategories().map(category => (
                                        <div key={category} className="col-6 col-md-4 col-lg-3 col-xl-2 col-xxl-2">
                                            <button
                                                type="button"
                                                className={`btn w-100 p-3 ${
                                                    formData.categoryKey === category 
                                                        ? 'btn-primary' 
                                                        : 'btn-outline-secondary'
                                                }`}
                                                onClick={() => setFormData(prev => ({ ...prev, categoryKey: category }))}
                                                style={{
                                                    minHeight: '80px',
                                                    backgroundColor: formData.categoryKey === category 
                                                        ? categoryColorMap.get(category) 
                                                        : 'transparent',
                                                    borderColor: categoryColorMap.get(category) || '#6c757d',
                                                    color: formData.categoryKey === category ? 'white' : '#495057'
                                                }}
                                            >
                                                <div className="mb-1" style={{ fontSize: '1.5rem' }}>
                                                    {categoryIconMap.get(category) || '📝'}
                                                </div>
                                                <small>{t(category)}</small>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 备注输入 */}
                            <div className="mb-3">
                                <label htmlFor="description" className="form-label fw-bold">
                                    {t('description')}
                                </label>
                                <textarea
                                    className="form-control"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder={t('description_placeholder')}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={saving}
                            >
                                {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </span>
                                        {lang === 'zh' ? '保存中...' : 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save me-2"></i>
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTransactionModal;
