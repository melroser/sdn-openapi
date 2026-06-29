import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import zlib from "node:zlib";
import { preflight, ok, err } from "./_cors";

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

function uidFromRequest(req: Request, context: Context): string | undefined {
  const uidFromParams = context.params?.uid?.trim();
  if (uidFromParams) return uidFromParams;

  const url = new URL(req.url);
  const uidFromQuery = url.searchParams.get("uid")?.trim();
  if (uidFromQuery) return uidFromQuery;

  const path = url.pathname.replace(/\/+$/, "");
  const markers = ["/api/entity/", "/.netlify/functions/ofac-entity/"];

  for (const marker of markers) {
    const markerIndex = path.indexOf(marker);
    if (markerIndex === -1) continue;

    const uid = path.slice(markerIndex + marker.length).split("/")[0]?.trim();
    if (uid) return decodeURIComponent(uid);
  }

  return undefined;
}

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
  if (_req.method === "OPTIONS") return preflight();

  const uid = uidFromRequest(_req, context);
  if (!uid) return err(400, "Missing :uid");

  try {
    const byId = await loadById();
    const entity = byId.get(uid);

    if (!entity) return err(404, "Not found", { uid });

    return ok({ ok: true, entity }, { "cache-control": "public, max-age=300" });
  } catch (e: any) {
    return err(500, e?.message ?? "Internal error");
  }
};
