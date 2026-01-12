import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import zlib from "node:zlib";

const OFAC_EXPORT_BASE =
  "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports";

function sha256(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function normalizeHeader(header: string): string {
  // Make headers consistent across variations:
  // "Ent Num" -> "ent_num", "SDN Name" -> "sdn_name", etc.
  return header
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "") // strip BOM if it sneaks in
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, "_"); // whitespace -> underscores
}

function firstDefined(row: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return undefined;
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
    const { parse } = await import("csv-parse/sync");

    const store = getStore("ofac");
    const fetchedAt = new Date().toISOString();

    const sdnUrl = `${OFAC_EXPORT_BASE}/SDN.CSV`;
    const sdnCsv = await fetchText(sdnUrl);

    const rows = parse(sdnCsv, {
      columns: (h: string) => normalizeHeader(h),
      skip_empty_lines: true,
      bom: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }) as Array<Record<string, string>>;

    // Debug mode: show real headers + sample row so we can confirm mapping
    const url = new URL(req.url);
    if (url.searchParams.get("debug") === "1") {
      return new Response(
        JSON.stringify(
          {
            ok: true,
            normalizedHeaders: Object.keys(rows[0] || {}),
            sampleRow: rows[0] || null,
            rowCount: rows.length,
          },
          null,
          2
        ),
        { headers: { "content-type": "application/json; charset=utf-8" } }
      );
    }

    // SDN-only extraction.
    // Header names vary; use a small set of plausible keys.
    const UID_KEYS = ["ent_num", "entnum", "uid", "id"];
    const NAME_KEYS = ["sdn_name", "sdnname", "name", "full_name"];
    const TYPE_KEYS = ["sdn_type", "sdntype", "type"];
    const PROGRAM_KEYS = ["program", "programs", "sanctions_program"];
    const REMARKS_KEYS = ["remarks", "comment", "comments"];

    const entities = rows
      .map((row) => {
        const uid = firstDefined(row, UID_KEYS);
        const name = firstDefined(row, NAME_KEYS);
        if (!uid || !name) return null;

        const type = firstDefined(row, TYPE_KEYS);
        const programRaw = firstDefined(row, PROGRAM_KEYS) || "";
        const remarks = firstDefined(row, REMARKS_KEYS);

        return {
          uid: String(uid),
          name: String(name),
          type: type ? String(type) : undefined,
          programs: programRaw
            ? String(programRaw)
                .split(/[,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          remarks: remarks ? String(remarks) : undefined,
          // kept for future compatibility with your other endpoints
          aka: [] as string[],
          addresses: [] as Array<{ address?: string; city?: string; country?: string }>,
        };
      })
      .filter(Boolean) as Array<{
      uid: string;
      name: string;
      type?: string;
      programs: string[];
      remarks?: string;
      aka: string[];
      addresses: Array<{ address?: string; city?: string; country?: string }>;
    }>;

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

