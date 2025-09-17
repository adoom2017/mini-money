import React, { useState } from 'react';

const UserConfigPage = ({ user, onClose, onUpdatePassword, onUpdateEmail, onUpdateAvatar, onLogout, t }) => {
    console.log('UserConfigPage rendered with:', { user, t });
    
    // 添加防御性检查
    if (!user) {
        console.log('User is null, showing loading...');
        return (
            <div className="assets-inner-content">
                <div className="user-settings-page">
                    <div className="page-header d-flex justify-content-between align-items-center mb-4">
                        <h2>加载中...</h2>
                    </div>
                    <div className="settings-content">
                        <p>用户信息加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 确保t函数有默认值
    const translate = t || ((key) => {
        console.log('Using fallback translation for:', key);
        return key;
    });

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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert(translate('passwords_not_match') || 'New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert(translate('password_min_length') || 'Password must be at least 6 characters long');
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
            alert(translate('fill_all_fields') || 'Please fill in all fields');
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
                alert(translate('file_too_large') || 'File size must be less than 2MB');
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
        <div className="assets-inner-content">
            <div className="user-settings-page">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i className="fas fa-cog me-2"></i>
                        {translate('user_settings') || '用户设置'}
                    </h2>
                </div>
                
                <div className="settings-content">
                {/* 标签页导航 */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <i className="fas fa-user me-1"></i>
                            {translate('profile') || '资料'}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'avatar' ? 'active' : ''}`}
                            onClick={() => setActiveTab('avatar')}
                        >
                            <i className="fas fa-image me-1"></i>
                            {translate('change_avatar') || '头像'}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                            onClick={() => setActiveTab('password')}
                        >
                            <i className="fas fa-lock me-1"></i>
                            {translate('change_password') || '密码'}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'email' ? 'active' : ''}`}
                            onClick={() => setActiveTab('email')}
                        >
                            <i className="fas fa-envelope me-1"></i>
                            {translate('change_email') || '邮箱'}
                        </button>
                    </li>
                </ul>

                {/* 标签页内容 */}
                <div className="tab-content">
                    {/* 个人资料标签页 */}
                    {activeTab === 'profile' && (
                        <div className="tab-pane fade show active">
                            <div className="card" style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                overflow: 'hidden'
                            }}>
                                <div className="card-body" style={{ padding: '2rem' }}>
                                    <div className="row align-items-center">
                                        <div className="col-md-4 text-center">
                                            <div className="avatar-preview mx-auto mb-3" style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                backgroundColor: '#e9ecef',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '3px solid #dee2e6'
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
                                                    <span style={{ fontSize: '2.5em' }}>👤</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">
                                                    <i className="fas fa-user me-2"></i>
                                                    {translate('username') || '用户名'}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={user.username || ''}
                                                    disabled
                                                />
                                                <small className="text-muted">
                                                    {translate('username_cannot_change') || '用户名不可修改'}
                                                </small>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">
                                                    <i className="fas fa-envelope me-2"></i>
                                                    {translate('email') || '邮箱'}
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={user.email || '未设置'}
                                                    disabled
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
                        <div className="tab-pane fade show active">
                            <div className="card" style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                overflow: 'hidden'
                            }}>
                                <div className="card-body" style={{ padding: '2rem' }}>
                                    <div className="row">
                                        <div className="col-md-4 text-center">
                                            <div className="avatar-preview mx-auto mb-3" style={{
                                                width: '150px',
                                                height: '150px',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                backgroundColor: '#e9ecef',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '3px solid #dee2e6'
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
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">
                                                    {translate('upload_new_avatar') || '上传新头像'}
                                                </label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                />
                                                <small className="text-muted">
                                                    {translate('avatar_requirements') || '支持 JPG、PNG 格式，文件大小不超过 2MB'}
                                                </small>
                                            </div>
                                            
                                            {user.avatar && (
                                                <div className="text-center">
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => onUpdateAvatar(null)}
                                                    >
                                                        <i className="fas fa-trash me-2"></i>
                                                        {translate('remove_avatar') || '移除头像'}
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
                        <div className="tab-pane fade show active">
                            <div className="card" style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                overflow: 'hidden'
                            }}>
                                <div className="card-body" style={{ padding: '2rem' }}>
                                    <form onSubmit={handlePasswordSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">
                                                <i className="fas fa-key me-2"></i>
                                                {translate('current_password') || '当前密码'}
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
                                                {translate('new_password') || '新密码'}
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
                                                {translate('password_min_6_chars') || '密码至少 6 个字符'}
                                            </small>
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">
                                                <i className="fas fa-check-circle me-2"></i>
                                                {translate('confirm_new_password') || '确认新密码'}
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
                                                className="btn btn-primary"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <><i className="fas fa-spinner fa-spin me-2"></i>{translate('updating') || '更新中...'}</>
                                                ) : (
                                                    <><i className="fas fa-save me-2"></i>{translate('update_password') || '更新密码'}</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 修改邮箱标签页 */}
                    {activeTab === 'email' && (
                        <div className="tab-pane fade show active">
                            <div className="card" style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                overflow: 'hidden'
                            }}>
                                <div className="card-body" style={{ padding: '2rem' }}>
                                    <form onSubmit={handleEmailSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">
                                                <i className="fas fa-envelope me-2"></i>
                                                {translate('new_email') || '新邮箱地址'}
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
                                                {translate('confirm_password') || '确认密码'}
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={emailData.password}
                                                onChange={(e) => setEmailData({
                                                    ...emailData,
                                                    password: e.target.value
                                                })}
                                                placeholder={translate('enter_password_to_confirm') || '输入密码以确认修改'}
                                                required
                                            />
                                        </div>
                                        <div className="text-center">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <><i className="fas fa-spinner fa-spin me-2"></i>{translate('updating') || '更新中...'}</>
                                                ) : (
                                                    <><i className="fas fa-save me-2"></i>{translate('update_email') || '更新邮箱'}</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* 底部操作栏 */}
                <div className="settings-footer mt-4 pt-4 border-top">
                    <button
                        className="btn"
                        onClick={() => {
                            setShowLogoutConfirm(true);
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '0.8rem 1.5rem',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                            e.target.style.background = 'linear-gradient(135deg, #ff5252, #e53935)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                            e.target.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
                        }}
                    >
                        <i className="fas fa-sign-out-alt me-2"></i>
                        {translate('logout') || '登出'}
                    </button>
                </div>
            </div>
            </div>
            
            {/* 自定义确认弹窗 */}
            {showLogoutConfirm && (
                <div className="custom-confirm-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(5px)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="custom-confirm-modal" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        transform: 'scale(0.9)',
                        animation: 'modalShow 0.3s ease forwards'
                    }}>
                        <div className="confirm-header" style={{
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
                            }}>
                                <i className="fas fa-sign-out-alt" style={{
                                    fontSize: '24px',
                                    color: 'white'
                                }}></i>
                            </div>
                            <h3 style={{
                                margin: 0,
                                color: '#333',
                                fontSize: '1.5rem',
                                fontWeight: '600'
                            }}>
                                {translate('confirm_logout') || '确认退出登录'}
                            </h3>
                        </div>
                        
                        <div className="confirm-content" style={{
                            textAlign: 'center',
                            marginBottom: '2rem',
                            color: '#666',
                            fontSize: '1rem',
                            lineHeight: '1.5'
                        }}>
                            您确定要退出当前账户吗？退出后需要重新登录才能使用。
                        </div>
                        
                        <div className="confirm-buttons" style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    background: 'rgba(108, 117, 125, 0.1)',
                                    border: '1px solid rgba(108, 117, 125, 0.3)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1.5rem',
                                    color: '#6c757d',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(108, 117, 125, 0.15)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(108, 117, 125, 0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    onLogout();
                                    onClose();
                                    setShowLogoutConfirm(false);
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1.5rem',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                                    fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #ff5252, #e53935)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                                }}
                            >
                                确认退出
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserConfigPage;
