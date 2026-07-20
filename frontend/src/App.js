import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import CreateWorkoutPage from './pages/CreateWorkoutPage';
import EditWorkoutPage from './pages/EditWorkoutPage';
import TrainWorkoutPage from './pages/TrainWorkoutPage';
import TechniquePage from './pages/TechniquePage';
import StorePage from './pages/StorePage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import TrainingHistoryPage from './pages/TrainingHistoryPage';
import GymMapPage from './pages/GymMapPage';
import AdminPage from './pages/AdminPage';
import CollectiblesPage from './pages/CollectiblesPage';
import AchievementsPage from './pages/AchievementsPage';
import RankingPage from './pages/RankingPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

import './App.css';

function App() {
  const { me, authReady } = useAuth();

  if (!authReady) {
    return <div className="auth-container">Cargando sesion...</div>;
  }

  return (
    <Router>
      <div className="auth-container">
        <Routes>
          <Route path="/login" element={!me ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <WorkoutsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/crear"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <CreateWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/:id/edit"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <EditWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/:id/train"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <TrainWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technique"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <TechniquePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <StorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training-history"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <TrainingHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gym-map"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <GymMapPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collectibles"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <CollectiblesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                <RankingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={!!me}>
                {me?.isAdmin ? <AdminPage /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            }
          />

          <Route path="/" element={!me ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to={me ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
