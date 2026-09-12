// Runner de migrations simples e sem dependências externas.
// Uso: npm run migrate (lê DATABASE_URL do .env via tsx)
//
// Em Docker Compose local, as migrations já rodam sozinhas na primeira
// subida do container do Postgres (montadas em /docker-entrypoint-initdb.d).
// Este script existe para os outros dois casos reais de produção:
//   1. banco gerenciado já existente (RDS, Supabase, Neon...) — precisa
//      aplicar migrations manualmente ou via pipeline de deploy;
//   2. novas migrations adicionadas depois que o volume do Postgres já
//      existe (docker-entrypoint-initdb.d só roda no primeiro boot).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import 'dotenv/config';

// Projeto compila como CommonJS (ver tsconfig.json), então __dirname já
// existe nativamente — nada de import.meta.url (isso é coisa de ESM e
// quebra o build com "import.meta is only allowed when --module is es2020...").
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort(); // 001_, 002_... garante ordem de execução

    const { rows: applied } = await pool.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    const pending = files.filter((f) => !appliedSet.has(f));
    if (pending.length === 0) {
      console.log('Nenhuma migration pendente.');
      return;
    }

    for (const file of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`Aplicando ${file}...`);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ ${file} aplicada`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Falha ao aplicar ${file}: ${(err as Error).message}`);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
