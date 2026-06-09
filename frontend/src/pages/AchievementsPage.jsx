import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Achievements.css';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ count: 0, achievements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/achievements')
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="ach-container">
        <div className="ach-header">
          <div>
            <h1>Logros</h1>
            <span className="ach-count">{data.count} logro{data.count !== 1 ? 's' : ''}</span>
          </div>
          <button className="ach-back-btn" onClick={() => navigate('/profile')}>Volver</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        ) : data.achievements.length === 0 ? (
          <div className="ach-empty">
            <span>🏅</span>
            <p>Aun no tienes logros. Levanta peso para desbloquearlos.</p>
          </div>
        ) : (
          <div className="ach-grid">
            {data.achievements.map((a) => (
              <div key={a.id} className="ach-card">
                <span className="ach-icon">🏅</span>
                <div className="ach-info">
                  <strong>{a.exerciseName}</strong>
                  <span className="ach-milestone">{a.milestoneKg} kg</span>
                  <span className="ach-date">
                    {new Date(a.earnedAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
