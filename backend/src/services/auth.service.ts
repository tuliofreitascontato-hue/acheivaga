import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { ApiError } from '../middleware/error.middleware';
import { signToken } from '../utils/jwt';
import { User } from '../types';

const SALT_ROUNDS = 10;

export async function registerUser(email: string, password: string, name: string) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount) {
    throw new ApiError(409, 'já existe uma conta com esse email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email, passwordHash, name]
  );

  const user = result.rows[0];
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query<User & { password_hash: string }>(
    'SELECT id, email, name, created_at, password_hash FROM users WHERE email = $1',
    [email]
  );
  const row = result.rows[0];
  if (!row) {
    throw new ApiError(401, 'email ou senha incorretos');
  }

  const passwordMatches = await bcrypt.compare(password, row.password_hash);
  if (!passwordMatches) {
    throw new ApiError(401, 'email ou senha incorretos');
  }

  const { password_hash, ...user } = row;
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}

export async function getUserById(id: string): Promise<User> {
  const result = await pool.query<User>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [id]
  );
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(404, 'usuário não encontrado');
  }
  return user;
}
