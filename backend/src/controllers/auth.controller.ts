import { Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema } from '../utils/validate';
import { getUserById, loginUser, registerUser } from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const { user, token } = await registerUser(email, password, name);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.sub);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
