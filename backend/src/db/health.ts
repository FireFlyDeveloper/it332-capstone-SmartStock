import { getPool } from './client.js';

export type DatabaseHealth = {
  mode: 'postgres' | 'unavailable';
  ok: boolean;
};

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const pool = getPool();

  if (!pool) {
    return { mode: 'unavailable', ok: false };
  }

  try {
    await pool.query('SELECT 1');
    return { mode: 'postgres', ok: true };
  } catch {
    return { mode: 'postgres', ok: false };
  }
}
