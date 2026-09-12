import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { cancel, confirm, create, getNearby, getOne } from '../controllers/spots.controller';

export const spotsRouter = Router();

spotsRouter.use(requireAuth);

spotsRouter.get('/nearby', getNearby);
spotsRouter.post('/', create);
spotsRouter.get('/:id', getOne);
spotsRouter.post('/:id/confirm', confirm);
spotsRouter.delete('/:id', cancel);
