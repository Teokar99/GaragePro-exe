import { useEffect, useState } from 'react';
import { FirstRunWizard } from './components/auth/FirstRunWizard';
import { PINLogin } from './components/auth/PINLogin';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useAutoLock } from './hooks/useAutoLock';
import { authRepository } from './lib/repositories/authRepository';
import { DatabaseSeeder } from './mocks/DatabaseSeeder';
import { AdminRevenuePage } from './pages/AdminRevenuePage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';

function AutoLockWarning({ onDismiss, remainingTime }: { onDismiss: () => void; remainingTime: number }) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-600 mx-auto mb-4">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-2">Session Timeout Warning</h3>
        <p className="text-gray-300 text-center mb-6">
          Your session will expire in {minutes > 0 && `${minutes} minute${minutes !== 1 ? 's' : ''}`} {seconds} second{seconds !== 1 ? 's' : ''} due to inactivity.
        </p>
        <button
          onClick={onDismiss}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Continue Working
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [checkingFirstRun, setCheckingFirstRun] = useState(true);
  const { showWarning, dismissWarning, remainingTime } = useAutoLock({ enabled: !!user });

  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash === '/customers') return 'customers';
    if (hash === '/services') return 'services';
    if (hash === '/users') return 'users';
    if (hash === '/database') return 'database';
    if (hash === '/revenue') return 'revenue';
    if (hash === '/settings') return 'settings';
    return 'dashboard';
  });
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const firstRun = await authRepository.checkFirstRun();
        setIsFirstRun(firstRun);
      } catch (error) {
        console.error('Error checking first run:', error);
        setIsFirstRun(false);
      } finally {
        setCheckingFirstRun(false);
      }
    };

    checkFirstRun();
  }, []);

useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash.slice(1);

    if (hash === '/customers') setCurrentPage('customers');
    else if (hash === '/services') setCurrentPage('services');
    else if (hash === '/users') setCurrentPage('users');
    else if (hash === '/database') setCurrentPage('database');
    else if (hash === '/revenue') setCurrentPage('revenue');
    else if (hash === '/settings') setCurrentPage('settings');
    else setCurrentPage('dashboard');
  };

  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);

  if (checkingFirstRun || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

if (isFirstRun) {
  return (
    <FirstRunWizard
      onComplete={() => setIsFirstRun(false)}
    />
  );
}

  if (!user) {
    return <PINLogin />;
  }

const navigate = (page: string, data?: any) => {
  // ΠΡΩΤΑ σώσε το payload
  console.log("[NAVIGATE] page:", page, "data:", data);
  setPageData(data ?? null);

  // ΜΗΝ κάνεις setCurrentPage εδώ
  const hash = page === "dashboard" ? "" : `#/${page}`;
  window.location.hash = hash;
};

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} navData={pageData} />;
      case 'customers':
        return <CustomersPage onNavigate={navigate} />;
      case 'services':
        return <ServicesPage onNavigate={navigate} navData={pageData} />;
      case 'users':
        return <UsersPage />;
      case 'database':
        return <DatabaseSeeder />;
      case 'revenue':
        return <AdminRevenuePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={navigate}>
        {renderPage()}
      </Layout>
      {showWarning && <AutoLockWarning onDismiss={dismissWarning} remainingTime={remainingTime} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
