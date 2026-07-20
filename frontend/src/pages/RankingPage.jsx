import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Ranking.css';

const PAGE_SIZE = 10;

export default function RankingPage() {
  const navigate = useNavigate();
  const { me } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const loadRanking = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/users/ranking', {
          params: { page, pageSize: PAGE_SIZE },
        });
        setItems(data.items || []);
        setTotal(data.total ?? 0);
        setMyRank(data.myRank ?? null);
      } catch (err) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo cargar el ranking');
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [page]);

  return (
    <div className="page-content">
      <div className="ranking-container">
        <div className="ranking-header">
          <h1>Ranking</h1>
          <button onClick={() => navigate('/dashboard')} className="ghost-btn">Volver</button>
        </div>

        {myRank && (
          <p className="ranking-my-position">
            Tu posicion: <strong>#{myRank}</strong>
          </p>
        )}

        {loading ? (
          <p className="loading">Cargando ranking...</p>
        ) : (
          <>
            <div className="ranking-list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`ranking-row ${item.id === me?.userId ? 'ranking-row-me' : ''}`}
                >
                  <span className="ranking-rank">#{item.rank}</span>
                  {item.profileImageUrl ? (
                    <img src={item.profileImageUrl} alt="" className="ranking-avatar" />
                  ) : (
                    <div className="ranking-avatar-fallback">👤</div>
                  )}
                  <div className="ranking-name-col">
                    <span className="ranking-name">{item.alias || item.name}</span>
                  </div>
                  <span className="ranking-level">Nivel {item.level}</span>
                  <span className="ranking-xp">{item.xp} XP</span>
                </div>
              ))}
              {items.length === 0 && <p className="no-workouts">Todavia no hay usuarios rankeados.</p>}
            </div>

            <div className="ranking-pagination">
              <button
                className="ghost-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹ Anterior
              </button>
              <span className="ranking-page-label">Pagina {page} de {totalPages}</span>
              <button
                className="ghost-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Siguiente ›
              </button>
            </div>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
