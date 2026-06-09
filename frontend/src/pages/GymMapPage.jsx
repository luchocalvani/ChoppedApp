import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, MarkerF, CircleF, useJsApiLoader } from '@react-google-maps/api';
import api from '../services/api';
import '../styles/GymMap.css';

const CABA_CENTER = { lat: -34.6037, lng: -58.3816 };
const MAP_STYLE = { width: '100%', height: '560px' };
const MAP_OPTIONS = { streetViewControl: false, mapTypeControl: false, fullscreenControl: false };

export default function GymMapPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
  });

  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [userPos, setUserPos]   = useState(null);
  const [center, setCenter]     = useState(CABA_CENTER);
  const [geoReady, setGeoReady] = useState(false);

  const [radiusKm, setRadiusKm]           = useState(15);
  const [gyms, setGyms]                   = useState([]);
  const [selectedChain, setSelectedChain] = useState('all');
  const [status, setStatus]               = useState('');
  const [loading, setLoading]             = useState(false);

  // Only chain filter — backend already filtered by radius
  const visibleGyms = useMemo(() =>
    selectedChain === 'all' ? gyms : gyms.filter((g) => g.chain === selectedChain),
  [gyms, selectedChain]);

  // Geolocation — runs once
  useEffect(() => {
    if (!navigator.geolocation) { setGeoReady(true); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setUserPos(pos);
        setCenter(pos);
        setGeoReady(true);
      },
      () => setGeoReady(true),
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Center map once when GPS resolves
  useEffect(() => {
    if (mapRef.current && userPos) {
      mapRef.current.panTo(userPos);
      mapRef.current.setZoom(12);
    }
  }, [userPos]);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const fetchGyms = useCallback(async (lat, lng, km) => {
    setLoading(true);
    setStatus('Buscando sucursales...');
    try {
      const { data } = await api.get('/gyms', {
        params: { lat, lng, radiusKm: km },
        timeout: 30000,
      });
      setGyms(data);
      setStatus(data.length === 0 ? 'No se encontraron sucursales en el area.' : '');
    } catch {
      setStatus('Error al buscar gimnasios. Revisa tu conexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  const statusText =
    status ||
    `${visibleGyms.length} sucursal${visibleGyms.length !== 1 ? 'es' : ''}` +
      `${selectedChain !== 'all' ? ` · ${selectedChain}` : ''} en ${radiusKm} km`;

  return (
    <div className="gymmap-page">
      <div className="gymmap-header">
        <h1>Mapa de gimnasios</h1>
        <button className="gymmap-back" onClick={() => navigate('/dashboard')}>
          Volver
        </button>
      </div>

      <div className="gymmap-controls">
        <div className="gymmap-control-group">
          <label className="gymmap-control-label">
            Radio: <strong>{radiusKm} km</strong>
          </label>
          <input
            type="range" min={2} max={50} step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="gymmap-slider"
          />
        </div>

        <div className="gymmap-control-group">
          <label className="gymmap-control-label">Cadena</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="gymmap-select"
          >
            <option value="all">Megatlon y SportClub</option>
            <option value="Megatlon">Megatlon</option>
            <option value="SportClub">SportClub</option>
          </select>
        </div>

        <button
          className="gymmap-search-btn"
          onClick={() => fetchGyms(center.lat, center.lng, radiusKm)}
          disabled={loading || !geoReady}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <p className="gymmap-subtitle">{statusText}</p>

      <div className="gymmap-card">
        {!isLoaded ? (
          <div className="gymmap-loading">Cargando mapa...</div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_STYLE}
            center={center}
            zoom={11}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
          >
            {/* radius circle */}
            <CircleF
              center={center}
              radius={radiusKm * 1000}
              options={{
                strokeColor: '#3d8bef',
                strokeOpacity: 0.7,
                strokeWeight: 1,
                fillColor: '#3d8bef',
                fillOpacity: 0.05,
              }}
            />

            {/* user position */}
            {userPos && (
              <CircleF
                center={userPos}
                radius={120}
                options={{
                  strokeColor: '#e03535',
                  strokeWeight: 2,
                  fillColor: '#e03535',
                  fillOpacity: 0.9,
                }}
              />
            )}

            {/* gym markers */}
            {visibleGyms.map((gym) => (
              <MarkerF
                key={gym.id}
                position={{ lat: gym.lat, lng: gym.lng }}
                title={`${gym.name}${gym.address ? '\n' + gym.address : ''}`}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      {visibleGyms.length > 0 && (
        <div className="gymmap-list">
          {visibleGyms.map((gym) => (
            <div key={gym.id} className="gymmap-list-item">
              <strong>{gym.name}</strong>
              <span className="gymmap-chain-badge">{gym.chain}</span>
              {gym.address && <div className="gymmap-list-addr">{gym.address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
