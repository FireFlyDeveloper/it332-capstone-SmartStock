import pg from 'pg';
import { databaseUrl, hasDatabaseUrl } from './config.js';

const { Pool } = pg;

let pool: pg.Pool | null | undefined;

export function getPool(): pg.Pool | null {
  if (!hasDatabaseUrl) {
    return null;
  }

  pool ??= new Pool({ connectionString: databaseUrl });
  return pool;
}
