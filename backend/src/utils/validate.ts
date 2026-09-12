import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(8, 'a senha precisa ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'informe seu nome'),
});

export const loginSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(1, 'informe a senha'),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_m: z.coerce.number().min(50).max(5000).optional().default(500),
});

export const reportSpotSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const confirmSpotSchema = z.object({
  type: z.enum(['confirm', 'taken']),
});
