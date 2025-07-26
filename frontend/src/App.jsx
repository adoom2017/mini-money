import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage.jsx';
import BookkeepingPage from './components/BookkeepingPage.jsx';
import RecordsPage from './components/RecordsPage.jsx';
import StatisticsPage from './components/StatisticsPage.jsx';
import AssetsPage from './components/AssetsPage.jsx';
import Toast from './components/Toast.jsx';

// User Settings Modal Component
const UserSettingsModal = ({ user, onClose, onUpdatePassword, onUpdateEmail, t }) => {
    const [activeTab, setActiveTab] = React.useState('profile');
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [emailData, setEmailData] = React.useState({
        email: user.email || '',
        password: ''
    });
    const [isLoading, setIsLoading] = React.useState(false);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
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
            alert('Please fill in all fields');
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

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{t('user_settings')}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Navigation Tabs */}
                        <ul className="nav nav-tabs mb-3">
                            <li className="nav-item">
                                <a
                                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
                                >
                                    {t('profile')}
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveTab('password'); }}
                                >
                                    {t('change_password')}
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link ${activeTab === 'email' ? 'active' : ''}`}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveTab('email'); }}
                                >
                                    {t('change_email')}
                                </a>
                            </li>
                        </ul>

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                <div className="row">
                                    <div className="col-md-4 text-center">
                                        <div className="avatar-preview mx-auto mb-3" style={{
                                            width: '80px',
                                            height: '80px',
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
                                                <span style={{ fontSize: '2em' }}>👤</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        <div className="mb-3">
                                            <label className="form-label">{t('username')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={user.username || ''}
                                                disabled
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('email')}</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={user.email || ''}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">{t('current_password')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('new_password')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        required
                                        minLength="6"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('confirm_password')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('updating') : t('update_password')}
                                </button>
                            </form>
                        )}

                        {/* Email Tab */}
                        {activeTab === 'email' && (
                            <form onSubmit={handleEmailSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">{t('new_email')}</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={emailData.email}
                                        onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('confirm_password')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={emailData.password}
                                        onChange={(e) => setEmailData({...emailData, password: e.target.value})}
                                        placeholder={t('enter_password_to_confirm')}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('updating') : t('update_email')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Avatar Upload Modal Component
const AvatarUploadModal = ({ user, onClose, onUpdateAvatar, t }) => {
    const [avatarPreview, setAvatarPreview] = React.useState(user.avatar || '');
    const [isUploading, setIsUploading] = React.useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!avatarPreview) return;

        setIsUploading(true);
        try {
            await onUpdateAvatar(avatarPreview);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarPreview('');
        onUpdateAvatar('');
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{t('change_avatar')}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body text-center">
                        <div className="mb-3">
                            <div className="avatar-preview mx-auto" style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '3px solid #dee2e6',
                                marginBottom: '1rem'
                            }}>
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar Preview"
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
                        </div>
                        <div className="mb-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="form-control"
                                id="avatarUpload"
                            />
                            <small className="text-muted">
                                {t('upload_avatar')} (Max 5MB, JPG/PNG/GIF)
                            </small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={handleRemoveAvatar}
                            disabled={isUploading}
                        >
                            Remove Avatar
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isUploading || !avatarPreview}
                        >
                            {isUploading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [lang, setLang] = React.useState('zh');
    const [page, setPage] = React.useState('bookkeeping');
    const [allCategories, setAllCategories] = React.useState({ expense: [], income: [] });
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [token, setToken] = React.useState(null);
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [isAuthChecking, setIsAuthChecking] = React.useState(false);
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
    const [showAvatarModal, setShowAvatarModal] = React.useState(false);
    const [showSettingsModal, setShowSettingsModal] = React.useState(false);
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    // Get translator function
    const t = window.createTranslator ? window.createTranslator(lang) : (key) => key;

    // Toast helper function
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    // Check authentication status on app load
    React.useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                setToken(savedToken);
                setIsAuthChecking(true);
                // Token will be validated in the next useEffect when token state changes
            } else {
                // No token, user is definitely not authenticated
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    // Close user menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('.user-info')) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showUserMenu]);

    // Fetch user profile
    const fetchUserProfile = async () => {
        if (!token) {
            console.warn('No token available for user profile fetch');
            setIsAuthChecking(false);
            setIsInitialized(true);
            return;
        }

        try {
            const response = await fetchWithAuth('/api/user/profile');

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true); // Only set as authenticated when we successfully get user data
            } else if (response.status === 401) {
                // Token is invalid, clear it and don't set as authenticated
                console.warn('Token validation failed - clearing authentication');
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            } else {
                console.error('Failed to fetch user profile:', response.status);
                // For other errors, also clear authentication to be safe
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setIsAuthenticated(false);
        } finally {
            // Always complete the auth checking process and mark as initialized
            setIsAuthChecking(false);
            setIsInitialized(true);
        }
    };    // Update user avatar
    const updateAvatar = async (avatarData) => {
        try {
            const response = await fetchWithAuth('/api/user/avatar', {
                method: 'PUT',
                body: JSON.stringify({ avatar: avatarData })
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setShowAvatarModal(false);
                showToast(t('avatar_updated'), 'success');
            } else {
                showToast('Failed to update avatar', 'error');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            showToast('Error updating avatar', 'error');
        }
    };

    // Update user password
    const updatePassword = async (passwordData) => {
        try {
            const response = await fetchWithAuth('/api/user/password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });

            if (response.ok) {
                showToast(t('password_updated'), 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showToast('Error updating password', 'error');
        }
    };

    // Update user email
    const updateEmail = async (emailData) => {
        try {
            const response = await fetchWithAuth('/api/user/email', {
                method: 'PUT',
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                showToast(t('email_updated'), 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || 'Failed to update email', 'error');
            }
        } catch (error) {
            console.error('Error updating email:', error);
            showToast('Error updating email', 'error');
        }
    };

    const login = (authData) => {
        const { token, user } = authData;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        setPage('bookkeeping'); // 确保登录后设置为记账页面
        showToast(t('login_success'), 'success');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setPage('auth');
        showToast(t('logged_out'), 'success');
    };

    const fetchWithAuth = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle 401 Unauthorized - but only if we had a token and thought we were authenticated
        // This prevents logout during initial page load when token validation fails
        if (response.status === 401 && token && isAuthenticated) {
            logout();
        }

        return response;
    };    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setAllCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    React.useEffect(() => {
        fetchCategories();
    }, []);

    React.useEffect(() => {
        if (token && isAuthChecking) {
            // Only fetch user profile when we have a token and are in auth checking mode
            fetchUserProfile();
        }
    }, [token, isAuthChecking]);

    const categoryIconMap = React.useMemo(() => {
        const map = new Map();
        if (allCategories.expense) {
            allCategories.expense.forEach(c => map.set(c.key, c.icon));
        }
        if (allCategories.income) {
            allCategories.income.forEach(c => map.set(c.key, c.icon));
        }
        return map;
    }, [allCategories]);

    const commonProps = {
        lang,
        t,
        allCategories,
        categoryIconMap,
        fetchWithAuth,
        showToast
    };

    if (!isInitialized) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">{t('loading')}</span>
                    </div>
                    <p className="mt-3 text-muted">{t('initializing_app')}</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage lang={lang} t={t} login={login} showToast={showToast} />;
    }

    return (
        <div className="container mt-4">
            {/* Toast component */}
            {toast.show && <Toast
                message={toast.message}
                type={toast.type}
                show={toast.show}
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />}

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h1 className="mb-0">{t('title')}</h1>
                <div className="d-flex align-items-center">
                    {/* User info */}
                    {user && (
                        <div className="position-relative">
                            <div className="user-info me-3 p-2 rounded" style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                cursor: 'pointer'
                            }} title={t('user_profile')} onClick={() => setShowUserMenu(!showUserMenu)}>
                                <div className="d-flex align-items-center">
                                    <div className="avatar-container me-2" style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        backgroundColor: '#e9ecef',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #dee2e6'
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
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                        ) : null}
                                        <span style={{
                                            fontSize: '1.2em',
                                            display: user.avatar ? 'none' : 'block'
                                        }}>👤</span>
                                    </div>
                                    <div>
                                        <div className="fw-bold" style={{fontSize: '0.9em', lineHeight: '1.2'}}>
                                            {t('welcome')}, {user.username}
                                        </div>
                                        {user.email && (
                                            <small className="text-muted" style={{fontSize: '0.75em'}}>
                                                {user.email}
                                            </small>
                                        )}
                                    </div>
                                    <span className="ms-2" style={{fontSize: '0.8em'}}>▼</span>
                                </div>
                            </div>
                            {showUserMenu && (
                                <div className="position-absolute top-100 end-0 bg-white border rounded shadow-sm mt-1" style={{
                                    minWidth: '200px',
                                    zIndex: 1000
                                }}>
                                    <div className="py-1">
                                        <button
                                            className="btn btn-link text-start w-100 text-decoration-none px-3 py-2"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowAvatarModal(true);
                                            }}
                                            style={{color: '#495057'}}
                                        >
                                            <span className="me-2">🖼️</span>
                                            {t('change_avatar')}
                                        </button>
                                        <button
                                            className="btn btn-link text-start w-100 text-decoration-none px-3 py-2"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowSettingsModal(true);
                                            }}
                                            style={{color: '#495057'}}
                                        >
                                            <span className="me-2">⚙️</span>
                                            {t('user_settings')}
                                        </button>
                                        <hr className="my-1" />
                                        <button
                                            className="btn btn-link text-start w-100 text-decoration-none px-3 py-2"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                logout();
                                            }}
                                            style={{color: '#dc3545'}}
                                        >
                                            <span className="me-2">🚪</span>
                                            {t('logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                    >
                        {lang === 'en' ? '中文' : 'English'}
                    </button>
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={logout}
                    >
                        {t('logout')}
                    </button>
                </div>
            </div>

            {/* Navigation tabs */}
            <ul className="nav nav-tabs main-nav">
                <li className="nav-item">
                    <a
                        className={`nav-link ${page === 'bookkeeping' ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage('bookkeeping'); }}
                    >
                        {t('bookkeeping')}
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${page === 'records' ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage('records'); }}
                    >
                        {t('records')}
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${page === 'statistics' ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage('statistics'); }}
                    >
                        {t('statistics')}
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${page === 'assets' ? 'active' : ''}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setPage('assets'); }}
                    >
                        {t('assets')}
                    </a>
                </li>
            </ul>

            {/* Page content */}
            {page === 'bookkeeping' && (
                <BookkeepingPage {...commonProps} />
            )}
            {page === 'records' && (
                <RecordsPage {...commonProps} />
            )}
            {page === 'statistics' && (
                <StatisticsPage {...commonProps} />
            )}
            {page === 'assets' && (
                <AssetsPage {...commonProps} />
            )}

            {/* Avatar Upload Modal */}
            {showAvatarModal && (
                <AvatarUploadModal
                    user={user}
                    onClose={() => setShowAvatarModal(false)}
                    onUpdateAvatar={updateAvatar}
                    t={t}
                />
            )}

            {/* User Settings Modal */}
            {showSettingsModal && (
                <UserSettingsModal
                    user={user}
                    onClose={() => setShowSettingsModal(false)}
                    onUpdatePassword={updatePassword}
                    onUpdateEmail={updateEmail}
                    t={t}
                />
            )}
        </div>
    );
};

// Export the App component as default
export default App;