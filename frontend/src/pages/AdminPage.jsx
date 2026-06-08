import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Admin.css';

export default function AdminPage() {
  const navigate = useNavigate();
  const { me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('No se pudieron cargar los usuarios'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError('No se pudo eliminar el usuario');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleToggleAdmin = async (user) => {
    try {
      const { data } = await api.patch(`/users/${user.id}`, { isAdmin: !user.isAdmin });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
    } catch {
      setError('No se pudo cambiar el rol');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-header">
          <h1>Panel de administracion</h1>
          <button className="admin-back-btn" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {loading ? (
          <p className="admin-muted">Cargando usuarios...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.id === me?.userId ? 'admin-row-self' : ''}>
                    <td>{user.name}</td>
                    <td className="admin-email">{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.isAdmin ? 'role-admin' : 'role-user'}`}>
                        {user.isAdmin ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td className="admin-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="admin-actions">
                      {user.id !== me?.userId && (
                        <>
                          <button
                            className="admin-role-btn"
                            onClick={() => handleToggleAdmin(user)}
                          >
                            {user.isAdmin ? 'Quitar admin' : 'Hacer admin'}
                          </button>

                          {confirmDeleteId === user.id ? (
                            <>
                              <button
                                className="admin-delete-confirm-btn"
                                onClick={() => handleDelete(user.id)}
                              >
                                Confirmar
                              </button>
                              <button
                                className="admin-cancel-btn"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              className="admin-delete-btn"
                              onClick={() => setConfirmDeleteId(user.id)}
                            >
                              Eliminar
                            </button>
                          )}
                        </>
                      )}
                      {user.id === me?.userId && (
                        <span className="admin-muted">Tu cuenta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
