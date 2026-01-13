import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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
import searchHandler from "../functions/ofac-search";

describe("ofac-search", () => {
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

  describe("search with known entities", () => {
    it("should find entity by exact name", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John%20Doe");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.q).toBe("John Doe");
      expect(data.count).toBeGreaterThan(0);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].uid).toBe("1001");
      expect(data.results[0].name).toBe("John Doe");
    });

    it("should find entity by partial name", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.results.some((r: any) => r.uid === "1001")).toBe(true);
    });

    it("should find entity by alias", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=Johnny%20Doe");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.results.some((r: any) => r.uid === "1001")).toBe(true);
    });

    it("should find organization by name", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=Acme");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.results.some((r: any) => r.uid === "1003")).toBe(true);
    });
  });

  describe("search returns scores", () => {
    it("should include score in results", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0]).toHaveProperty("score");
      expect(typeof data.results[0].score).toBe("number");
    });

    it("should have lower scores for less relevant matches", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeGreaterThan(0);

      // Scores should be between 0 and 1 (lower is better match in Fuse.js)
      data.results.forEach((result: any) => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });

    it("should include all required fields in results", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=Jane");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeGreaterThan(0);

      const result = data.results[0];
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("uid");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("programs");
    });
  });

  describe("search with no results", () => {
    it("should return empty results for non-matching query", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=xyzabc123notfound");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.ok).toBe(true);
      expect(data.count).toBe(0);
      expect(data.results).toEqual([]);
    });

    it("should return empty results for empty query after trim", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Missing ?q=");
    });

    it("should return empty results for whitespace-only query", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=%20%20%20");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Missing ?q=");
    });
  });

  describe("search with limit parameter", () => {
    it("should respect limit parameter", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=a&limit=1");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeLessThanOrEqual(1);
    });

    it("should cap limit at 50", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=a&limit=100");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeLessThanOrEqual(50);
    });

    it("should default to limit of 20", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=a");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.results.length).toBeLessThanOrEqual(20);
    });
  });

  describe("search response format", () => {
    it("should return valid JSON response", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json() as any;
      expect(data).toHaveProperty("ok");
      expect(data).toHaveProperty("q");
      expect(data).toHaveProperty("count");
      expect(data).toHaveProperty("results");
    });

    it("should include query in response", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const query = "Test Query";
      const req = new Request(`http://localhost/.netlify/functions/ofac-search?q=${encodeURIComponent(query)}`);
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.q).toBe(query);
    });

    it("should include count in response", async () => {
      mockStore.get.mockResolvedValueOnce(gzippedDataset);

      const req = new Request("http://localhost/.netlify/functions/ofac-search?q=John");
      const response = await searchHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.count).toBe(data.results.length);
    });
  });


});
