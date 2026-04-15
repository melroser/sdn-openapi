// netlify/functions/_cors.ts

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function ok(body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

export function err(statusCode: number, message: string, detail?: unknown): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message, ...(detail ? { detail } : {}) }),
    {
      status: statusCode,
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...CORS_HEADERS,
      },
    }
  );
}
