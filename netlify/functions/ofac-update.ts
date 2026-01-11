import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { parse } from "csv-parse/sync";
import crypto from "node:crypto";
import zlib from "node:zlib";

const OFAC_EXPORT_BASE =
  "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports";

const FILES = {
  SDN: "SDN.CSV",
  ALT: "ALT.CSV", // optional but very useful
  ADD: "ADD.CSV"  // optional but very useful
} as const;

function sha256(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      // OFAC SLS export host may 403 without a User-Agent header
      // per OFAC technical notice.
      "User-Agent": "ofac-netlify-api/1.0 (contact: you@example.com)"
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status} ${res.statusText} :: ${url}\n${body}`);
  }
  return await res.text();
}

function parseCsv(text: string) {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true
  }) as Array<Record<string, string>>;
}

type OfacEntity = {
  uid: string;          // ent_num in SDN/ALT/ADD datasets
  name: string;
  type?: string;
  programs: string[];
  remarks?: string;
  aka: string[];
  addresses: Array<{
    address?: string;
    city?: string;
    country?: string;
  }>;
};

function normalizeProgramField(v?: string) {
  // OFAC CSVs sometimes have multiple programs in one field.
  // Keep this conservative; you can refine after inspecting real rows.
  if (!v) return [];
  return v
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export default async (_req: Request, _context: Context) => {
  const store = getStore("ofac");
  const fetchedAt = new Date().toISOString();

  const sdnUrl = `${OFAC_EXPORT_BASE}/${FILES.SDN}`;
  const altUrl = `${OFAC_EXPORT_BASE}/${FILES.ALT}`;
  const addUrl = `${OFAC_EXPORT_BASE}/${FILES.ADD}`;

  const [sdnCsv, altCsv, addCsv] = await Promise.all([
    fetchText(sdnUrl),
    fetchText(altUrl).catch(() => ""), // tolerate missing
    fetchText(addUrl).catch(() => "")  // tolerate missing
  ]);

  const sdnRows = parseCsv(sdnCsv);
  const altRows = altCsv ? parseCsv(altCsv) : [];
  const addRows = addCsv ? parseCsv(addCsv) : [];

  // Build entity map keyed by ent_num
  const entities = new Map<string, OfacEntity>();

  for (const row of sdnRows) {
    const uid = row["ent_num"] || row["ENT_NUM"] || row["uid"] || row["UID"];
    const name = row["sdn_name"] || row["SDN_NAME"] || row["name"] || row["NAME"];
    if (!uid || !name) continue;

    const type = row["sdn_type"] || row["SDN_TYPE"] || row["type"] || row["TYPE"];
    const programs = normalizeProgramField(row["program"] || row["PROGRAM"]);
    const remarks = row["remarks"] || row["REMARKS"];

    entities.set(uid, {
      uid,
      name,
      type,
      programs,
      remarks,
      aka: [],
      addresses: []
    });
  }

  // ALT.CSV: attach AKA/aliases
  for (const row of altRows) {
    const uid = row["ent_num"] || row["ENT_NUM"];
    const altName = row["alt_name"] || row["ALT_NAME"] || row["name"] || row["NAME"];
    if (!uid || !altName) continue;

    const e = entities.get(uid);
    if (!e) continue;
    e.aka.push(altName);
  }

  // ADD.CSV: attach addresses
  for (const row of addRows) {
    const uid = row["ent_num"] || row["ENT_NUM"];
    if (!uid) continue;

    const e = entities.get(uid);
    if (!e) continue;

    e.addresses.push({
      address: row["address"] || row["ADDRESS"],
      city: row["city"] || row["CITY"],
      country: row["country"] || row["COUNTRY"]
    });
  }

  const dataset = Array.from(entities.values());

  const payloadJson = JSON.stringify(dataset);
  const payloadGz = zlib.gzipSync(Buffer.from(payloadJson, "utf8"));

  const meta = {
    fetchedAt,
    source: {
      sdnUrl,
      altUrl,
      addUrl
    },
    counts: {
      sdnRows: sdnRows.length,
      altRows: altRows.length,
      addRows: addRows.length,
      entities: dataset.length
    },
    hashes: {
      sdnSha256: sha256(sdnCsv),
      altSha256: altCsv ? sha256(altCsv) : null,
      addSha256: addCsv ? sha256(addCsv) : null
    }
  };

  await store.set("dataset.json.gz", payloadGz, {
    metadata: { fetchedAt }
  });
  await store.setJSON("meta.json", meta, {
    metadata: { fetchedAt }
  });

  return new Response(JSON.stringify({ ok: true, meta }), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};

// Runs every 6 hours. Cron is UTC.  [oai_citation:10‡Netlify Docs](https://docs.netlify.com/build/functions/scheduled-functions/)
export const config: Config = {
  schedule: "0 */6 * * *"
}
