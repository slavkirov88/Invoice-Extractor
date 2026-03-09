/**
 * Wraps a Mistral API call with retry logic for 429 rate limit errors.
 * Retries up to 2 times with 2s and 4s delays.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.includes("rate_limited") || msg.includes("Rate limit");
      if (isRateLimit && attempt < retries) {
        const delay = (attempt + 1) * 2000; // 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  // Unreachable but satisfies TypeScript
  throw new Error("Max retries exceeded");
}
