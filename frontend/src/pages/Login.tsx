import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiClientError } from '../api/client';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginTop: 48 }}>Achei Vaga</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: -8 }}>Entre para ver vagas perto de você</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--available)',
            color: '#0B1210',
            fontWeight: 700,
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        Não tem conta? <Link to="/registro" style={{ color: 'var(--available)' }}>Criar conta</Link>
      </p>
    </div>
  );
}
