import { app } from './app';
import { env } from './config/env';
import { pool } from './config/db';
import { expireOverdueSpots } from './services/spots.service';

const server = app.listen(env.port, () => {
  console.log(`Achei Vaga API rodando na porta ${env.port} (${env.nodeEnv})`);
});

// Job simples de expiração: roda a cada minuto, marca vagas vencidas.
// Em produção com múltiplas instâncias, mover para um worker dedicado
// (ex: BullMQ) evita que todas as instâncias rodem o mesmo UPDATE.
const expirationInterval = setInterval(async () => {
  try {
    const count = await expireOverdueSpots();
    if (count > 0) console.log(`${count} vaga(s) expirada(s)`);
  } catch (err) {
    console.error('Erro ao expirar vagas:', err);
  }
}, 60_000);

function shutdown() {
  console.log('Encerrando servidor...');
  clearInterval(expirationInterval);
  server.close(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
