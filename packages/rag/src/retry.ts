export type RetryOptions = {
  retries?: number;
  baseMs?: number;
  /** Return true for errors worth retrying, such as rate limits and server errors. */
  isRetryable?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Retries a failing async call with exponential backoff: baseMs, 2x, 4x, and so on. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 4, baseMs = 500, isRetryable = () => true, sleep = defaultSleep } = options;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) throw error;
      await sleep(baseMs * 2 ** attempt);
      attempt++;
    }
  }
}

/** True for HTTP 429 and 5xx style errors that expose a numeric `status`. */
export function isTransientHttpError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && (status === 429 || status >= 500);
}
