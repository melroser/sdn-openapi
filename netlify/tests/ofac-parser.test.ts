import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import zlib from "node:zlib";
import { normalizeHeader, firstDefined, extractEntities, consolidateAltData, consolidateAddData, type OfacEntity } from "../functions/ofac-parser";

describe("normalizeHeader", () => {
  it("converts spaces to underscores", () => {
    expect(normalizeHeader("Ent Num")).toBe("ent_num");
    expect(normalizeHeader("SDN Name")).toBe("sdn_name");
  });

  it("removes punctuation", () => {
    expect(normalizeHeader("SDN-Type")).toBe("sdn_type");
    expect(normalizeHeader("Program(s)")).toBe("programs");
  });

  it("handles BOM characters", () => {
    expect(normalizeHeader("\uFEFFEnt Num")).toBe("ent_num");
  });

  it("lowercases all headers", () => {
    expect(normalizeHeader("ENT NUM")).toBe("ent_num");
    expect(normalizeHeader("SdN_NaMe")).toBe("sdn_name");
  });
});

describe("firstDefined", () => {
  it("returns first defined value from keys", () => {
    const row = { uid: "123", name: "John" };
    expect(firstDefined(row, ["uid", "id"])).toBe("123");
  });

  it("skips undefined and null values", () => {
    const row = { uid: undefined, id: "456" };
    expect(firstDefined(row, ["uid", "id"])).toBe("456");
  });

  it("skips empty strings", () => {
    const row = { uid: "", id: "789" };
    expect(firstDefined(row, ["uid", "id"])).toBe("789");
  });

  it("skips whitespace-only strings", () => {
    const row = { uid: "   ", id: "999" };
    expect(firstDefined(row, ["uid", "id"])).toBe("999");
  });

  it("returns undefined if no keys match", () => {
    const row = { name: "John" };
    expect(firstDefined(row, ["uid", "id"])).toBeUndefined();
  });
});

describe("extractEntities", () => {
  it("extracts entities with all required fields", () => {
    const rows = [
      {
        ent_num: "123",
        sdn_name: "John Doe",
        sdn_type: "Individual",
        program: "OFAC",
        remarks: "Test",
      },
    ];

    const entities = extractEntities(rows);

    expect(entities).toHaveLength(1);
    expect(entities[0]).toEqual({
      uid: "123",
      name: "John Doe",
      type: "Individual",
      programs: ["OFAC"],
      remarks: "Test",
      aka: [],
      addresses: [],
    });
  });

  it("handles various header name variants for uid", () => {
    const rows = [
      { entnum: "111", sdn_name: "Entity A" },
      { uid: "222", sdn_name: "Entity B" },
      { id: "333", sdn_name: "Entity C" },
    ];

    const entities = extractEntities(rows);

    expect(entities).toHaveLength(3);
    expect(entities[0].uid).toBe("111");
    expect(entities[1].uid).toBe("222");
    expect(entities[2].uid).toBe("333");
  });

  it("handles various header name variants for name", () => {
    const rows = [
      { ent_num: "111", sdnname: "Name A" },
      { ent_num: "222", name: "Name B" },
      { ent_num: "333", full_name: "Name C" },
    ];

    const entities = extractEntities(rows);

    expect(entities).toHaveLength(3);
    expect(entities[0].name).toBe("Name A");
    expect(entities[1].name).toBe("Name B");
    expect(entities[2].name).toBe("Name C");
  });

  it("filters out rows with missing uid", () => {
    const rows = [
      { ent_num: "123", sdn_name: "Valid Entity" },
      { sdn_name: "Missing UID" },
    ];

    const entities = extractEntities(rows);

    expect(entities).toHaveLength(1);
    expect(entities[0].uid).toBe("123");
  });

  it("filters out rows with missing name", () => {
    const rows = [
      { ent_num: "123", sdn_name: "Valid Entity" },
      { ent_num: "456" },
    ];

    const entities = extractEntities(rows);

    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe("Valid Entity");
  });

  it("parses programs as comma-separated list", () => {
    const rows = [
      { ent_num: "123", sdn_name: "Entity", program: "OFAC, SDN, CAPTA" },
    ];

    const entities = extractEntities(rows);

    expect(entities[0].programs).toEqual(["OFAC", "SDN", "CAPTA"]);
  });

  it("handles semicolon-separated programs", () => {
    const rows = [
      { ent_num: "123", sdn_name: "Entity", program: "OFAC; SDN; CAPTA" },
    ];

    const entities = extractEntities(rows);

    expect(entities[0].programs).toEqual(["OFAC", "SDN", "CAPTA"]);
  });

  it("handles empty programs field", () => {
    const rows = [{ ent_num: "123", sdn_name: "Entity", program: "" }];

    const entities = extractEntities(rows);

    expect(entities[0].programs).toEqual([]);
  });

  it("initializes aka and addresses as empty arrays", () => {
    const rows = [{ ent_num: "123", sdn_name: "Entity" }];

    const entities = extractEntities(rows);

    expect(entities[0].aka).toEqual([]);
    expect(entities[0].addresses).toEqual([]);
  });

  it("handles optional fields as undefined", () => {
    const rows = [{ ent_num: "123", sdn_name: "Entity" }];

    const entities = extractEntities(rows);

    expect(entities[0].type).toBeUndefined();
    expect(entities[0].remarks).toBeUndefined();
  });

  it("handles empty rows array", () => {
    const entities = extractEntities([]);
    expect(entities).toEqual([]);
  });
});

describe("consolidateAltData", () => {
  it("merges ALT data into entity.aka arrays by uid", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const altRows = [
      { ent_num: "123", alt_name: "Johnny Doe" },
      { ent_num: "123", alt_name: "J. Doe" },
    ];

    const result = consolidateAltData(entities, altRows);

    expect(result[0].aka).toEqual(["Johnny Doe", "J. Doe"]);
  });

  it("skips ALT rows with missing uid", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const altRows = [
      { alt_name: "Johnny Doe" }, // missing uid
      { ent_num: "123", alt_name: "J. Doe" },
    ];

    const result = consolidateAltData(entities, altRows);

    expect(result[0].aka).toEqual(["J. Doe"]);
  });

  it("skips ALT rows with missing alt_name", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const altRows = [
      { ent_num: "123" }, // missing alt_name
      { ent_num: "123", alt_name: "J. Doe" },
    ];

    const result = consolidateAltData(entities, altRows);

    expect(result[0].aka).toEqual(["J. Doe"]);
  });

  it("skips ALT rows for non-existent entities", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const altRows = [
      { ent_num: "999", alt_name: "Unknown Entity" }, // uid doesn't exist
      { ent_num: "123", alt_name: "J. Doe" },
    ];

    const result = consolidateAltData(entities, altRows);

    expect(result[0].aka).toEqual(["J. Doe"]);
  });

  it("handles empty ALT rows", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const result = consolidateAltData(entities, []);

    expect(result[0].aka).toEqual([]);
  });

  it("handles various uid key variants for ALT", () => {
    const entities = [
      {
        uid: "123",
        name: "Entity A",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
      {
        uid: "456",
        name: "Entity B",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const altRows = [
      { entnum: "123", alt_name: "Alt A" },
      { uid: "456", alt_name: "Alt B" },
    ];

    const result = consolidateAltData(entities, altRows);

    expect(result[0].aka).toEqual(["Alt A"]);
    expect(result[1].aka).toEqual(["Alt B"]);
  });
});

describe("consolidateAddData", () => {
  it("merges ADD data into entity.addresses arrays by uid", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { ent_num: "123", address: "123 Main St", city: "New York", country: "USA" },
      { ent_num: "123", address: "456 Oak Ave", city: "Boston", country: "USA" },
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toEqual([
      { address: "123 Main St", city: "New York", country: "USA" },
      { address: "456 Oak Ave", city: "Boston", country: "USA" },
    ]);
  });

  it("skips ADD rows with missing uid", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { address: "123 Main St", city: "New York" }, // missing uid
      { ent_num: "123", address: "456 Oak Ave", city: "Boston" },
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toHaveLength(1);
    expect(result[0].addresses[0].address).toBe("456 Oak Ave");
  });

  it("skips ADD rows with no address fields", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { ent_num: "123" }, // no address fields
      { ent_num: "123", address: "456 Oak Ave" },
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toHaveLength(1);
    expect(result[0].addresses[0].address).toBe("456 Oak Ave");
  });

  it("skips ADD rows for non-existent entities", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { ent_num: "999", address: "Unknown Address" }, // uid doesn't exist
      { ent_num: "123", address: "456 Oak Ave" },
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toHaveLength(1);
    expect(result[0].addresses[0].address).toBe("456 Oak Ave");
  });

  it("handles empty ADD rows", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const result = consolidateAddData(entities, []);

    expect(result[0].addresses).toEqual([]);
  });

  it("handles various uid key variants for ADD", () => {
    const entities = [
      {
        uid: "123",
        name: "Entity A",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
      {
        uid: "456",
        name: "Entity B",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { entnum: "123", address: "Addr A", city: "City A" },
      { uid: "456", address: "Addr B", city: "City B" },
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toEqual([{ address: "Addr A", city: "City A", country: undefined }]);
    expect(result[1].addresses).toEqual([{ address: "Addr B", city: "City B", country: undefined }]);
  });

  it("handles partial address fields", () => {
    const entities = [
      {
        uid: "123",
        name: "John Doe",
        type: undefined,
        programs: [],
        remarks: undefined,
        aka: [],
        addresses: [],
      },
    ];

    const addRows = [
      { ent_num: "123", address: "123 Main St" }, // only address
      { ent_num: "123", city: "New York" }, // only city
      { ent_num: "123", country: "USA" }, // only country
    ];

    const result = consolidateAddData(entities, addRows);

    expect(result[0].addresses).toEqual([
      { address: "123 Main St", city: undefined, country: undefined },
      { address: undefined, city: "New York", country: undefined },
      { address: undefined, city: undefined, country: "USA" },
    ]);
  });
});

describe("Property: Data Consolidation Idempotence", () => {
  it("should produce same result when consolidating twice", () => {
    // Feature: ofac-api-fix, Property 2: Data Consolidation Idempotence
    // Validates: Requirements 2.2, 2.3

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ent_num: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            sdn_name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        fc.array(
          fc.record({
            ent_num: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            alt_name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          }),
          { maxLength: 100 }
        ),
        fc.array(
          fc.record({
            ent_num: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            address: fc.option(fc.string()),
            city: fc.option(fc.string()),
          }),
          { maxLength: 100 }
        ),
        (sdnRows, altRows, addRows) => {
          // Extract entities
          const entities1 = extractEntities(sdnRows);

          // Consolidate once
          let consolidated1 = consolidateAltData(entities1, altRows);
          consolidated1 = consolidateAddData(consolidated1, addRows);

          // Consolidate again
          let consolidated2 = consolidateAltData(consolidated1, altRows);
          consolidated2 = consolidateAddData(consolidated2, addRows);

          // Results should be identical
          expect(JSON.stringify(consolidated1)).toBe(JSON.stringify(consolidated2));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property: Entity Extraction Completeness", () => {
  it("should extract all rows with valid uid and name", () => {
    // Feature: ofac-api-fix, Property 1: Entity Extraction Completeness
    // Validates: Requirements 1.2, 1.3

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ent_num: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            sdn_name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            sdn_type: fc.option(fc.string()),
            program: fc.option(fc.string()),
            remarks: fc.option(fc.string()),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (rows) => {
          const entities = extractEntities(rows);

          // Count rows with both uid and name (non-empty after trim)
          const validRowCount = rows.filter((r) => r.ent_num?.trim() && r.sdn_name?.trim()).length;

          // Extracted entity count should equal valid row count
          expect(entities.length).toBe(validRowCount);

          // All extracted entities should have uid and name
          entities.forEach((entity) => {
            expect(entity.uid).toBeTruthy();
            expect(entity.name).toBeTruthy();
          });

          // Entity count should be > 0 when input has valid rows
          if (validRowCount > 0) {
            expect(entities.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Serialization and Compression", () => {
  it("serializes entities to valid JSON", () => {
    const entities: OfacEntity[] = [
      {
        uid: "123",
        name: "John Doe",
        type: "Individual",
        programs: ["OFAC", "SDN"],
        remarks: "Test entity",
        aka: ["Johnny", "J. Doe"],
        addresses: [
          { address: "123 Main St", city: "New York", country: "USA" },
        ],
      },
    ];

    const json = JSON.stringify(entities);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(entities);
    expect(parsed[0].uid).toBe("123");
    expect(parsed[0].name).toBe("John Doe");
    expect(parsed[0].aka).toEqual(["Johnny", "J. Doe"]);
  });

  it("gzips JSON data", () => {
    // Create a larger dataset to ensure gzip compression is effective
    const entities: OfacEntity[] = Array.from({ length: 100 }, (_, i) => ({
      uid: String(i),
      name: `Entity ${i}`,
      type: "Individual",
      programs: ["OFAC", "SDN"],
      remarks: "Test entity with some remarks",
      aka: ["Alias 1", "Alias 2"],
      addresses: [
        { address: "123 Main St", city: "New York", country: "USA" },
      ],
    }));

    const json = JSON.stringify(entities);
    const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));

    expect(gzipped).toBeInstanceOf(Buffer);
    expect(gzipped.length).toBeGreaterThan(0);
    expect(gzipped.length).toBeLessThan(json.length); // Compression should reduce size for larger data
  });

  it("round-trip: serialize, gzip, ungzip, deserialize", () => {
    const entities: OfacEntity[] = [
      {
        uid: "789",
        name: "Test Entity",
        type: "Organization",
        programs: ["CAPTA"],
        remarks: "Test",
        aka: ["Alt Name"],
        addresses: [
          { address: "456 Oak Ave", city: "Boston", country: "USA" },
          { address: "789 Pine Rd", city: "Chicago", country: "USA" },
        ],
      },
    ];

    // Serialize
    const json = JSON.stringify(entities);

    // Gzip
    const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));

    // Ungzip
    const ungzipped = zlib.gunzipSync(gzipped);

    // Deserialize
    const deserialized = JSON.parse(ungzipped.toString("utf8"));

    expect(deserialized).toEqual(entities);
    expect(deserialized[0].uid).toBe("789");
    expect(deserialized[0].addresses).toHaveLength(2);
  });

  it("handles empty entity array", () => {
    const entities: OfacEntity[] = [];

    const json = JSON.stringify(entities);
    const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));
    const ungzipped = zlib.gunzipSync(gzipped);
    const deserialized = JSON.parse(ungzipped.toString("utf8"));

    expect(deserialized).toEqual([]);
  });

  it("preserves all entity fields through serialization", () => {
    const entities: OfacEntity[] = [
      {
        uid: "999",
        name: "Complex Entity",
        type: "Individual",
        programs: ["OFAC", "SDN", "CAPTA"],
        remarks: "Complex remarks with special chars: !@#$%",
        aka: ["Alias 1", "Alias 2", "Alias 3"],
        addresses: [
          { address: "123 Main St", city: "New York", country: "USA" },
          { address: "456 Oak Ave", city: "Boston", country: "USA" },
          { address: undefined, city: "Chicago", country: undefined },
        ],
      },
    ];

    const json = JSON.stringify(entities);
    const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));
    const ungzipped = zlib.gunzipSync(gzipped);
    const deserialized = JSON.parse(ungzipped.toString("utf8"));

    expect(deserialized[0].uid).toBe("999");
    expect(deserialized[0].name).toBe("Complex Entity");
    expect(deserialized[0].type).toBe("Individual");
    expect(deserialized[0].programs).toEqual(["OFAC", "SDN", "CAPTA"]);
    expect(deserialized[0].remarks).toBe("Complex remarks with special chars: !@#$%");
    expect(deserialized[0].aka).toEqual(["Alias 1", "Alias 2", "Alias 3"]);
    expect(deserialized[0].addresses).toHaveLength(3);
  });

  it("handles large entity arrays", () => {
    const entities: OfacEntity[] = Array.from({ length: 1000 }, (_, i) => ({
      uid: String(i),
      name: `Entity ${i}`,
      programs: ["OFAC"],
      aka: [],
      addresses: [],
    }));

    const json = JSON.stringify(entities);
    const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));
    const ungzipped = zlib.gunzipSync(gzipped);
    const deserialized = JSON.parse(ungzipped.toString("utf8"));

    expect(deserialized).toHaveLength(1000);
    expect(deserialized[0].uid).toBe("0");
    expect(deserialized[999].uid).toBe("999");
  });
});

describe("Property: Serialization Round Trip", () => {
  it("should preserve entity data through serialize-gzip-ungzip-deserialize cycle", () => {
    // Feature: ofac-api-fix, Property 3: Serialization Round Trip
    // Validates: Requirements 3.1, 3.2, 3.3

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            uid: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            type: fc.option(fc.string()),
            programs: fc.array(fc.string()),
            remarks: fc.option(fc.string()),
            aka: fc.array(fc.string()),
            addresses: fc.array(
              fc.record({
                address: fc.option(fc.string()),
                city: fc.option(fc.string()),
                country: fc.option(fc.string()),
              })
            ),
          }),
          { maxLength: 100 }
        ),
        (entities) => {
          // Serialize
          const json = JSON.stringify(entities);

          // Gzip
          const gzipped = zlib.gzipSync(Buffer.from(json, "utf8"));

          // Ungzip
          const ungzipped = zlib.gunzipSync(gzipped);

          // Deserialize
          const deserialized = JSON.parse(ungzipped.toString("utf8"));

          // Result should equal original
          expect(JSON.stringify(deserialized)).toBe(JSON.stringify(entities));
        }
      ),
      { numRuns: 100 }
    );
  });
});
