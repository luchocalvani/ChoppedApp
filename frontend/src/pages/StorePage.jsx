import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Store.css';

export default function StorePage() {
  const navigate = useNavigate();
  const { me } = useAuth();

  const [items, setItems] = useState([]);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [itemsRes, collectiblesRes, userRes] = await Promise.all([
          api.get('/store/items'),
          api.get('/store/collectibles'),
          api.get(`/users/${me.userId}`),
        ]);
        setItems(itemsRes.data);
        setOwnedIds(new Set(collectiblesRes.data.map((c) => c.itemId)));
        setPoints(userRes.data.points);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [me.userId]);

  const handleBuy = async (item) => {
    setBuying(item.id);
    setMsg('');
    try {
      const { data } = await api.post(`/store/buy/${item.id}`);
      setOwnedIds((prev) => new Set([...prev, item.id]));
      setPoints(data.remainingPoints);
      setMsg(`Compraste "${item.name}"!`);
    } catch (err) {
      const m = err?.response?.data?.message;
      setMsg(m || 'Error al comprar');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="page-content">
      <div className="store-container">
        <div className="store-header">
          <h1>Tienda</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="store-points-badge">{points} pts</span>
            <button className="cart-btn" onClick={() => navigate('/collectibles')}>
              Coleccionables
            </button>
            <button className="cart-btn" onClick={() => navigate('/dashboard')}>
              Volver
            </button>
          </div>
        </div>

        {msg && (
          <div className={`store-msg ${msg.includes('Error') || msg.includes('insuf') ? 'store-msg-err' : 'store-msg-ok'}`}>
            {msg}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        ) : (
          <div className="products-grid">
            {items.map((item) => {
              const owned = ownedIds.has(item.id);
              const canAfford = points >= item.price;
              return (
                <div key={item.id} className={`product-card ${owned ? 'product-owned' : ''}`}>
                  <span className="product-icon">{item.icon}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="price">{item.price} pts</div>
                  {owned ? (
                    <div className="owned-badge">Obtenido</div>
                  ) : (
                    <button
                      className="add-btn"
                      disabled={!canAfford || buying === item.id}
                      onClick={() => handleBuy(item)}
                    >
                      {buying === item.id ? '...' : canAfford ? 'Comprar' : 'Sin puntos'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
