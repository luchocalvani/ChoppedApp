import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ExerciseGif from '../components/ExerciseGif';
import '../styles/TrainWorkout.css';

const storageKey = (id) => `chp_wp_${id}`;

export default function TrainWorkoutPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workout, setWorkout] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [reward, setReward] = useState(null);

  // Tracks when entries are ready to be persisted (avoids saving before load)
  const readyToPersist = useRef(false);

  useEffect(() => {
    const loadWorkout = async () => {
      setLoading(true);
      setError('');
      readyToPersist.current = false;
      try {
        const { data } = await api.get(`/workouts/${id}`);
        setWorkout(data);

        const key = storageKey(id);
        const saved = localStorage.getItem(key);
        let initEntries;

        if (saved) {
          try {
            initEntries = JSON.parse(saved).entries;
          } catch {
            localStorage.removeItem(key);
            initEntries = null;
          }
        }

        if (!initEntries) {
          initEntries = (data.exercises || []).map((ex) => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            done: false,
            repsDone: 0,
            weightKg: 0,
            gifUrl: ex.gifUrl || '',
          }));
          localStorage.setItem(key, JSON.stringify({
            workoutId: id,
            workoutName: data.name,
            entries: initEntries,
            startedAt: new Date().toISOString(),
          }));
        }

        setEntries(initEntries);
        readyToPersist.current = true;
      } catch (err) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo cargar la rutina');
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [id]);

  // Persist entries to localStorage on every change
  useEffect(() => {
    if (!readyToPersist.current || entries.length === 0) return;
    const key = storageKey(id);
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      localStorage.setItem(key, JSON.stringify({ ...parsed, entries }));
    } catch { /* ignore */ }
  }, [entries, id]);

  const completedCount = useMemo(() => entries.filter((e) => e.done).length, [entries]);
  const allDone = entries.length > 0 && completedCount === entries.length;

  const toggleDone = (exerciseId) => {
    setEntries((prev) =>
      prev.map((e) => e.exerciseId === exerciseId ? { ...e, done: !e.done } : e),
    );
  };

  const updateEntry = (exerciseId, field, value) => {
    const numeric = Number(value);
    setEntries((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, [field]: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0 }
          : e,
      ),
    );
  };

  const abandon = () => {
    localStorage.removeItem(storageKey(id));
    navigate('/workouts');
  };

  const finishTraining = async () => {
    if (!allDone) {
      setError('Debes marcar todos los ejercicios para terminar el entrenamiento');
      return;
    }

    setFinishing(true);
    setError('');
    try {
      const { data } = await api.post('/training-sessions/complete', {
        workoutId: id,
        entries: entries.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          done: e.done,
          repsDone: e.repsDone,
          weightKg: e.weightKg,
        })),
      });

      localStorage.removeItem(storageKey(id));
      setReward({ pointsEarned: data.pointsEarned, newAchievements: data.newAchievements || [] });
      setTimeout(() => navigate('/training-history'), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar el entrenamiento');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <div className="train-container"><p>Cargando...</p></div>;

  return (
    <div className="train-container">
      <div className="train-card">
        <div className="train-top">
          <h1>Entrenar: {workout?.name || 'Rutina'}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ghost-btn" onClick={() => navigate('/workouts')}>Volver</button>
            <button className="abandon-btn" onClick={abandon}>Abandonar</button>
          </div>
        </div>

        <p className="progress-text">
          Completado: {completedCount}/{entries.length}
        </p>

        <div className="train-list">
          {entries.map((e) => (
            <div key={e.exerciseId} className={`train-item ${e.done ? 'done' : ''}`}>
              <label className="check-col">
                <input
                  type="checkbox"
                  checked={e.done}
                  onChange={() => toggleDone(e.exerciseId)}
                />
                <span>{e.name}</span>
              </label>

              <ExerciseGif exercise={e} alt={e.name} className="train-gif" />

              <div className="marks-col">
                <label>
                  Reps hechas
                  <input
                    type="number"
                    min="0"
                    value={e.repsDone}
                    onChange={(ev) => updateEntry(e.exerciseId, 'repsDone', ev.target.value)}
                  />
                </label>
                <label>
                  Peso (kg)
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={e.weightKg}
                    onChange={(ev) => updateEntry(e.exerciseId, 'weightKg', ev.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="error-msg">{error}</p>}

        {reward && (
          <div className="train-reward">
            <span className="train-reward-pts">+{reward.pointsEarned} pts</span>
            {reward.newAchievements.length > 0 && (
              <div className="train-reward-ach">
                {reward.newAchievements.map((a) => (
                  <span key={a}>🏅 {a}</span>
                ))}
              </div>
            )}
            <p>Redirigiendo al historial...</p>
          </div>
        )}

        <button
          className="finish-btn"
          disabled={!allDone || finishing || !!reward}
          onClick={finishTraining}
        >
          {finishing ? 'Guardando...' : 'Terminar entrenamiento'}
        </button>
      </div>
    </div>
  );
}
