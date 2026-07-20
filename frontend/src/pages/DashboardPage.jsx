import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { me, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <h1 className="dashboard-logo">
          C<span className="logo-h">H<span className="logo-icon" /></span>OPPEDAPP
        </h1>
        <p className="dashboard-tagline">Fitness tracker</p>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀ Modo claro' : '☾ Modo oscuro'}
          </button>
      </section>

      <div className="dashboard-grid">
        <button className="dashboard-item primary" onClick={() => navigate('/workouts')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">🏋️</span>
              <div>
                <div className="item-label">Entrenar</div>
                <div className="item-sub">Mis rutinas y rutinas predefinidas</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/workouts/crear')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">➕</span>
              <div>
                <div className="item-label">Crear rutina</div>
                <div className="item-sub">Nueva plantilla</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/training-history')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">📚</span>
              <div>
                <div className="item-label">Historial</div>
                <div className="item-sub">Entrenamientos guardados</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/technique')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">🎥</span>
              <div>
                <div className="item-label">Correccion de tecnica</div>
                <div className="item-sub">Analisis y feedback</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/store')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">🛒</span>
              <div>
                <div className="item-label">Tienda</div>
                <div className="item-sub">Productos y accesorios</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/profile')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">👤</span>
              <div>
                <div className="item-label">Perfil</div>
                <div className="item-sub">Alias y foto</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/ranking')}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">🏆</span>
              <div>
                <div className="item-label">Ranking</div>
                <div className="item-sub">Usuarios por nivel y XP</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>

        <button className="dashboard-item" onClick={() => navigate('/gym-map')}>
            <div className="item-inner">
                <div className="item-left">
                    <span className="item-icon">🗺️</span>
                  <div>
                      <div className="item-label">Mapa de gimnasios</div>
                <div className="item-sub">gyms (google maps)</div>
             </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>


        {me?.isAdmin && (
          <button className="dashboard-item" onClick={() => navigate('/admin')}>
            <div className="item-inner">
              <div className="item-left">
                <span className="item-icon">🛡️</span>
                <div>
                  <div className="item-label">Panel Admin</div>
                  <div className="item-sub">Gestionar usuarios</div>
                </div>
              </div>
              <span className="item-arrow">›</span>
            </div>
          </button>
        )}

        <button className="dashboard-item danger" onClick={handleLogout}>
          <div className="item-inner">
            <div className="item-left">
              <span className="item-icon">⏻</span>
              <div>
                <div className="item-label">Cerrar sesion</div>
                <div className="item-sub">Salir de la cuenta</div>
              </div>
            </div>
            <span className="item-arrow">›</span>
          </div>
        </button>
      </div>
    </div>
  );
}
