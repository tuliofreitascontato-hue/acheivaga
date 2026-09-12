import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiClientError } from '../api/client';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'não foi possível criar a conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginTop: 48 }}>Criar conta</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Senha (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
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
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        Já tem conta? <Link to="/entrar" style={{ color: 'var(--available)' }}>Entrar</Link>
      </p>
    </div>
  );
}
