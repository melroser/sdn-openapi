500)}`);
  }
    return body;
    }

    export default async (_req: Request, _context: Context) => {
          try {
                  // Make parse import happen inside try/catch so module issues show up
              //     const { parse } = await import("csv-parse/sync");
              //
              //         const store = getStore("ofac");
              //             const fetchedAt = new Date().toISOString();
              //
              //                 const sdnUrl = `${OFAC_EXPORT_BASE}/SDN.CSV`;
              //                     const sdnCsv = await fetchText(sdnUrl);
              //
              //                         const rows = parse(sdnCsv, {
              //                               columns: true,
              //                                     skip_empty_lines: true,
              //                                           bom: true,
              //                                                 relax_quotes: true,
              //                                                       relax_column_count: true,
              //                                                             trim: true,
              //                                                                 }) as Array<Record<string, string>>;
              //
              //                                                                     // Minimal SDN-only dataset
              //                                                                         const entities = rows
              //                                                                               .map((row) => {
              //                                                                                       const uid = row["ent_num"] || row["ENT_NUM"] || row[import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import zlib from "node:zlib";

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
    throw new Error(`OFAC fetch failed ${res.status} ${res.statusText} :: ${url}\n${body.slice(0, "uid"] || row["UID"];
        const name = row["sdn_name"] || row["SDN_NAME"] || row["name"] || row["NAME"];
        const type = row["sdn_type"] || row["SDN_TYPE"] || row["type"] || row["TYPE"];
        const program = row["program"] || row["PROGRAM"] || "";
        const remarks = row["remarks"] || row["REMARKS"] || "";

        if (!uid || !name) return null;

        return {
          uid: String(uid),
          name: String(name),
          type: type ? String(type) : undefined,
          programs: program
            ? String(program).split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
            : [],
          remarks: remarks ? String(remarks) : undefined,
          aka: [],
          addresses: [],
        };
      })
      .filter(Boolean);

    const payloadJson = JSON.stringify(entities);
    const payloadGz = zlib.gzipSync(Buffer.from(payloadJson, "utf8"));

    const meta = {
      list: "SDN",
      sourceUrl: sdnUrl,
      fetchedAt,
      contentSha256: sha256(sdnCsv),
      bytes: Buffer.byteLength(sdnCsv, "utf8"),
      counts: { rows: rows.length, entities: entities.length },
    };

    await store.set("dataset.json.gz", payloadGz, { metadata: { fetchedAt } });
    await store.setJSON("meta.json", meta, { metadata: { fetchedAt } });

    return new Response(JSON.stringify({ ok: true, meta }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("ofac-update failed:", err?.stack || err);

    // Return JSON so you see the actual reason, not Netlify’s generic 500
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

