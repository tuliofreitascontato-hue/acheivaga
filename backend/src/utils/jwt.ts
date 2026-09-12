import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload } from '../types';

export function signToken(payload: AuthTokenPayload): string {
  // Cast necessário: versões recentes de @types/jsonwebtoken exigem que
  // `expiresIn` seja um literal de template (ex: '7d'), não um `string`
  // genérico vindo de env.ts — sem o cast, o TS erra o overload e aponta
  // pro tipo errado (SignCallback), como no build que você viu.
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
