import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import EditorPage from './pages/EditorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { PhoneManagementPage } from './pages/admin/PhoneManagementPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { PhoneEntry } from './api/phones';

function getSavedAuth(): string | null {
  return sessionStorage.getItem('app-auth-user');
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPhoneManagement, setShowPhoneManagement] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getSavedAuth());
    setReady(true);
  }, []);

  const handleLogin = (phone: string, entry?: PhoneEntry) => {
    sessionStorage.setItem('app-auth-user', phone);
    if (entry) {
      sessionStorage.setItem('app-auth-entry', JSON.stringify(entry));
    } else {
      sessionStorage.removeItem('app-auth-entry');
    }
    // 로그인 직후 상태 전환 대신 새로고침과 동일하게 전체 앱 재시작
    window.location.reload();
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0f1e] text-indigo-200 text-sm">
        로딩 중...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onAdminPageOpen={() => setShowPhoneManagement(true)}
        />
        {showPhoneManagement && (
          <PhoneManagementPage onClose={() => setShowPhoneManagement(false)} />
        )}
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <EditorPage />
      <Toaster richColors position="top-center" />
    </ErrorBoundary>
  );
}
