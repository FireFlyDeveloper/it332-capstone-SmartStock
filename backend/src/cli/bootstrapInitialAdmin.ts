import '../config/env.js';
import { assertAuthConfig } from '../auth/config.js';
import { hashPassword } from '../auth/hash.js';
import { bootstrapInitialAdmin } from '../auth/bootstrapInitialAdmin.js';
import { getPool } from '../db/client.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() ?? '';
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '';

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
  throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address (max 160 characters).');
}
if (!name || name.length > 160) {
  throw new Error('BOOTSTRAP_ADMIN_NAME is required (max 160 characters).');
}
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be 12–72 UTF-8 bytes.');
}

assertAuthConfig();
const pool = getPool();
if (!pool) throw new Error('DATABASE_URL is required; no administrator was created.');

try {
  const passwordHash = await hashPassword(password);
  const result = await bootstrapInitialAdmin(pool, { email, name, passwordHash });
  console.log(result.created
    ? `Initial administrator created (id: ${result.id}).`
    : 'An active administrator already exists; no changes made.');
} catch {
  console.error('Initial administrator bootstrap failed; no success was reported. Check database connectivity and schema.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
