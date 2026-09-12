import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { spotsRouter } from './routes/spots.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/spots', spotsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
