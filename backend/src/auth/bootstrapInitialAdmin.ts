import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

export interface InitialAdminInput {
  email: string;
  name: string;
  passwordHash: string;
}

export type InitialAdminResult =
  | { created: true; id: string }
  | { created: false };

/** Create an initial administrator once; this is an offline/operator-only path. */
export async function bootstrapInitialAdmin(
  pool: Pick<Pool, 'connect'>,
  input: InitialAdminInput,
): Promise<InitialAdminResult> {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;

    // Serialize concurrent bootstrap attempts, including when users has no rows.
    await client.query('SELECT pg_advisory_xact_lock(1414286605, 1)');
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM users
       WHERE role = 'admin' AND is_active = TRUE AND deleted_at IS NULL
       LIMIT 1`,
    );

    if (rows.length > 0) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return { created: false };
    }

    const id = randomUUID();
    const username = `bootstrap-${id.slice(0, 12)}`;
    await client.query(
      `INSERT INTO users (id, username, email, full_name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')`,
      [id, username, input.email.trim().toLowerCase(), input.name.trim(), input.passwordHash],
    );
    await client.query('COMMIT');
    transactionOpen = false;
    return { created: true, id };
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Keep the original failure; the transaction connection is released below.
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
