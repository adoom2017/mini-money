const AuthPage = ({ lang, t, login, showToast }) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [form, setForm] = React.useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleInputChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin 
                ? { username: form.username, password: form.password }
                : { username: form.username, email: form.email, password: form.password };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                login(data);
                // The showToast is handled in the main app after login
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                        <h3 className="card-title text-center mb-4">
                            {t(isLogin ? 'login_title' : 'register_title')}
                        </h3>
                        
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">{t('username')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        name="username"
                                        value={form.username}
                                        onChange={handleInputChange}
                                        placeholder={t('username_placeholder')}
                                        required
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">{t('email')}</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleInputChange}
                                            placeholder={t('email_placeholder')}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">{t('password')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleInputChange}
                                        placeholder={t('password_placeholder')}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? t('loading') : t(isLogin ? 'login' : 'register')}
                                </button>
                            </form>

                            <div className="text-center">
                                <span className="text-muted">
                                    {t(isLogin ? 'no_account' : 'have_account')}
                                </span>
                                <button
                                    className="btn btn-link p-0 ms-1"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {t(isLogin ? 'register' : 'login')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export for global access
window.AuthPage = AuthPage;
