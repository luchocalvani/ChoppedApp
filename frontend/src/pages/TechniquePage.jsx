import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PoseCamera from '../components/pose/PoseCamera';
import PoseFeedback from '../components/pose/PoseFeedback';
import { usePoseTracking } from '../hooks/UsePoseTracking';
import '../styles/TechniquePage.css';

const STORAGE_KEY = 'chopped_technique_history_v1';

function safeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

function criteriaFor(mode, angle) {
  if (angle == null) {
    return { status: 'idle', message: 'No detectado' };
  }

  if (mode === 'squat') {
    // Criterio estandar aproximado para sentadilla por angulo de rodilla.
    if (angle > 155) return { status: 'warn', message: 'Bajas poco: puedes bajar mas' };
    if (angle > 120) return { status: 'info', message: 'Vas bien, intenta bajar un poco mas' };
    if (angle >= 80 && angle <= 120) return { status: 'good', message: 'Profundidad correcta' };
    if (angle < 70) return { status: 'warn', message: 'Muy profundo, controla la tecnica' };
    return { status: 'good', message: 'Buen rango de movimiento' };
  }

  // curl
  if (angle > 150) return { status: 'info', message: 'Brazo extendido correctamente' };
  if (angle >= 70 && angle <= 150) return { status: 'info', message: 'Sigue el recorrido' };
  if (angle < 60) return { status: 'good', message: 'Curl completo' };
  return { status: 'info', message: 'Movimiento estable' };
}

export default function TechniquePage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('squat');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [angles, setAngles] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [history, setHistory] = useState([]);

  const modelReadyRef = useRef(false);
  const repCountRef = useRef(0);
  const phaseRef = useRef('up');
  const startedAtRef = useRef(0);
  const samplesRef = useRef([]);

  // Resetear estado al cambiar de ejercicio
  useEffect(() => {
    repCountRef.current = 0;
    phaseRef.current = 'up';
    samplesRef.current = [];
    setAngles(null);
  }, [mode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const selectedPrimaryAngle = useMemo(() => {
    if (!angles) return null;
    if (mode === 'squat') {
      const left = safeNumber(angles.leftKnee);
      const right = safeNumber(angles.rightKnee);
      if (left == null && right == null) return null;
      if (left == null) return right;
      if (right == null) return left;
      return Math.round((left + right) / 2);
    }
    const left = safeNumber(angles.leftElbow);
    const right = safeNumber(angles.rightElbow);
    if (left == null && right == null) return null;
    if (left == null) return right;
    if (right == null) return left;
    return Math.round((left + right) / 2);
  }, [angles, mode]);

  const currentCriteria = useMemo(
    () => criteriaFor(mode, selectedPrimaryAngle),
    [mode, selectedPrimaryAngle]
  );

  const handleAngles = useCallback(
    (newAngles) => {
      if (!modelReadyRef.current) {
        modelReadyRef.current = true;
        setModelLoading(false);
      }

      setAngles(newAngles);

      const currentAngle =
        mode === 'squat'
          ? (() => {
              const l = safeNumber(newAngles?.leftKnee);
              const r = safeNumber(newAngles?.rightKnee);
              if (l == null && r == null) return null;
              if (l == null) return r;
              if (r == null) return l;
              return (l + r) / 2;
            })()
          : (() => {
              const l = safeNumber(newAngles?.leftElbow);
              const r = safeNumber(newAngles?.rightElbow);
              if (l == null && r == null) return null;
              if (l == null) return r;
              if (r == null) return l;
              return (l + r) / 2;
            })();

      if (currentAngle == null) return;

      samplesRef.current.push(currentAngle);

      // Conteo simple de repeticiones por cambio de fase
      if (mode === 'squat') {
        if (currentAngle < 100 && phaseRef.current === 'up') {
          phaseRef.current = 'down';
        } else if (currentAngle > 150 && phaseRef.current === 'down') {
          phaseRef.current = 'up';
          repCountRef.current += 1;
        }
      } else {
        if (currentAngle < 65 && phaseRef.current === 'up') {
          phaseRef.current = 'down';
        } else if (currentAngle > 145 && phaseRef.current === 'down') {
          phaseRef.current = 'up';
          repCountRef.current += 1;
        }
      }
    },
    [mode]
  );

  const handleReady = useCallback(() => {
    setModelLoading(false);
  }, []);

  const handleError = useCallback((message) => {
    setTrackingError(message || 'No se pudo iniciar la camara o el modelo');
    setModelLoading(false);
    setTrackingEnabled(false);
  }, []);

  const { videoRef, canvasRef } = usePoseTracking({
    enabled: trackingEnabled,
    onAngles: handleAngles,
    onReady: handleReady,
    onError: handleError,
  });

  const persistHistory = (next) => {
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveCurrentAnalysis = () => {
    const valid = samplesRef.current.filter((n) => Number.isFinite(n));
    if (!valid.length) return;

    const average = avg(valid);
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const goodFrames = valid.filter((a) => criteriaFor(mode, a).status === 'good').length;
    const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

    const item = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode,
      durationSec,
      reps: repCountRef.current,
      avgAngle: Math.round(average),
      minAngle: Math.round(min),
      maxAngle: Math.round(max),
      goodPercent: Math.round((goodFrames / valid.length) * 100),
      lastMessage: currentCriteria.message,
    };

    const next = [item, ...history].slice(0, 30);
    persistHistory(next);
  };

  const startTracking = () => {
    setTrackingError('');
    setModelLoading(true);
    setAngles(null);
    modelReadyRef.current = false;
    repCountRef.current = 0;
    phaseRef.current = 'up';
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    setTrackingEnabled(true);
  };

  const stopTracking = () => {
    setTrackingEnabled(false);
    setModelLoading(false);
    if (samplesRef.current.length > 0) {
      saveCurrentAnalysis();
    }
  };

  const clearHistory = () => {
    persistHistory([]);
  };

  return (
    <div className="technique-page">
      <div className="technique-card">
        <div className="technique-header">
          <h1>Correccion de tecnica</h1>
          <button className="technique-back-btn" onClick={() => navigate('/dashboard')}>
            Volver al dashboard
          </button>
        </div>

        <p className="technique-subtitle">
          Elige ejercicio y pulsa iniciar. Te damos feedback en tiempo real y guardamos el analisis
          dentro de esta pestana.
        </p>

        <div className="technique-controls">
          <label>
            Ejercicio a corregir
            <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={trackingEnabled}>
              <option value="squat">Sentadilla</option>
              <option value="curl">Curl de biceps</option>
            </select>
          </label>

          {!trackingEnabled ? (
            <button className="technique-toggle-btn" onClick={startTracking}>
              Iniciar correccion de tecnica
            </button>
          ) : (
            <button className="technique-stop-btn" onClick={stopTracking}>
              Detener y guardar analisis
            </button>
          )}
        </div>

        {trackingError && <p className="error-msg">{trackingError}</p>}

        {trackingEnabled ? (
          <>
            <PoseCamera videoRef={videoRef} canvasRef={canvasRef} loading={modelLoading} />

            <div className="angles-grid">
              <PoseFeedback label="Codo izq." joint="elbow" angle={angles?.leftElbow} />
              <PoseFeedback label="Codo der." joint="elbow" angle={angles?.rightElbow} />
              <PoseFeedback label="Rodilla izq." joint="knee" angle={angles?.leftKnee} />
              <PoseFeedback label="Rodilla der." joint="knee" angle={angles?.rightKnee} />
            </div>

            <div className="technique-live-panel">
              <div>
                <span className="k">Repeticiones detectadas</span>
                <strong>{repCountRef.current}</strong>
              </div>
              <div>
                <span className="k">Criterio actual</span>
                <strong>{currentCriteria.message}</strong>
              </div>
            </div>
          </>
        ) : (
          <div className="technique-empty">
            <p>Pulsa "Iniciar correccion de tecnica" para comenzar.</p>
          </div>
        )}

        <section className="technique-history">
          <div className="technique-history-head">
            <h2>Historial de correcciones</h2>
            {history.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>
                Limpiar historial
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="history-empty">Aun no hay analisis guardados.</p>
          ) : (
            <div className="history-list">
              {history.map((h) => (
                <article key={h.id} className="history-item">
                  <div className="history-top">
                    <strong>{h.mode === 'squat' ? 'Sentadilla' : 'Curl de biceps'}</strong>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="history-metrics">
                    <span>Duracion: {h.durationSec}s</span>
                    <span>Reps: {h.reps}</span>
                    <span>Angulo prom: {h.avgAngle}°</span>
                    <span>Min/Max: {h.minAngle}° / {h.maxAngle}°</span>
                    <span>Frames correctos: {h.goodPercent}%</span>
                  </div>
                  <p className="history-note">Ultimo feedback: {h.lastMessage}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
