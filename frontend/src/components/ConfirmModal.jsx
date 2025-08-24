import React from 'react';

const ConfirmModal = ({ 
    show, 
    title = '确认操作', 
    message = '确定要继续此操作吗？',
    confirmText = '确定',
    cancelText = '取消',
    confirmType = 'danger', // 'danger', 'primary', 'warning'
    onConfirm,
    onCancel 
}) => {
    if (!show) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    const getConfirmButtonClass = () => {
        switch (confirmType) {
            case 'danger':
                return 'btn-danger';
            case 'warning':
                return 'btn-warning';
            case 'primary':
            default:
                return 'btn-primary';
        }
    };

    const getIconByType = () => {
        switch (confirmType) {
            case 'danger':
                return '⚠️';
            case 'warning':
                return '⚡';
            case 'primary':
            default:
                return '❓';
        }
    };

    return (
        <div 
            className="modal fade show confirm-modal-backdrop" 
            style={{ display: 'block' }} 
            tabIndex="-1"
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content confirm-modal-content`} data-type={confirmType}>
                    <div className="modal-header confirm-modal-header">
                        <div className="confirm-modal-icon">
                            {getIconByType()}
                        </div>
                        <div className="confirm-modal-title-section">
                            <h5 className="modal-title confirm-modal-title">{title}</h5>
                        </div>
                    </div>
                    
                    <div className="modal-body confirm-modal-body">
                        <p className="confirm-modal-message">{message}</p>
                    </div>
                    
                    <div className="modal-footer confirm-modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary confirm-modal-cancel"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${getConfirmButtonClass()} confirm-modal-confirm`}
                            onClick={onConfirm}
                            autoFocus
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
