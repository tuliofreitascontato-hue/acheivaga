import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'dados inválidos', details: err.flatten().fieldErrors });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error('Erro não tratado:', err);
  return res.status(500).json({ error: 'erro interno do servidor' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `rota não encontrada: ${req.method} ${req.path}` });
}
