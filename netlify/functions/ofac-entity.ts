import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
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

let cachedEntities: { loadedAt: number; byId: Map<string, OfacEntity> } | null = null;

async function loadById() {
  if (cachedEntities && Date.now() - cachedEntities.loadedAt < 10 * 60 * 1000) return cachedEntities.byId;

  const store = getStore("ofac");
  const gz = await store.get("dataset.json.gz", { type: "arrayBuffer" });
  if (!gz) throw new Error("No dataset yet.");

  const json = zlib.gunzipSync(Buffer.from(gz)).toString("utf8");
  const entities = JSON.parse(json) as OfacEntity[];

  const byId = new Map<string, OfacEntity>(entities.map(e => [e.uid, e]));
  cachedEntities = { loadedAt: Date.now(), byId };
  return byId;
}

export default async (_req: Request, context: Context) => {
  const uid = context.params?.uid;
  if (!uid) {
    return new Response(JSON.stringify({ ok: false, error: "Missing :uid" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const byId = await loadById();
  const entity = byId.get(uid);

  if (!entity) {
    return new Response(JSON.stringify({ ok: false, error: "Not found", uid }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  return new Response(JSON.stringify({ ok: true, entity }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
};
