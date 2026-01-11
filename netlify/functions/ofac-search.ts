import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import Fuse from "fuse.js";
import zlib from "node:zlib";

type OfacEntity = {
  uid: string;
  name: string;
  type?: string;
  programs: string[];
  remarks?: string;
  aka: string[];
  addresses: Array<{ address?: string; city?: string; country?: string }>;
};

let cached: { loadedAt: number; entities: OfacEntity[]; fuse: Fuse<OfacEntity> } | null = null;

async function loadDataset(): Promise<{ entities: OfacEntity[]; fuse: Fuse<OfacEntity> }> {
  // 10 minutes in-memory cache per warm function instance.
  if (cached && Date.now() - cached.loadedAt < 10 * 60 * 1000) return cached;

  const store = getStore("ofac");
  const gz = await store.get("dataset.json.gz", { type: "arrayBuffer" });

  if (!gz) throw new Error("No dataset yet. Call /api/update or wait for schedule.");

  const json = zlib.gunzipSync(Buffer.from(gz)).toString("utf8");
  const entities = JSON.parse(json) as OfacEntity[];

  const fuse = new Fuse(entities, {
    includeScore: true,
    threshold: 0.35, // lower = stricter
    keys: [
      { name: "name", weight: 0.7 },
      { name: "aka", weight: 0.3 }
    ]
  });

  cached = { loadedAt: Date.now(), entities, fuse };
  return cached;
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 50);

  if (!q) {
    return new Response(JSON.stringify({ ok: false, error: "Missing ?q=" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const { fuse } = await loadDataset();

  const results = fuse.search(q, { limit }).map(r => ({
    score: r.score ?? null,
    uid: r.item.uid,
    name: r.item.name,
    type: r.item.type,
    programs: r.item.programs
  }));

  return new Response(JSON.stringify({ ok: true, q, count: results.length, results }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30"
    }
  });
};
