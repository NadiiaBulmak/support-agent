import { ExternalErrorCategoryEnum } from '#/shared/enums/externalError.enums.js';

export const getExternalErrorCategory = (
  error: unknown,
): ExternalErrorCategoryEnum => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return ExternalErrorCategoryEnum.TIMEOUT;
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return ExternalErrorCategoryEnum.RATE_LIMIT;
  }

  if (
    message.includes('unavailable') ||
    message.includes('connection') ||
    message.includes('network')
  ) {
    return ExternalErrorCategoryEnum.UNAVAILABLE;
  }

  if (message.includes('invalid vector')) {
    return ExternalErrorCategoryEnum.INVALID_VECTOR;
  }

  if (message.includes('invalid response') || message.includes('empty response')) {
    return ExternalErrorCategoryEnum.INVALID_RESPONSE;
  }

  if (
    message.includes('database') ||
    message.includes('prisma') ||
    message.includes('query')
  ) {
    return ExternalErrorCategoryEnum.DATABASE;
  }

  return ExternalErrorCategoryEnum.UNKNOWN;
};