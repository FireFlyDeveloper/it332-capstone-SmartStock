export const databaseUrl = process.env.DATABASE_URL?.trim() || '';

export const hasDatabaseUrl = databaseUrl.length > 0;

export const useInMemoryFallback = !hasDatabaseUrl;
