type RetryAfterDto = Readonly<{
  retryAfterSeconds?: number;
}>;

function headerSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  const secondsUntilDate = Math.ceil((date - Date.now()) / 1_000);
  return secondsUntilDate > 0 ? secondsUntilDate : undefined;
}

export async function retryAfterSeconds(response: Response, fallback: number): Promise<number> {
  let bodySeconds = Number.NaN;
  try {
    bodySeconds = Number(((await response.json()) as RetryAfterDto).retryAfterSeconds);
  } catch {
    // The Retry-After header remains the fallback for a malformed response body.
  }
  const selected = Number.isFinite(bodySeconds)
    ? bodySeconds
    : (headerSeconds(response.headers.get("Retry-After")) ?? fallback);
  return Math.max(1, selected);
}
