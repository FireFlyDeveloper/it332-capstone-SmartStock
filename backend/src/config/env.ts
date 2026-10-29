import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const configuredPath = process.env.SMARTSTOCK_ENV_FILE;
const candidates = [
  configuredPath,
  path.resolve(moduleDir, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
].filter((candidate): candidate is string => Boolean(candidate));

const envFile = candidates.find((candidate) => existsSync(candidate));
if (envFile && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}
