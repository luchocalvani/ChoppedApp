import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ExerciseGif from '../components/ExerciseGif';
import SchedulePicker from '../components/SchedulePicker';
import '../styles/CreateWorkout.css';

export default function CreateWorkoutPage() {
  const navigate = useNavigate();

  const [workoutName, setWorkoutName] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('08:00');

  const searchExercises = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError('');

    try {
      const { data } = await api.get('/exercises/search', {
        params: { q: search.trim(), limit: 20 },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!workoutName.trim()) {
      setError('El nombre de la rutina es obligatorio');
      return;
    }

    if (selectedExercises.length === 0) {
      setError('Agrega al menos un ejercicio');
      return;
    }

    setLoading(true);
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

      await api.post('/workouts', {
        name: workoutName.trim(),
        exercises: cleanExercises,
        ...(showSchedule && scheduleDays.length > 0
          ? { scheduleDays, scheduleTime }
          : {}),
      });

      navigate('/workouts');
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al crear rutina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="create-workout-container">
        <div className="create-workout-card">
          <h2>Crear Nueva Rutina</h2>

          <form className="create-workout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la rutina *</label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                required
                placeholder="Ej: Pecho y triceps"
                className="form-input"
              />
            </div>

            <div className="search-box">
              <h3>Buscar ejercicios por musculo o nombre</h3>
              <div className="muscle-hint">
                Ejemplos: pecho, espalda, piernas, hombros, biceps, triceps
              </div>

              <div className="search-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej: pecho"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={searchExercises}
                  className="secondary-btn"
                  disabled={searching}
                >
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

                      <button type="button" onClick={() => addExercise(ex)} className="add-btn">
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-section">
              <h3>Ejercicios de la rutina</h3>
              {selectedExercises.length === 0 ? (
                <p className="empty-text">No hay ejercicios agregados.</p>
              ) : (
                <div className="selected-table-wrap">
                  <table className="exercise-table">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Musculo</th>
                        <th>Equipo</th>
                        <th>GIF</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExercises.map((ex) => (
                        <tr key={ex.exerciseId}>
                          <td>{ex.name}</td>
                          <td>{ex.bodyPart || '-'}</td>
                          <td>{ex.equipment || '-'}</td>
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
                    </tbody>
                  </table>
                </div>
              )}
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
              <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">
                Volver
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Creando...' : 'Crear Rutina'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
