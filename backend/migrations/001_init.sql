-- Achei Vaga — schema inicial
-- Requer a extensão PostGIS para consultas geoespaciais eficientes.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- parking_spots
-- Cada linha é uma vaga reportada como livre. `location` é o tipo
-- geography do PostGIS (bem mais simples de consultar por distância
-- em metros do que calcular haversine na aplicação).
-- ─────────────────────────────────────────────
CREATE TYPE spot_status AS ENUM ('available', 'taken', 'expired');

CREATE TABLE parking_spots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location          geography(Point, 4326) NOT NULL,
    lat               DOUBLE PRECISION NOT NULL,
    lng               DOUBLE PRECISION NOT NULL,
    status            spot_status NOT NULL DEFAULT 'available',
    confidence_score  INTEGER NOT NULL DEFAULT 1,
    reported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice espacial: essencial para "vagas num raio de X metros" ser rápido.
CREATE INDEX idx_parking_spots_location ON parking_spots USING GIST (location);
-- Índice para a query mais comum: vagas disponíveis e ainda não vencidas.
CREATE INDEX idx_parking_spots_status_expires ON parking_spots (status, expires_at);

-- ─────────────────────────────────────────────
-- spot_confirmations
-- Histórico de "ainda tá livre" / "já foi" reportado por outros usuários.
-- Usado para ajustar confidence_score e o expires_at da vaga.
-- ─────────────────────────────────────────────
CREATE TYPE confirmation_type AS ENUM ('confirm', 'taken');

CREATE TABLE spot_confirmations (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id    UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       confirmation_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- um usuário só pode confirmar a mesma vaga uma vez (pode repetir a ação,
    -- mas isso é tratado como update em application-level, não aqui)
    UNIQUE (spot_id, user_id)
);

CREATE INDEX idx_spot_confirmations_spot ON spot_confirmations (spot_id);
