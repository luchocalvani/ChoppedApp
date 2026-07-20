import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WorkoutCalendar.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

// Monday-first index (0=Mon..6=Sun) from a JS Date (0=Sun..6=Sat)
const mondayFirstIndex = (jsDay) => (jsDay === 0 ? 6 : jsDay - 1);

export default function WorkoutCalendar({ workouts }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const scheduled = useMemo(
    () => (workouts || []).filter((w) => (w.scheduleDays || []).length > 0),
    [workouts],
  );

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = mondayFirstIndex(firstOfMonth.getDay());

    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const workoutsForDate = (date) => {
    if (!date) return [];
    const weekday = date.getDay(); // 0=Sun..6=Sat, matches scheduleDays convention
    return scheduled.filter((w) => (w.scheduleDays || []).includes(weekday));
  };

  const isToday = (date) =>
    !!date &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const goPrevMonth = () => {
    setSelectedDay(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setSelectedDay(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };
  const goToday = () => {
    setSelectedDay(null);
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const selectedWorkouts = selectedDay ? workoutsForDate(selectedDay) : [];

  if (scheduled.length === 0) {
    return (
      <p className="no-workouts">
        No tenes rutinas programadas todavia. Al crear o editar una rutina, activa "Programar
        rutina" para verla aca.
      </p>
    );
  }

  return (
    <div className="calendar-wrap">
      <div className="calendar-nav">
        <button type="button" className="ghost-btn" onClick={goPrevMonth}>‹</button>
        <span className="calendar-month-label">
          {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button type="button" className="ghost-btn" onClick={goNextMonth}>›</button>
        <button type="button" className="switch-btn calendar-today-btn" onClick={goToday}>Hoy</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}

        {weeks.flatMap((row, ri) =>
          row.map((date, ci) => {
            const dayWorkouts = workoutsForDate(date);
            const key = `${ri}-${ci}`;
            if (!date) return <div key={key} className="calendar-cell empty" />;
            return (
              <button
                type="button"
                key={key}
                className={`calendar-cell ${isToday(date) ? 'today' : ''} ${dayWorkouts.length ? 'has-workouts' : ''}`}
                onClick={() => dayWorkouts.length && setSelectedDay(date)}
                disabled={dayWorkouts.length === 0}
              >
                <span className="calendar-day-num">{date.getDate()}</span>
                {dayWorkouts.length > 0 && (
                  <span className="calendar-dots">
                    {dayWorkouts.slice(0, 3).map((w) => (
                      <span key={w.id} className="calendar-dot" title={w.name} />
                    ))}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>

      {selectedDay && (
        <div className="calendar-day-panel">
          <div className="calendar-day-panel-header">
            <h3>
              {selectedDay.getDate()} de {MONTH_NAMES[selectedDay.getMonth()]}
            </h3>
            <button type="button" className="ghost-btn" onClick={() => setSelectedDay(null)}>Cerrar</button>
          </div>
          <div className="calendar-day-panel-list">
            {selectedWorkouts.map((w) => (
              <div key={w.id} className="calendar-day-item">
                <div>
                  <strong>{w.name}</strong>
                  <span className="calendar-day-item-time">{w.scheduleTime} hs</span>
                </div>
                <button type="button" className="train-btn" onClick={() => navigate(`/workouts/${w.id}/train`)}>
                  Entrenar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
