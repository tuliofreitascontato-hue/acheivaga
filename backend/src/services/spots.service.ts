import { pool } from '../config/db';
import { env } from '../config/env';
import { ApiError } from '../middleware/error.middleware';
import { ConfirmationType, ParkingSpot } from '../types';

// Confirmações de "ainda tá livre" somam confiança e renovam o TTL da vaga;
// reports de "já foi" derrubam a confiança. Abaixo de zero, a vaga é
// marcada como tomada automaticamente — sem precisar de um job separado
// rodando o tempo todo (o job de expiração cuida do TTL vencido).
const CONFIDENCE_DELTA: Record<ConfirmationType, number> = {
  confirm: 1,
  taken: -2,
};

export async function reportSpot(reporterId: string, lat: number, lng: number): Promise<ParkingSpot> {
  const result = await pool.query<ParkingSpot>(
    `INSERT INTO parking_spots (reporter_id, location, lat, lng, expires_at)
     VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $2, $3,
             now() + ($4 || ' minutes')::interval)
     RETURNING id, reporter_id, lat, lng, status, confidence_score, reported_at, expires_at, updated_at`,
    [reporterId, lng, lat, env.spotTtlMinutes]
  );
  return result.rows[0];
}

export async function findNearbySpots(lat: number, lng: number, radiusM: number): Promise<ParkingSpot[]> {
  const result = await pool.query<ParkingSpot>(
    `SELECT id, reporter_id, lat, lng, status, confidence_score, reported_at, expires_at, updated_at,
            ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography) AS distance_m
     FROM parking_spots
     WHERE status = 'available'
       AND expires_at > now()
       AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $1)
     ORDER BY distance_m ASC
     LIMIT 100`,
    [radiusM, lng, lat]
  );
  return result.rows;
}

export async function getSpotById(id: string): Promise<ParkingSpot> {
  const result = await pool.query<ParkingSpot>(
    `SELECT id, reporter_id, lat, lng, status, confidence_score, reported_at, expires_at, updated_at
     FROM parking_spots WHERE id = $1`,
    [id]
  );
  const spot = result.rows[0];
  if (!spot) {
    throw new ApiError(404, 'vaga não encontrada');
  }
  return spot;
}

export async function confirmSpot(spotId: string, userId: string, type: ConfirmationType): Promise<ParkingSpot> {
  const spot = await getSpotById(spotId);
  if (spot.status !== 'available') {
    throw new ApiError(409, 'essa vaga não está mais disponível');
  }

  // upsert: se o usuário já confirmou essa vaga antes, atualiza o voto dele
  // em vez de duplicar (evita que a mesma pessoa infle a confiança sozinha).
  await pool.query(
    `INSERT INTO spot_confirmations (spot_id, user_id, type)
     VALUES ($1, $2, $3)
     ON CONFLICT (spot_id, user_id) DO UPDATE SET type = EXCLUDED.type, created_at = now()`,
    [spotId, userId, type]
  );

  const delta = CONFIDENCE_DELTA[type];
  const renewsTtl = type === 'confirm';

  const result = await pool.query<ParkingSpot>(
    `UPDATE parking_spots
     SET confidence_score = confidence_score + $2,
         status = CASE WHEN confidence_score + $2 <= 0 THEN 'taken'::spot_status ELSE status END,
         expires_at = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE expires_at END,
         updated_at = now()
     WHERE id = $1
     RETURNING id, reporter_id, lat, lng, status, confidence_score, reported_at, expires_at, updated_at`,
    [spotId, delta, renewsTtl, env.spotTtlMinutes]
  );

  return result.rows[0];
}

export async function cancelSpot(spotId: string, userId: string): Promise<void> {
  const result = await pool.query(
    `UPDATE parking_spots SET status = 'taken', updated_at = now()
     WHERE id = $1 AND reporter_id = $2 AND status = 'available'`,
    [spotId, userId]
  );
  if (result.rowCount === 0) {
    throw new ApiError(404, 'vaga não encontrada ou você não é quem reportou');
  }
}

// Chamado periodicamente (ver server.ts) para varrer vagas vencidas.
// Mantém a query de busca (`findNearbySpots`) simples e rápida, já que ela
// só precisa checar `expires_at > now()` como cinto de segurança.
export async function expireOverdueSpots(): Promise<number> {
  const result = await pool.query(
    `UPDATE parking_spots SET status = 'expired', updated_at = now()
     WHERE status = 'available' AND expires_at <= now()`
  );
  return result.rowCount ?? 0;
}
