import { useState } from 'react';

// Custom hook for managing confirm dialogs
export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: '确定',
        cancelText: '取消',
        confirmType: 'danger',
        onConfirm: null,
        onCancel: null
    });

    const showConfirm = ({ 
        title = '确认操作', 
        message = '确定要继续此操作吗？',
        confirmText = '确定',
        cancelText = '取消',
        confirmType = 'danger'
    }) => {
        return new Promise((resolve) => {
            setConfirmState({
                show: true,
                title,
                message,
                confirmText,
                cancelText,
                confirmType,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    resolve(false);
                }
            });
        });
    };

    const hideConfirm = () => {
        setConfirmState(prev => ({ ...prev, show: false }));
    };

    return {
        confirmState,
        showConfirm,
        hideConfirm
    };
};

export default useConfirm;
