import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { parseCSV, extractEntities, consolidateAltData, consolidateAddData } from "./ofac-parser";

const OFAC_EXPORT_BASE =
  "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports";

function sha256(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
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

export default async (req: Request, _context: Context) => {
  try {
    const store = getStore("ofac");
    const fetchedAt = new Date().toISOString();

    const sdnUrl = `${OFAC_EXPORT_BASE}/SDN.CSV`;
    const altUrl = `${OFAC_EXPORT_BASE}/ALT.CSV`;
    const addUrl = `${OFAC_EXPORT_BASE}/ADD.CSV`;

    console.log(`[ofac-update] Fetching SDN CSV from ${sdnUrl}`);
    const sdnCsv = await fetchText(sdnUrl);

    console.log(`[ofac-update] Fetching ALT CSV from ${altUrl}`);
    const altCsv = await fetchText(altUrl);

    console.log(`[ofac-update] Fetching ADD CSV from ${addUrl}`);
    const addCsv = await fetchText(addUrl);

    const sdnRows = await parseCSV(sdnCsv);
    const altRows = await parseCSV(altCsv);
    const addRows = await parseCSV(addCsv);

    // Debug mode: show real headers + sample row so we can confirm mapping
    const url = new URL(req.url);
    if (url.searchParams.get("debug") === "1") {
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
    };

    console.log(`[ofac-update] Storing ${entities.length} entities and metadata`);
    await store.set("dataset.json.gz", payloadGz, { metadata: { fetchedAt } });
    await store.setJSON("meta.json", meta, { metadata: { fetchedAt } });

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

