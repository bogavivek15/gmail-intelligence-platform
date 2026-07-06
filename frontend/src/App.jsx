import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoadingState from './components/LoadingState.jsx';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import Chat from './pages/Chat.jsx';
import Compose from './pages/Compose.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmailPage from './pages/EmailPage.jsx';
import Inbox from './pages/Inbox.jsx';
import Login from './pages/Login.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import AuthDebug from './pages/AuthDebug.jsx';

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <AuthProvider>
      <div className="app-shell">
        {!isLoginPage ? <Navbar /> : null}
        <main className={isLoginPage ? "login-page-container" : "page-shell"}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/emails/:id" element={<ProtectedRoute><EmailPage /></ProtectedRoute>} />
            <Route path="/threads/:threadId" element={<ProtectedRoute><ThreadPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/compose" element={<ProtectedRoute><Compose /></ProtectedRoute>} />
            <Route path="/debug/auth" element={<ProtectedRoute><AuthDebug /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Verifying session credentials" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
