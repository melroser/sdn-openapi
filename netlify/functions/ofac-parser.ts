/**
 * OFAC CSV parsing and entity extraction utilities
 */

export type OfacEntity = {
  uid: string;
  name: string;
  type?: string;
  programs: string[];
  remarks?: string;
  aka: string[];
  addresses: Array<{ address?: string; city?: string; country?: string }>;
};

export function normalizeHeader(header: string): string {
  // Make headers consistent across variations:
  // "Ent Num" -> "ent_num", "SDN Name" -> "sdn_name", etc.
  return header
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "") // strip BOM if it sneaks in
    .replace(/[^\w\s-]/g, "") // remove punctuation except hyphens
    .replace(/[-\s]+/g, "_"); // hyphens and whitespace -> underscores
}

export function firstDefined(
  row: Record<string, string>,
  keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return undefined;
}

/**
 * Parse CSV text into structured rows with normalized headers
 */
export async function parseCSV(csvText: string): Promise<Array<Record<string, string>>> {
  const { parse } = await import("csv-parse/sync");

  console.log("[CSV Parser] Starting CSV parse");
  const rows = parse(csvText, {
    columns: (h: string) => normalizeHeader(h),
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  }) as Array<Record<string, string>>;

  console.log(`[CSV Parser] Parsed ${rows.length} rows`);
  if (rows.length > 0) {
    console.log(`[CSV Parser] Normalized headers: ${Object.keys(rows[0]).join(", ")}`);
  }

  return rows;
}

/**
 * Extract entity records from SDN CSV rows
 */
export function extractEntities(rows: Array<Record<string, string>>): OfacEntity[] {
  const UID_KEYS = ["ent_num", "entnum", "uid", "id"];
  const NAME_KEYS = ["sdn_name", "sdnname", "name", "full_name"];
  const TYPE_KEYS = ["sdn_type", "sdntype", "type"];
  const PROGRAM_KEYS = ["program", "programs", "sanctions_program"];
  const REMARKS_KEYS = ["remarks", "comment", "comments"];

  console.log("[Entity Extractor] Starting entity extraction");
  console.log(`[Entity Extractor] UID key variants: ${UID_KEYS.join(", ")}`);
  console.log(`[Entity Extractor] Name key variants: ${NAME_KEYS.join(", ")}`);

  let skippedCount = 0;
  const entities = rows
    .map((row, idx) => {
      const uid = firstDefined(row, UID_KEYS);
      const name = firstDefined(row, NAME_KEYS);

      if (!uid || !name) {
        skippedCount++;
        if (skippedCount <= 5) {
          // Log first 5 skipped rows for debugging
          console.log(
            `[Entity Extractor] Skipped row ${idx}: uid=${uid ? "found" : "missing"}, name=${name ? "found" : "missing"}`
          );
        }
        return null;
      }

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
        aka: [] as string[],
        addresses: [] as Array<{ address?: string; city?: string; country?: string }>,
      };
    })
    .filter(Boolean) as OfacEntity[];

  console.log(`[Entity Extractor] Extracted ${entities.length} entities from ${rows.length} rows`);
  if (skippedCount > 5) {
    console.log(`[Entity Extractor] Total skipped rows: ${skippedCount}`);
  }

  return entities;
}

/**
 * Merge ALT (alternate names) data into entity.aka arrays using uid as join key
 */
export function consolidateAltData(
  entities: OfacEntity[],
  altRows: Array<Record<string, string>>
): OfacEntity[] {
  const UID_KEYS = ["ent_num", "entnum", "uid", "id"];
  const ALT_NAME_KEYS = ["alt_name", "altname", "name", "alternate_name"];

  console.log("[Data Consolidator] Starting ALT data consolidation");

  // Create map of entities indexed by uid for fast lookup
  const entityMap = new Map<string, OfacEntity>();
  entities.forEach((entity) => {
    entityMap.set(entity.uid, entity);
  });

  let mergedCount = 0;
  let skippedCount = 0;

  altRows.forEach((row) => {
    const uid = firstDefined(row, UID_KEYS);
    const altName = firstDefined(row, ALT_NAME_KEYS);

    if (!uid || !altName) {
      skippedCount++;
      return;
    }

    const entity = entityMap.get(String(uid));
    if (entity) {
      entity.aka.push(String(altName));
      mergedCount++;
    }
  });

  console.log(
    `[Data Consolidator] Merged ${mergedCount} ALT records, skipped ${skippedCount} invalid rows`
  );

  return entities;
}

/**
 * Merge ADD (addresses) data into entity.addresses arrays using uid as join key
 */
export function consolidateAddData(
  entities: OfacEntity[],
  addRows: Array<Record<string, string>>
): OfacEntity[] {
  const UID_KEYS = ["ent_num", "entnum", "uid", "id"];
  const ADDRESS_KEYS = ["address", "addr", "street"];
  const CITY_KEYS = ["city", "city_name"];
  const COUNTRY_KEYS = ["country", "country_name"];

  console.log("[Data Consolidator] Starting ADD data consolidation");

  // Create map of entities indexed by uid for fast lookup
  const entityMap = new Map<string, OfacEntity>();
  entities.forEach((entity) => {
    entityMap.set(entity.uid, entity);
  });

  let mergedCount = 0;
  let skippedCount = 0;

  addRows.forEach((row) => {
    const uid = firstDefined(row, UID_KEYS);

    if (!uid) {
      skippedCount++;
      return;
    }

    const entity = entityMap.get(String(uid));
    if (entity) {
      const address = firstDefined(row, ADDRESS_KEYS);
      const city = firstDefined(row, CITY_KEYS);
      const country = firstDefined(row, COUNTRY_KEYS);

      // Only add address record if at least one field is present
      if (address || city || country) {
        entity.addresses.push({
          address: address ? String(address) : undefined,
          city: city ? String(city) : undefined,
          country: country ? String(country) : undefined,
        });
        mergedCount++;
      }
    }
  });

  console.log(
    `[Data Consolidator] Merged ${mergedCount} ADD records, skipped ${skippedCount} invalid rows`
  );

  return entities;
}
