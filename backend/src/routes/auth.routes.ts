import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

// Login/registro são os alvos óbvios de força bruta e criação em massa de
// contas — 20 tentativas a cada 15 min por IP é folgado para uso legítimo
// e incômodo o bastante para um ataque automatizado.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'muitas tentativas, aguarde alguns minutos' },
});

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.get('/me', requireAuth, me);
