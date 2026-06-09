import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ExerciseGif from '../components/ExerciseGif';
import SchedulePicker from '../components/SchedulePicker';
import '../styles/CreateWorkout.css';

export default function EditWorkoutPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workoutName, setWorkoutName] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('08:00');

  useEffect(() => {
    const loadWorkout = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/workouts/${id}`);
        setWorkoutName(data.name || '');
        setSelectedExercises(Array.isArray(data.exercises) ? data.exercises : []);
        if (data.scheduleDays?.length > 0) {
          setShowSchedule(true);
          setScheduleDays(data.scheduleDays);
          setScheduleTime(data.scheduleTime || '08:00');
        }
      } catch (err) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo cargar la rutina');
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [id]);

  const searchExercises = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const { data } = await api.get('/exercises/search', {
        params: { q: search.trim(), limit: 5 },
      });
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al buscar ejercicios');
    } finally {
      setSearching(false);
    }
  };

  const addExercise = (exercise) => {
    const exists = selectedExercises.some((e) => e.exerciseId === exercise.exerciseId);
    if (exists) return;

    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        bodyPart: exercise.bodyPart || '',
        equipment: exercise.equipment || '',
        target: exercise.target || '',
        gifUrl: exercise.gifUrl || '',
      },
    ]);
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const saveWorkout = async (e) => {
    e.preventDefault();

    if (!workoutName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!selectedExercises.length) {
      setError('Agrega al menos un ejercicio');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const cleanExercises = selectedExercises.map(
        ({ exerciseId, name, bodyPart, equipment, target, gifUrl }) => ({
          exerciseId,
          name,
          bodyPart: bodyPart || '',
          equipment: equipment || '',
          target: target || '',
          gifUrl: gifUrl || '',
        }),
      );

      await api.patch(`/workouts/${id}`, {
        name: workoutName.trim(),
        exercises: cleanExercises,
        scheduleDays: showSchedule && scheduleDays.length > 0 ? scheduleDays : [],
        scheduleTime: showSchedule && scheduleDays.length > 0 ? scheduleTime : null,
      });

      navigate('/workouts');
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar la rutina');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="create-workout-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="create-workout-container">
        <div className="create-workout-card">
          <h2>Editar Rutina</h2>

          <form className="create-workout-form" onSubmit={saveWorkout}>
            <div className="form-group">
              <label>Nombre de la rutina *</label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="search-box">
              <h3>Agregar ejercicios</h3>
              <div className="search-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  placeholder="pecho, espalda..."
                />
                <button type="button" className="secondary-btn" onClick={searchExercises} disabled={searching}>
                  {searching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map((ex) => (
                    <div key={ex.exerciseId} className="result-item">
                      <div className="result-info">
                        <strong>{ex.name}</strong>
                        <p>{ex.bodyPart} | {ex.target} | {ex.equipment}</p>
                      </div>

                      <ExerciseGif exercise={ex} alt={ex.name} className="result-gif" />

                      <button type="button" className="add-btn" onClick={() => addExercise(ex)}>
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-section">
              <h3>Ejercicios en la rutina</h3>
              <div className="selected-table-wrap">
                <table className="exercise-table">
                  <thead>
                    <tr>
                      <th>Ejercicio</th>
                      <th>Musculo</th>
                      <th>GIF</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedExercises.map((ex) => (
                      <tr key={ex.exerciseId}>
                        <td>{ex.name}</td>
                        <td>{ex.bodyPart || '-'}</td>
                        <td>
                          <ExerciseGif exercise={ex} alt={ex.name} className="table-gif" />
                        </td>
                        <td>
                          <button type="button" className="danger-btn" onClick={() => removeExercise(ex.exerciseId)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!selectedExercises.length && (
                      <tr>
                        <td colSpan={4}>No hay ejercicios</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="schedule-section">
              <button
                type="button"
                className={`schedule-toggle-btn ${showSchedule ? 'active' : ''}`}
                onClick={() => setShowSchedule((v) => !v)}
              >
                {showSchedule ? 'Quitar programacion' : 'Programar rutina'}
              </button>
              {showSchedule && (
                <div className="schedule-box">
                  <p className="schedule-hint">
                    Selecciona los dias y la hora. Recibirás un email recordatorio 30 minutos antes.
                  </p>
                  <SchedulePicker
                    days={scheduleDays}
                    time={scheduleTime}
                    onDaysChange={setScheduleDays}
                    onTimeChange={setScheduleTime}
                  />
                </div>
              )}
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/workouts')}>
                Cancelar
              </button>
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
