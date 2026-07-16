import { getPool } from './client.js';

export type DatabaseHealth = {
  mode: 'postgres' | 'memory';
  ok: boolean;
};

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const pool = getPool();

  if (!pool) {
    return { mode: 'memory', ok: true };
  }

  try {
    await pool.query('SELECT 1');
    return { mode: 'postgres', ok: true };
  } catch {
    return { mode: 'postgres', ok: false };
  }
}
