import '../styles/SchedulePicker.css';

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
];

export default function SchedulePicker({ days, time, onDaysChange, onTimeChange }) {
  const toggleDay = (val) => {
    onDaysChange(
      days.includes(val) ? days.filter((d) => d !== val) : [...days, val],
    );
  };

  return (
    <div className="schedule-picker">
      <div className="schedule-days">
        {DAYS.map((d) => (
          <button
            key={d.value}
            type="button"
            className={`schedule-day-btn ${days.includes(d.value) ? 'active' : ''}`}
            onClick={() => toggleDay(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="schedule-time-row">
        <label className="schedule-time-label">Hora</label>
        <input
          type="time"
          className="schedule-time-input"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
