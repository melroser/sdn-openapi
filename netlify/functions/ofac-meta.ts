import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (_req: Request, _context: Context) => {
  const store = getStore("ofac");
  const meta = await store.get("meta.json");

  if (!meta) {
    return new Response(
      JSON.stringify({ ok: false, error: "No dataset yet. Wait for schedule or call /api/update." }),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  return new Response(meta, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // cache a little at the edge to reduce function hits
      "cache-control": "public, max-age=60"
    }
  });
};
