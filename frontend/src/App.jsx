/**
 * Main app: routing and layout. Protects private routes; shows header/sidebar when logged in.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import StudyPlanner from './pages/StudyPlanner';
import Relaxation from './pages/Relaxation';
import Profile from './pages/Profile';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading...</p>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout><Dashboard /></AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mood"
        element={
          <PrivateRoute>
            <AppLayout><MoodTracker /></AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/study"
        element={
          <PrivateRoute>
            <AppLayout><StudyPlanner /></AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/relax"
        element={
          <PrivateRoute>
            <AppLayout><Relaxation /></AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppLayout><Profile /></AppLayout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
