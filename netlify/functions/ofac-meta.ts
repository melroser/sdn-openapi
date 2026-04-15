import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { preflight, ok, err } from "./_cors";

export default async (_req: Request, _context: Context) => {
  if (_req.method === "OPTIONS") return preflight();

  const store = getStore("ofac");
  const meta = await store.get("meta.json");

  if (!meta) return err(404, "No dataset yet. Wait for schedule or call /api/update.");

  // meta is already a JSON string — parse and re-wrap so ok() can stringify it
  return ok(JSON.parse(meta), { "cache-control": "public, max-age=60" });
};
