import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    loginWithToken(token).then(({ success }) => {
      navigate(success ? '/dashboard' : '/login', { replace: true });
    });
  }, [loginWithToken, navigate]);

  return <div className="auth-container">Iniciando sesión...</div>;
}
