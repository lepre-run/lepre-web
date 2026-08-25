type RetryAfterDto = Readonly<{
  retryAfterSeconds?: number;
}>;

async function bodySeconds(response: Response): Promise<number | undefined> {
  try {
    const seconds = Number(((await response.json()) as RetryAfterDto).retryAfterSeconds);
    return Number.isFinite(seconds) ? seconds : undefined;
  } catch {
    return undefined;
  }
}

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
  const parsedBodySeconds = await bodySeconds(response);
  const selected =
    parsedBodySeconds !== undefined
      ? parsedBodySeconds
      : (headerSeconds(response.headers.get("Retry-After")) ?? fallback);
  return Math.max(1, selected);
}
