/**
 * DB Sync State Flag
 * Controls write-through synchronization between in-memory stores and PostgreSQL.
 */

let dbSyncActive = false;

export function isDbSyncActive(): boolean {
  return dbSyncActive && !process.env.VITEST;
}

export function setDbSyncActive(active: boolean): void {
  dbSyncActive = active;
}
