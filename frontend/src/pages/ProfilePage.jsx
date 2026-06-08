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

  useEffect(() => {
    const loadMe = async () => {
      if (!me?.userId) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/users/${me.userId}`);
        setName(data.name || '');
        setAlias(data.alias || '');
        setProfileImageUrl(data.profileImageUrl || '');
        setEmail(data.email || '');
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
          <h2>Mi Perfil</h2>

          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Volver al dashboard
          </button>

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

              <label className="form-label">Foto de perfil (URL)</label>
              <input className="profile-input" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://..." />

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
