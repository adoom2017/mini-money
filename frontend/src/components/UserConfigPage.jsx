import React, { useState } from 'react';

const UserConfigPage = ({ user, onClose, onUpdatePassword, onUpdateEmail, onUpdateAvatar, onLogout, t }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [emailData, setEmailData] = useState({
        email: user.email || '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert(t('passwords_not_match') || 'New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert(t('password_min_length') || 'Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        try {
            await onUpdatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!emailData.email || !emailData.password) {
            alert(t('fill_all_fields') || 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await onUpdateEmail({
                email: emailData.email,
                password: emailData.password
            });
            setEmailData({ ...emailData, password: '' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert(t('file_too_large') || 'File size must be less than 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                onUpdateAvatar(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="modal d-block user-config-page" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content" style={{ height: '90vh' }}>
                    <div className="modal-header border-bottom">
                        <h4 className="modal-title d-flex align-items-center">
                            <i className="fas fa-cog me-2 text-primary"></i>
                            {t('user_settings') || '用户设置'}
                        </h4>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    
                    <div className="modal-body p-0" style={{ overflowY: 'auto' }}>
                        <div className="row h-100">
                            {/* 左侧导航 */}
                            <div className="col-md-3 bg-light border-end p-0">
                                <div className="list-group list-group-flush">
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'profile' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('profile')}
                                    >
                                        <i className="fas fa-user me-2"></i>
                                        {t('profile') || '个人资料'}
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'avatar' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('avatar')}
                                    >
                                        <i className="fas fa-image me-2"></i>
                                        {t('change_avatar') || '更换头像'}
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'password' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('password')}
                                    >
                                        <i className="fas fa-lock me-2"></i>
                                        {t('change_password') || '修改密码'}
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'email' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('email')}
                                    >
                                        <i className="fas fa-envelope me-2"></i>
                                        {t('change_email') || '修改邮箱'}
                                    </button>
                                    <div className="border-top mt-2"></div>
                                    <button
                                        className="list-group-item list-group-item-action border-0 py-3 text-danger"
                                        onClick={() => {
                                            if (confirm(t('confirm_logout') || '确定要登出吗？')) {
                                                onLogout();
                                                onClose();
                                            }
                                        }}
                                    >
                                        <i className="fas fa-sign-out-alt me-2"></i>
                                        {t('logout') || '登出'}
                                    </button>
                                </div>
                            </div>

                            {/* 右侧内容 */}
                            <div className="col-md-9 p-4">
                                {/* 个人资料标签页 */}
                                {activeTab === 'profile' && (
                                    <div>
                                        <h5 className="mb-4">
                                            <i className="fas fa-user me-2 text-primary"></i>
                                            {t('profile') || '个人资料'}
                                        </h5>
                                        <div className="row">
                                            <div className="col-md-4 text-center">
                                                <div className="avatar-preview mx-auto mb-3" style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    backgroundColor: '#e9ecef',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '4px solid #dee2e6',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                }}>
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt="Avatar"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '3em' }}>👤</span>
                                                    )}
                                                </div>
                                                <p className="text-muted small">
                                                    {t('click_avatar_to_change') || '点击头像标签页更换头像'}
                                                </p>
                                            </div>
                                            <div className="col-md-8">
                                                <div className="card border-0 bg-light">
                                                    <div className="card-body">
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">
                                                                <i className="fas fa-user me-2"></i>
                                                                {t('username') || '用户名'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={user.username || ''}
                                                                disabled
                                                                style={{ backgroundColor: '#f8f9fa' }}
                                                            />
                                                            <small className="text-muted">
                                                                {t('username_cannot_change') || '用户名不可修改'}
                                                            </small>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">
                                                                <i className="fas fa-envelope me-2"></i>
                                                                {t('email') || '邮箱'}
                                                            </label>
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                value={user.email || t('not_set') || '未设置'}
                                                                disabled
                                                                style={{ backgroundColor: '#f8f9fa' }}
                                                            />
                                                            <small className="text-muted">
                                                                {t('click_email_tab_to_change') || '点击邮箱标签页修改邮箱'}
                                                            </small>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">
                                                                <i className="fas fa-calendar me-2"></i>
                                                                {t('join_date') || '加入时间'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('unknown') || '未知'}
                                                                disabled
                                                                style={{ backgroundColor: '#f8f9fa' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 更换头像标签页 */}
                                {activeTab === 'avatar' && (
                                    <div>
                                        <h5 className="mb-4">
                                            <i className="fas fa-image me-2 text-primary"></i>
                                            {t('change_avatar') || '更换头像'}
                                        </h5>
                                        <div className="row justify-content-center">
                                            <div className="col-md-8">
                                                <div className="text-center mb-4">
                                                    <div className="avatar-preview mx-auto mb-3" style={{
                                                        width: '150px',
                                                        height: '150px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#e9ecef',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '4px solid #dee2e6',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {user.avatar ? (
                                                            <img
                                                                src={user.avatar}
                                                                alt="Avatar"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '4em' }}>👤</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">
                                                                {t('upload_new_avatar') || '上传新头像'}
                                                            </label>
                                                            <input
                                                                type="file"
                                                                className="form-control"
                                                                accept="image/*"
                                                                onChange={handleAvatarUpload}
                                                            />
                                                            <small className="text-muted">
                                                                {t('avatar_requirements') || '支持 JPG、PNG 格式，文件大小不超过 2MB'}
                                                            </small>
                                                        </div>
                                                        
                                                        {user.avatar && (
                                                            <div className="text-center">
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => onUpdateAvatar(null)}
                                                                >
                                                                    <i className="fas fa-trash me-2"></i>
                                                                    {t('remove_avatar') || '移除头像'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 修改密码标签页 */}
                                {activeTab === 'password' && (
                                    <div>
                                        <h5 className="mb-4">
                                            <i className="fas fa-lock me-2 text-primary"></i>
                                            {t('change_password') || '修改密码'}
                                        </h5>
                                        <div className="row justify-content-center">
                                            <div className="col-md-8">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <form onSubmit={handlePasswordSubmit}>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-bold">
                                                                    <i className="fas fa-key me-2"></i>
                                                                    {t('current_password') || '当前密码'}
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={passwordData.currentPassword}
                                                                    onChange={(e) => setPasswordData({
                                                                        ...passwordData,
                                                                        currentPassword: e.target.value
                                                                    })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-bold">
                                                                    <i className="fas fa-lock me-2"></i>
                                                                    {t('new_password') || '新密码'}
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={passwordData.newPassword}
                                                                    onChange={(e) => setPasswordData({
                                                                        ...passwordData,
                                                                        newPassword: e.target.value
                                                                    })}
                                                                    minLength="6"
                                                                    required
                                                                />
                                                                <small className="text-muted">
                                                                    {t('password_min_6_chars') || '密码至少 6 个字符'}
                                                                </small>
                                                            </div>
                                                            <div className="mb-4">
                                                                <label className="form-label fw-bold">
                                                                    <i className="fas fa-check-circle me-2"></i>
                                                                    {t('confirm_new_password') || '确认新密码'}
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={passwordData.confirmPassword}
                                                                    onChange={(e) => setPasswordData({
                                                                        ...passwordData,
                                                                        confirmPassword: e.target.value
                                                                    })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="text-center">
                                                                <button
                                                                    type="submit"
                                                                    className="btn btn-primary px-4"
                                                                    disabled={isLoading}
                                                                >
                                                                    {isLoading ? (
                                                                        <><i className="fas fa-spinner fa-spin me-2"></i>{t('updating') || '更新中...'}</>
                                                                    ) : (
                                                                        <><i className="fas fa-save me-2"></i>{t('update_password') || '更新密码'}</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 修改邮箱标签页 */}
                                {activeTab === 'email' && (
                                    <div>
                                        <h5 className="mb-4">
                                            <i className="fas fa-envelope me-2 text-primary"></i>
                                            {t('change_email') || '修改邮箱'}
                                        </h5>
                                        <div className="row justify-content-center">
                                            <div className="col-md-8">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <form onSubmit={handleEmailSubmit}>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-bold">
                                                                    <i className="fas fa-envelope me-2"></i>
                                                                    {t('new_email') || '新邮箱地址'}
                                                                </label>
                                                                <input
                                                                    type="email"
                                                                    className="form-control"
                                                                    value={emailData.email}
                                                                    onChange={(e) => setEmailData({
                                                                        ...emailData,
                                                                        email: e.target.value
                                                                    })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="mb-4">
                                                                <label className="form-label fw-bold">
                                                                    <i className="fas fa-key me-2"></i>
                                                                    {t('confirm_password') || '确认密码'}
                                                                </label>
                                                                <input
                                                                    type="password"
                                                                    className="form-control"
                                                                    value={emailData.password}
                                                                    onChange={(e) => setEmailData({
                                                                        ...emailData,
                                                                        password: e.target.value
                                                                    })}
                                                                    placeholder={t('enter_password_to_confirm') || '输入密码以确认修改'}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="text-center">
                                                                <button
                                                                    type="submit"
                                                                    className="btn btn-primary px-4"
                                                                    disabled={isLoading}
                                                                >
                                                                    {isLoading ? (
                                                                        <><i className="fas fa-spinner fa-spin me-2"></i>{t('updating') || '更新中...'}</>
                                                                    ) : (
                                                                        <><i className="fas fa-save me-2"></i>{t('update_email') || '更新邮箱'}</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserConfigPage;
