import React from 'react';

// Toast notification component
const Toast = ({ message, type, show, onClose }) => {
    React.useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const toastClass = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info';

    return (
        <div className={`custom-toast ${toastClass} show`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' && '✅'}
                    {type === 'error' && '❌'}
                    {type === 'info' && 'ℹ️'}
                </div>
                <div className="toast-message">{message}</div>
                <button className="toast-close" onClick={onClose}>&times;</button>
            </div>
        </div>
    );
};

export default Toast;
