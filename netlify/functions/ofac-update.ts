import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { parseCSV, extractEntities, consolidateAltData, consolidateAddData, type OfacEntity } from "./ofac-parser";
import { preflight, err } from "./_cors";

type UpdateBody = {
  secret?: string;
  next_run?: string;
};

type DatasetDelta = {
  baseline: boolean;
  previousCount: number;
  currentCount: number;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
  addedUids: string[];
  removedUids: string[];
  changedUids: string[];
};

const OFAC_EXPORT_BASE =
  "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports";

function sha256(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function getEnv(name: string): string | undefined {
  const netlifyEnv = (globalThis as any).Netlify?.env;
  return netlifyEnv?.get?.(name) || process.env[name];
}

function bearerToken(req: Request): string | undefined {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isScheduledInvocation(context: Context, body: UpdateBody | null): boolean {
  const deploy = (context as any)?.deploy;
  return Boolean(body?.next_run && deploy?.context === "production" && deploy?.published === true);
}

async function parseUpdateBody(req: Request): Promise<UpdateBody | null> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return (await req.json()) as UpdateBody;
  } catch {
    return null;
  }
}

function checkUpdateAuth(req: Request, context: Context, body: UpdateBody | null): Response | null {
  if (isScheduledInvocation(context, body)) return null;

  const expectedSecret = getEnv("OFAC_UPDATE_SECRET");
  if (!expectedSecret) {
    return err(401, "Manual updates require OFAC_UPDATE_SECRET to be configured.");
  }

  const providedSecret =
    req.headers.get("x-update-secret") ||
    req.headers.get("x-api-key") ||
    bearerToken(req) ||
    body?.secret;

  if (providedSecret !== expectedSecret) return err(401, "Unauthorized");

  return null;
}

function entityFingerprint(entity: OfacEntity): string {
  return sha256(JSON.stringify(entity));
}

export function computeDelta(
  previousEntities: OfacEntity[] | null,
  currentEntities: OfacEntity[]
): DatasetDelta {
  const previousByUid = new Map((previousEntities || []).map((entity) => [entity.uid, entity]));
  const currentByUid = new Map(currentEntities.map((entity) => [entity.uid, entity]));

  const addedUids: string[] = [];
  const removedUids: string[] = [];
  const changedUids: string[] = [];
  let unchangedCount = 0;

  for (const [uid, entity] of currentByUid) {
    const previous = previousByUid.get(uid);
    if (!previous) {
      addedUids.push(uid);
      continue;
    }

    if (entityFingerprint(previous) === entityFingerprint(entity)) {
      unchangedCount++;
    } else {
      changedUids.push(uid);
    }
  }

  for (const uid of previousByUid.keys()) {
    if (!currentByUid.has(uid)) removedUids.push(uid);
  }

  return {
    baseline: !previousEntities,
    previousCount: previousEntities?.length || 0,
    currentCount: currentEntities.length,
    addedCount: addedUids.length,
    removedCount: removedUids.length,
    changedCount: changedUids.length,
    unchangedCount,
    addedUids: addedUids.slice(0, 100),
    removedUids: removedUids.slice(0, 100),
    changedUids: changedUids.slice(0, 100),
  };
}

async function loadPreviousEntities(store: ReturnType<typeof getStore>): Promise<OfacEntity[] | null> {
  const previousGz = await store.get("dataset.json.gz", { type: "arrayBuffer" });
  if (!previousGz) return null;

  const json = zlib.gunzipSync(Buffer.from(previousGz)).toString("utf8");
  return JSON.parse(json) as OfacEntity[];
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      // IMPORTANT: OFAC SLS can 403 without a UA
      "User-Agent": "sdn-openapi/1.0 (contact: rob@devs.miami)",
    },
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `OFAC fetch failed ${res.status} ${res.statusText} :: ${url}\n${body.slice(0, 500)}`
    );
  }
  return body;
}

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return preflight();

  const updateBody = await parseUpdateBody(req.clone());
  const authError = checkUpdateAuth(req, context, updateBody);
  if (authError) return authError;

  const requestUrl = new URL(req.url);
  const isDebug = requestUrl.searchParams.get("debug") === "1";

  if (req.method !== "POST" && !isDebug) {
    return err(405, "Method not allowed");
  }

  try {
    const store = getStore("ofac");
    const fetchedAt = new Date().toISOString();
    const previousEntities = await loadPreviousEntities(store);

    const sdnUrl = `${OFAC_EXPORT_BASE}/SDN.CSV`;
    const altUrl = `${OFAC_EXPORT_BASE}/ALT.CSV`;
    const addUrl = `${OFAC_EXPORT_BASE}/ADD.CSV`;

    console.log(`[ofac-update] Fetching SDN CSV from ${sdnUrl}`);
    const sdnCsv = await fetchText(sdnUrl);

    console.log(`[ofac-update] Fetching ALT CSV from ${altUrl}`);
    const altCsv = await fetchText(altUrl);

    console.log(`[ofac-update] Fetching ADD CSV from ${addUrl}`);
    const addCsv = await fetchText(addUrl);

    const sdnRows = await parseCSV(sdnCsv, ['ent_num', 'sdn_name', 'sdn_type', 'program', 'remarks']);
    const altRows = await parseCSV(altCsv, ['ent_num', 'alt_type', 'alt_num', 'alt_name', 'alt_remarks']);
    const addRows = await parseCSV(addCsv, ['ent_num', 'add_num', 'address', 'city', 'country', 'add_remarks']);

    // Debug mode: show real headers + sample row so we can confirm mapping
    if (isDebug) {
      return new Response(
        JSON.stringify(
          {
            ok: true,
            sdnHeaders: Object.keys(sdnRows[0] || {}),
            altHeaders: Object.keys(altRows[0] || {}),
            addHeaders: Object.keys(addRows[0] || {}),
            sdnSampleRow: sdnRows[0] || null,
            altSampleRow: altRows[0] || null,
            addSampleRow: addRows[0] || null,
            rowCounts: {
              sdn: sdnRows.length,
              alt: altRows.length,
              add: addRows.length,
            },
          },
          null,
          2
        ),
        { headers: { "content-type": "application/json; charset=utf-8" } }
      );
    }

    // Extract entities from SDN
    let entities = extractEntities(sdnRows);

    // Consolidate ALT data (alternate names)
    entities = consolidateAltData(entities, altRows);

    // Consolidate ADD data (addresses)
    entities = consolidateAddData(entities, addRows);

    const delta = computeDelta(previousEntities, entities);

    const payloadJson = JSON.stringify(entities);
    const payloadGz = zlib.gzipSync(Buffer.from(payloadJson, "utf8"));

    const meta = {
      lists: ["SDN", "ALT", "ADD"],
      source: {
        sdnUrl,
        altUrl,
        addUrl,
      },
      fetchedAt,
      counts: {
        sdnRows: sdnRows.length,
        altRows: altRows.length,
        addRows: addRows.length,
        entities: entities.length,
      },
      hashes: {
        sdnSha256: sha256(sdnCsv),
        altSha256: sha256(altCsv),
        addSha256: sha256(addCsv),
      },
      delta,
    };

    console.log(`[ofac-update] Storing ${entities.length} entities and metadata`);
    await store.set("dataset.json.gz", payloadGz, { metadata: { fetchedAt } });
    await store.setJSON("meta.json", meta, { metadata: { fetchedAt } });
    await store.setJSON("delta.json", { fetchedAt, ...delta }, { metadata: { fetchedAt } });

    console.log(`[ofac-update] Update completed successfully`);
    return new Response(JSON.stringify({ ok: true, meta }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("ofac-update failed:", err?.stack || err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err?.message || err),
      }),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
};

export const config: Config = {
  schedule: "0 */6 * * *",
};
