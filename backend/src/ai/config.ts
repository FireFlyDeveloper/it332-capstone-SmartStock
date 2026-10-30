/**
 * AI config — Hermes API server environment configuration.
 *
 * The backend talks only to the dedicated, aggregate-only Hermes profile.
 */
export interface HermesConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export function getHermesConfig(env: NodeJS.ProcessEnv = process.env): HermesConfig {
  return {
    apiKey: env.HERMES_API_KEY,
    baseUrl: env.HERMES_API_BASE_URL,
    model: env.HERMES_MODEL ?? 'smartstockanalytics',
  };
}
