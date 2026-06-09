import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Store.css';
import '../styles/Collectibles.css';

export default function CollectiblesPage() {
  const navigate = useNavigate();
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/store/collectibles')
      .then(({ data }) => setCollectibles(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="store-container">
        <div className="store-header">
          <h1>Coleccionables</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cart-btn" onClick={() => navigate('/store')}>Tienda</button>
            <button className="cart-btn" onClick={() => navigate('/dashboard')}>Volver</button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        ) : collectibles.length === 0 ? (
          <div className="collectibles-empty">
            <span>🎒</span>
            <p>Aun no tienes coleccionables.</p>
            <button className="cart-btn" onClick={() => navigate('/store')}>Ir a la tienda</button>
          </div>
        ) : (
          <div className="products-grid">
            {collectibles.map((c) => (
              <div key={c.id} className="product-card">
                <span className="product-icon">{c.item?.icon ?? '?'}</span>
                <h3>{c.item?.name ?? c.itemId}</h3>
                <p>{c.item?.description ?? ''}</p>
                <div className="collectible-date">
                  Obtenido el {new Date(c.purchasedAt).toLocaleDateString('es-AR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
