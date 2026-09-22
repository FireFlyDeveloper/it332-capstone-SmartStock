/**
 * AI config — DeepSeek environment configuration.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

export interface DeepSeekConfig {
  apiKey?: string;
  endpoint: string;
  model: string;
}

export function getDeepSeekConfig(env: NodeJS.ProcessEnv = process.env): DeepSeekConfig {
  return {
    apiKey: env.DEEPSEEK_API_KEY,
    endpoint: env.DEEPSEEK_API_ENDPOINT ?? 'https://api.deepseek.com/chat/completions',
    model: env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  };
}
