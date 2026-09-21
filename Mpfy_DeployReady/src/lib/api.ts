/** Client-side fetch helper with friendly error messages. */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "content-type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "You're offline. Check your connection and try again.");
  }
  if (!res.ok) {
    let msg = "Something went wrong. Try again.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* keep default */
    }
    if (res.status === 429) msg = "Too many requests — please slow down for a moment.";
    if (res.status >= 500) msg = "Mpfy's service is temporarily unavailable. Try again shortly.";
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
