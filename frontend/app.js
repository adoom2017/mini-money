const App = () => {
    const [lang, setLang] = React.useState('zh');
    const [page, setPage] = React.useState('bookkeeping');
    const [allCategories, setAllCategories] = React.useState({ expense: [], income: [] });
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [token, setToken] = React.useState(null);
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });

    // Get translator function
    const t = window.createTranslator ? window.createTranslator(lang) : (key) => key;

    // Toast helper function
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    // Check authentication status on app load
    React.useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            setIsAuthenticated(true);
        }
        setIsInitialized(true);
    }, []);

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
    };

    const fetchWithAuth = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        return fetch(url, {
            ...options,
            headers,
        });
    };

    const fetchCategories = async () => {
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
        if (token) {
            setIsAuthenticated(true);
        }
    }, [token]);
    
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
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />}
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h1 className="mb-0">{t('title')}</h1>
                <div>
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
            </ul>

            {/* Page content */}
            {page === 'bookkeeping' && (
                window.BookkeepingPage ? 
                <BookkeepingPage {...commonProps} /> : 
                <div className="alert alert-warning">
                    <h5>记账页面组件正在加载中...</h5>
                    <p>当前页面: {page}</p>
                    <p>组件状态: BookkeepingPage = {typeof window.BookkeepingPage}</p>
                    <p>如果一直显示此信息，请检查组件是否正确加载。</p>
                </div>
            )}
            {page === 'records' && (
                window.RecordsPage ? 
                <RecordsPage {...commonProps} /> : 
                <div className="alert alert-info">记录页面组件正在加载中...</div>
            )}
            {page === 'statistics' && (
                window.StatisticsPage ? 
                <StatisticsPage {...commonProps} /> : 
                <div className="alert alert-info">统计页面组件正在加载中...</div>
            )}
        </div>
    );
};

// Use React 18 createRoot but keep immediate execution for compatibility
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}