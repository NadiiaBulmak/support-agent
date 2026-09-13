export type ExternalErrorCategory =
  | 'timeout'
  | 'rate_limit'
  | 'unavailable'
  | 'invalid_response'
  | 'invalid_vector'
  | 'database'
  | 'unknown';

export const getExternalErrorCategory = (
  error: unknown,
): ExternalErrorCategory => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return 'rate_limit';
  }

  if (
    message.includes('unavailable') ||
    message.includes('connection') ||
    message.includes('network')
  ) {
    return 'unavailable';
  }

  if (message.includes('invalid vector')) {
    return 'invalid_vector';
  }

  if (message.includes('invalid response') || message.includes('empty response')) {
    return 'invalid_response';
  }

  if (
    message.includes('database') ||
    message.includes('prisma') ||
    message.includes('query')
  ) {
    return 'database';
  }

  return 'unknown';
};