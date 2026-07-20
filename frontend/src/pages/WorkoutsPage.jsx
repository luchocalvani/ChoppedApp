import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PRESET_WORKOUTS from '../data/presetWorkouts';
import ExerciseGif from '../components/ExerciseGif';
import WorkoutCalendar from '../components/WorkoutCalendar';
import '../styles/Workouts.css';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const [myWorkouts, setMyWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingFromPresetId, setCreatingFromPresetId] = useState('');
  const [error, setError] = useState('');
  const [section, setSection] = useState('mine'); // mine | preset | calendar
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [inProgress, setInProgress] = useState([]);

  const loadWorkouts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/workouts');
      setMyWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al cargar rutinas');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id) => {
    try {
      await api.delete(`/workouts/${id}`);
      setMyWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al eliminar rutina');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const createFromPreset = async (preset) => {
    setCreatingFromPresetId(preset.id);
    setError('');
    try {
      const payload = {
        name: preset.name,
        exercises: (preset.exercises || []).map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          bodyPart: ex.bodyPart || '',
          equipment: ex.equipment || '',
          target: ex.target || '',
          gifUrl: ex.gifUrl || '',
        })),
      };

      const { data } = await api.post('/workouts', payload);
      setMyWorkouts((prev) => [data, ...prev]);
      navigate(`/workouts/${data.id}/edit`);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo crear la rutina desde plantilla');
    } finally {
      setCreatingFromPresetId('');
    }
  };

  const loadInProgress = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('chp_wp_'));
    const progress = keys.map((k) => {
      try { return JSON.parse(localStorage.getItem(k)); }
      catch { return null; }
    }).filter(Boolean);
    setInProgress(progress);
  };

  const abandonProgress = (workoutId) => {
    localStorage.removeItem(`chp_wp_${workoutId}`);
    setInProgress((prev) => prev.filter((p) => p.workoutId !== workoutId));
  };

  useEffect(() => {
    loadWorkouts();
    loadInProgress();
  }, []);

  const renderWorkoutCard = (workout, isPreset = false) => (
    <div key={workout.id} className={`workout-card ${isPreset ? 'workout-card-preset' : ''}`}>
      <h3 className="workout-title">
        {workout.name}
        {isPreset && <span className="preset-badge">Predeterminada</span>}
      </h3>
      {!isPreset && workout.scheduleDays?.length > 0 && (
        <p className="workout-schedule-info">
          {workout.scheduleDays
            .slice()
            .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
            .map((d) => DAY_NAMES[d])
            .join(', ')}{' '}
          · {workout.scheduleTime} hs
        </p>
      )}

      <table className="exercise-table">
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Musculo</th>
            <th>GIF</th>
          </tr>
        </thead>
        <tbody>
          {(workout.exercises || []).length > 0 ? (
            workout.exercises.map((ex, idx) => (
              <tr key={`${workout.id}-${ex.exerciseId || idx}`}>
                <td>{ex.name}</td>
                <td>{ex.bodyPart || '-'}</td>
                <td>
                  <ExerciseGif exercise={ex} alt={ex.name} className="table-gif" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>Sin ejercicios cargados</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="workout-actions">
        {isPreset ? (
          <button
            className="use-preset-btn"
            onClick={() => createFromPreset(workout)}
            disabled={creatingFromPresetId === workout.id}
          >
            {creatingFromPresetId === workout.id ? 'Creando...' : 'Usar rutina'}
          </button>
        ) : (
          <>
            <button onClick={() => navigate(`/workouts/${workout.id}/train`)} className="train-btn">
              Entrenar
            </button>
            <button onClick={() => navigate(`/workouts/${workout.id}/edit`)} className="edit-btn">
              Editar
            </button>
            {confirmDeleteId === workout.id ? (
              <span className="delete-confirm-inline">
                <span className="delete-confirm-text">Eliminar rutina?</span>
                <button onClick={() => deleteWorkout(workout.id)} className="delete-btn">Si</button>
                <button onClick={() => setConfirmDeleteId(null)} className="cancel-inline-btn">Cancelar</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDeleteId(workout.id)} className="delete-btn">
                Eliminar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="workouts-container">
        <div className="workouts-header">
          <h1>Entrenar</h1>
          <div className="workouts-header-actions">
            <button onClick={() => navigate('/dashboard')} className="ghost-btn">Volver</button>
            <button onClick={() => navigate('/workouts/crear')} className="create-btn">Crear nueva rutina</button>
          </div>
        </div>

        {inProgress.length > 0 && (
          <section className="workouts-section inprogress-section">
            <h2 className="section-title">Rutinas en curso</h2>
            <div className="workouts-grid">
              {inProgress.map((p) => {
                const done = (p.entries || []).filter((e) => e.done).length;
                const total = (p.entries || []).length;
                return (
                  <div key={p.workoutId} className="workout-card workout-card-inprogress">
                    <h3 className="workout-title">{p.workoutName}</h3>
                    <p className="inprogress-meta">
                      {done}/{total} ejercicios completados
                      {p.startedAt && (
                        <> · Iniciada el {new Date(p.startedAt).toLocaleDateString('es-AR')}</>
                      )}
                    </p>
                    <div className="workout-actions">
                      <button
                        className="train-btn"
                        onClick={() => navigate(`/workouts/${p.workoutId}/train`)}
                      >
                        Continuar
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => abandonProgress(p.workoutId)}
                      >
                        Abandonar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="workouts-switch">
          <button
            className={`switch-btn ${section === 'mine' ? 'active' : ''}`}
            onClick={() => setSection('mine')}
          >
            Mis rutinas
          </button>
          <button
            className={`switch-btn ${section === 'preset' ? 'active' : ''}`}
            onClick={() => setSection('preset')}
          >
            Rutinas predefinidas
          </button>
          <button
            className={`switch-btn ${section === 'calendar' ? 'active' : ''}`}
            onClick={() => setSection('calendar')}
          >
            Calendario
          </button>
        </div>

        {loading ? (
          <p className="loading">Cargando rutinas...</p>
        ) : (
          <>
            {section === 'mine' && (
              <section className="workouts-section">
                <h2 className="section-title">Mis rutinas</h2>
                {myWorkouts.length === 0 ? (
                  <p className="no-workouts">Todavia no creaste rutinas.</p>
                ) : (
                  <div className="workouts-grid">
                    {myWorkouts.map((w) => renderWorkoutCard(w, false))}
                  </div>
                )}
              </section>
            )}

            {section === 'preset' && (
              <section className="workouts-section">
                <h2 className="section-title">Rutinas predefinidas</h2>
                <p className="section-subtitle">
                  Plantillas base para empezar rapido. Al tocar "Usar rutina" se copia a tus rutinas.
                </p>
                <div className="workouts-grid">
                  {PRESET_WORKOUTS.map((w) => renderWorkoutCard(w, true))}
                </div>
              </section>
            )}

            {section === 'calendar' && (
              <section className="workouts-section">
                <h2 className="section-title">Calendario de rutinas</h2>
                <p className="section-subtitle">
                  Rutinas programadas segun los dias y horarios que configuraste.
                </p>
                <WorkoutCalendar workouts={myWorkouts} />
              </section>
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
