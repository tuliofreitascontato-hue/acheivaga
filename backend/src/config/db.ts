import { Pool } from 'pg';
import { env } from './env';

// Pool único compartilhado pela aplicação. Em produção, ajuste `max`
// conforme o plano do banco (ex: 10-20 conexões por instância da API).
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // erro em cliente ocioso do pool — logar e deixar o processo continuar,
  // o pool descarta a conexão ruim sozinho.
  console.error('Erro inesperado no pool do Postgres:', err);
});
