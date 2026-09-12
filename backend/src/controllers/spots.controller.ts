import { Request, Response, NextFunction } from 'express';
import { confirmSpotSchema, nearbyQuerySchema, reportSpotSchema } from '../utils/validate';
import {
  cancelSpot,
  confirmSpot,
  findNearbySpots,
  getSpotById,
  reportSpot,
} from '../services/spots.service';

export async function getNearby(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius_m } = nearbyQuerySchema.parse(req.query);
    const spots = await findNearbySpots(lat, lng, radius_m);
    res.json({ spots });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = reportSpotSchema.parse(req.body);
    const spot = await reportSpot(req.user!.sub, lat, lng);
    res.status(201).json({ spot });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const spot = await getSpotById(req.params.id);
    res.json({ spot });
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = confirmSpotSchema.parse(req.body);
    const spot = await confirmSpot(req.params.id, req.user!.sub, type);
    res.json({ spot });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    await cancelSpot(req.params.id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
