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
import DashboardAnalytics from './pages/DashboardAnalytics';
import MoodAnalytics from './pages/MoodAnalytics';
import StudyAnalytics from './pages/StudyAnalytics';
import RelaxationAnalytics from './pages/RelaxationAnalytics';
import Forum from './pages/Forum';
import ForumAnalytics from './pages/ForumAnalytics';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div
        className="loading-wrap"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>🌱</span>
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
      <div
        className="loading-wrap"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>🌱</span>
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

function ConditionalRoute({ adminComponent, studentComponent }) {
  const { isAdmin } = useAuth();
  return isAdmin ? adminComponent : studentComponent;
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
            <AppLayout>
              <ConditionalRoute
                adminComponent={<DashboardAnalytics />}
                studentComponent={<Dashboard />}
              />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mood"
        element={
          <PrivateRoute>
            <AppLayout>
              <ConditionalRoute
                adminComponent={<MoodAnalytics />}
                studentComponent={<MoodTracker />}
              />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/study"
        element={
          <PrivateRoute>
            <AppLayout>
              <ConditionalRoute
                adminComponent={<StudyAnalytics />}
                studentComponent={<StudyPlanner />}
              />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/relax"
        element={
          <PrivateRoute>
            <AppLayout>
              <ConditionalRoute
                adminComponent={<RelaxationAnalytics />}
                studentComponent={<Relaxation />}
              />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/forum"
        element={
          <PrivateRoute>
            <AppLayout>
              <ConditionalRoute
                adminComponent={<ForumAnalytics />}
                studentComponent={<Forum />}
              />
            </AppLayout>
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
