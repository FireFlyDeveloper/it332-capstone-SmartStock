import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is required to apply db/schema.sql.');
  process.exit(1);
}

const require = createRequire(resolve(process.cwd(), 'backend/package.json'));
const pg = require('pg');

const schemaPath = resolve(process.cwd(), 'db/schema.sql');
const schemaSql = await readFile(schemaPath, 'utf8');
const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(schemaSql);
  console.log('Applied db/schema.sql successfully.');
} catch (error) {
  console.error('Failed to apply db/schema.sql.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
