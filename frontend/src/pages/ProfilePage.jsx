import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Profile.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { me, deleteMyAccount } = useAuth();

  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stats, setStats] = useState({ points: 0, xp: 0, level: 1, achievementCount: 0 });

  useEffect(() => {
    const loadMe = async () => {
      if (!me?.userId) return;
      setLoading(true);
      setError('');
      try {
        const [userRes, achRes] = await Promise.all([
          api.get(`/users/${me.userId}`),
          api.get('/achievements'),
        ]);
        const data = userRes.data;
        setName(data.name || '');
        setAlias(data.alias || '');
        setProfileImageUrl(data.profileImageUrl || '');
        setEmail(data.email || '');
        setStats({
          points: data.points ?? 0,
          xp: data.xp ?? 0,
          level: data.level ?? 1,
          achievementCount: achRes.data.count ?? 0,
        });
      } catch (err) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [me?.userId]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');

    try {
      await api.patch(`/users/${me.userId}`, {
        name: name.trim(),
        alias: alias.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
      });
      setOk('Perfil actualizado');
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 200;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        setProfileImageUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    const result = await deleteMyAccount();
    if (!result.success) {
      setError(result.error || 'No se pudo eliminar la cuenta');
      setConfirmDelete(false);
    }
  };

  return (
    <div className="page-content">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h2>Mi Perfil</h2>
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              Volver al dashboard
            </button>
          </div>

          {!loading && (
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-val">Nivel {stats.level}</span>
                <span className="profile-stat-lbl">Nivel</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-val">{stats.xp} XP</span>
                <span className="profile-stat-lbl">Experiencia</span>
              </div>
              <div className="profile-stat profile-stat-link" onClick={() => navigate('/achievements')}>
                <span className="profile-stat-val">{stats.achievementCount}</span>
                <span className="profile-stat-lbl">Logros →</span>
              </div>
            </div>
          )}

          {loading ? (
            <p>Cargando perfil...</p>
          ) : (
            <form onSubmit={saveProfile}>
              <div className="profile-preview">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Perfil" className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">👤</div>
                )}
              </div>

              <label className="form-label">Nombre</label>
              <input className="profile-input" value={name} onChange={(e) => setName(e.target.value)} required />

              <label className="form-label">Alias</label>
              <input className="profile-input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Tu alias" />

              <label className="form-label">Foto de perfil</label>
              <div className="avatar-upload-row">
                <input
                  className="profile-input"
                  value={profileImageUrl.startsWith('data:') ? '(imagen subida desde dispositivo)' : profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://..."
                  readOnly={profileImageUrl.startsWith('data:')}
                />
                <label className="upload-file-btn">
                  Subir archivo
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={handleImageFile}
                  />
                </label>
              </div>

              <label className="form-label">Email</label>
              <input className="profile-input" value={email} disabled />

              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          )}

          {ok && <p className="ok-msg">{ok}</p>}
          {error && <p className="error-msg">{error}</p>}

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="delete-account-btn">
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="delete-confirm">
              <p className="delete-confirm-text">Esta accion es irreversible. ¿Seguro que quieres eliminar tu cuenta?</p>
              <div className="delete-confirm-actions">
                <button onClick={handleDelete} className="delete-account-btn">
                  Si, eliminar
                </button>
                <button onClick={() => setConfirmDelete(false)} className="cancel-btn">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
