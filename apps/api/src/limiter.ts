import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitResult = { allowed: boolean; retryAfterSec: number };

export interface RateLimiter {
  check(key: string): Promise<LimitResult>;
}

/**
 * Fixed-window counter in process memory. Correct for tests and local use, but each serverless
 * instance has its own memory, so production must use UpstashRateLimiter instead.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  async check(key: string): Promise<LimitResult> {
    const t = this.now();
    let w = this.windows.get(key);
    if (!w || t - w.start >= this.windowMs) {
      w = { start: t, count: 0 };
      this.windows.set(key, w);
      if (this.windows.size > 10_000) this.sweep(t);
    }
    if (w.count >= this.limit) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((w.start + this.windowMs - t) / 1000)) };
    }
    w.count++;
    return { allowed: true, retryAfterSec: 0 };
  }

  private sweep(t: number) {
    for (const [k, w] of this.windows) if (t - w.start >= this.windowMs) this.windows.delete(k);
  }
}

/** Sliding-window limit shared across all serverless instances through Upstash Redis. */
export class UpstashRateLimiter implements RateLimiter {
  private readonly rl: Ratelimit;

  constructor(redis: Redis, limit: number, windowSec: number, prefix: string) {
    this.rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix,
      analytics: false,
    });
  }

  async check(key: string): Promise<LimitResult> {
    const { success, reset } = await this.rl.limit(key);
    return { allowed: success, retryAfterSec: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  }
}
