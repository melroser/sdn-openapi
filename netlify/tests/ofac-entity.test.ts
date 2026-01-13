import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import zlib from "node:zlib";
import type { OfacEntity } from "../functions/ofac-parser";

// Mock the Netlify Blobs store
const mockStore = {
  get: vi.fn(),
};

vi.mock("@netlify/blobs", () => ({
  getStore: () => mockStore,
}));

// Import after mocking
import entityHandler from "../functions/ofac-entity";

describe("ofac-entity", () => {
  const mockEntities: OfacEntity[] = [
    {
      uid: "1001",
      name: "John Doe",
      type: "Individual",
      programs: ["OFAC", "SDN"],
      remarks: "Test entity",
      aka: ["Johnny Doe", "J. Doe"],
      addresses: [
        { address: "123 Main St", city: "New York", country: "USA" },
      ],
    },
    {
      uid: "1002",
      name: "Jane Smith",
      type: "Individual",
      programs: ["SDN"],
      remarks: "Another test entity",
      aka: ["Jane S.", "J. Smith"],
      addresses: [
        { address: "456 Oak Ave", city: "Boston", country: "USA" },
      ],
    },
    {
      uid: "1003",
      name: "Acme Corporation",
      type: "Organization",
      programs: ["OFAC"],
      remarks: "Test organization",
      aka: ["Acme Inc", "Acme Ltd"],
      addresses: [
        { address: "789 Pine Rd", city: "Chicago", country: "USA" },
        { address: "321 Elm St", city: "Los Angeles", country: "USA" },
      ],
    },
  ];

  let gzippedDataset: Buffer;

  beforeAll(() => {
    // Create gzipped dataset
    const json = JSON.stringify(mockEntities);
    gzippedDataset = zlib.gzipSync(Buffer.from(json, "utf8"));
  });

  beforeEach(() => {
    // Clear mock before each test
    mockStore.get.mockClear();
  });

  describe("retrieval of known entities", () => {
    it("should retrieve entity by uid", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.entity).toBeDefined();
      expect(data.entity.uid).toBe("1001");
      expect(data.entity.name).toBe("John Doe");
    });

    it("should return full entity structure", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1003" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1003");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.entity).toHaveProperty("uid");
      expect(data.entity).toHaveProperty("name");
      expect(data.entity).toHaveProperty("type");
      expect(data.entity).toHaveProperty("programs");
      expect(data.entity).toHaveProperty("remarks");
      expect(data.entity).toHaveProperty("aka");
      expect(data.entity).toHaveProperty("addresses");

      // Verify structure
      expect(data.entity.uid).toBe("1003");
      expect(data.entity.name).toBe("Acme Corporation");
      expect(data.entity.type).toBe("Organization");
      expect(Array.isArray(data.entity.programs)).toBe(true);
      expect(Array.isArray(data.entity.aka)).toBe(true);
      expect(Array.isArray(data.entity.addresses)).toBe(true);
    });

    it("should retrieve entity with multiple addresses", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1003" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1003");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.entity.addresses).toHaveLength(2);
      expect(data.entity.addresses[0].address).toBe("789 Pine Rd");
      expect(data.entity.addresses[1].address).toBe("321 Elm St");
    });

    it("should retrieve entity with multiple aliases", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.entity.aka).toHaveLength(2);
      expect(data.entity.aka).toContain("Johnny Doe");
      expect(data.entity.aka).toContain("J. Doe");
    });

    it("should retrieve entity with all programs", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.entity.programs).toEqual(["OFAC", "SDN"]);
    });
  });

  describe("404 for missing entities", () => {
    it("should return 404 for non-existent uid", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "9999" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/9999");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(404);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Not found");
      expect(data.uid).toBe("9999");
    });

    it("should return 404 with appropriate message", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "invalid-uid" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/invalid-uid");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(404);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Not found");
    });

    it("should return 400 for missing uid parameter", async () => {
      const context = { params: {} } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Missing :uid");
    });
  });

  describe("response format", () => {
    it("should return valid JSON response", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as any;
      expect(data).toHaveProperty("ok");
      expect(data).toHaveProperty("entity");
    });

    it("should include cache control headers", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("max-age=300");
    });

    it("should return ok: true for successful retrieval", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1002" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1002");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
    });

    it("should return ok: false for errors", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "9999" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/9999");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(404);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
    });
  });

  describe("entity data integrity", () => {
    it("should preserve all entity fields exactly", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const context = { params: { uid: "1001" } } as any;
      const req = new Request("http://localhost/.netlify/functions/ofac-entity/1001");
      const response = await entityHandler(req, context);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      const retrieved = data.entity;
      const original = mockEntities[0];

      expect(retrieved.uid).toBe(original.uid);
      expect(retrieved.name).toBe(original.name);
      expect(retrieved.type).toBe(original.type);
      expect(retrieved.programs).toEqual(original.programs);
      expect(retrieved.remarks).toBe(original.remarks);
      expect(retrieved.aka).toEqual(original.aka);
      expect(retrieved.addresses).toEqual(original.addresses);
    });
  });
});
