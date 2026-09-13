import { delay } from '#/shared/utils/delay.js';

export const isRetryableGeminiError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('429') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('timeout')
  );
};

export const waitBeforeGeminiRetry = async (attempt: number): Promise<void> => {
  await delay(1000 * 2 ** (attempt - 1));
};