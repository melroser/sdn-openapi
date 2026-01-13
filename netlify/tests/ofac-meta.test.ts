import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the Netlify Blobs store
const mockStore = {
  get: vi.fn(),
};

vi.mock("@netlify/blobs", () => ({
  getStore: () => mockStore,
}));

// Import after mocking
import metaHandler from "../functions/ofac-meta";

describe("ofac-meta", () => {
  const mockMetadata = {
    fetchedAt: "2024-01-15T10:30:00Z",
    source: {
      sdnUrl: "https://www.treasury.gov/ofac/downloads/sdn.csv",
      altUrl: "https://www.treasury.gov/ofac/downloads/alt.csv",
      addUrl: "https://www.treasury.gov/ofac/downloads/add.csv",
    },
    counts: {
      sdnRows: 1500,
      altRows: 2300,
      addRows: 3100,
      entities: 1200,
    },
    hashes: {
      sdnSha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      altSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      addSha256: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    },
  };

  beforeEach(() => {
    mockStore.get.mockClear();
  });

  describe("metadata contains all required fields", () => {
    it("should return metadata with fetchedAt field", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toHaveProperty("fetchedAt");
      expect(typeof data.fetchedAt).toBe("string");
    });

    it("should return metadata with source URLs", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toHaveProperty("source");
      expect(data.source).toHaveProperty("sdnUrl");
      expect(data.source).toHaveProperty("altUrl");
      expect(data.source).toHaveProperty("addUrl");
    });

    it("should return metadata with row counts", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toHaveProperty("counts");
      expect(data.counts).toHaveProperty("sdnRows");
      expect(data.counts).toHaveProperty("altRows");
      expect(data.counts).toHaveProperty("addRows");
      expect(data.counts).toHaveProperty("entities");
    });

    it("should return metadata with entity count and hashes", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toHaveProperty("hashes");
      expect(data.hashes).toHaveProperty("sdnSha256");
      expect(data.hashes).toHaveProperty("altSha256");
      expect(data.hashes).toHaveProperty("addSha256");
      expect(data.counts.entities).toBeGreaterThan(0);
    });

    it("should return complete metadata structure", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data).toEqual(mockMetadata);
    });
  });

  describe("fetchedAt is valid timestamp", () => {
    it("should have fetchedAt as ISO 8601 timestamp", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      const fetchedAt = data.fetchedAt;
      
      // Verify it's a valid ISO 8601 timestamp
      const date = new Date(fetchedAt);
      expect(date.toString()).not.toBe("Invalid Date");
      expect(fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it("should have fetchedAt as a recent timestamp", async () => {
      const now = new Date();
      const recentMetadata = {
        ...mockMetadata,
        fetchedAt: now.toISOString(),
      };
      mockStore.get.mockResolvedValueOnce(JSON.stringify(recentMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      const fetchedAt = new Date(data.fetchedAt);
      
      // Should be within last hour
      const timeDiff = now.getTime() - fetchedAt.getTime();
      expect(timeDiff).toBeLessThan(3600000); // 1 hour in ms
      expect(timeDiff).toBeGreaterThanOrEqual(0);
    });
  });

  describe("source URLs are present", () => {
    it("should have all three source URLs", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.source.sdnUrl).toBeTruthy();
      expect(data.source.altUrl).toBeTruthy();
      expect(data.source.addUrl).toBeTruthy();
    });

    it("should have valid URLs", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      
      // Verify URLs are valid
      expect(() => new URL(data.source.sdnUrl)).not.toThrow();
      expect(() => new URL(data.source.altUrl)).not.toThrow();
      expect(() => new URL(data.source.addUrl)).not.toThrow();
    });
  });

  describe("row counts are present", () => {
    it("should have all row counts", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.counts.sdnRows).toBeDefined();
      expect(data.counts.altRows).toBeDefined();
      expect(data.counts.addRows).toBeDefined();
      expect(data.counts.entities).toBeDefined();
    });

    it("should have numeric row counts", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(typeof data.counts.sdnRows).toBe("number");
      expect(typeof data.counts.altRows).toBe("number");
      expect(typeof data.counts.addRows).toBe("number");
      expect(typeof data.counts.entities).toBe("number");
    });

    it("should have non-negative row counts", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.counts.sdnRows).toBeGreaterThanOrEqual(0);
      expect(data.counts.altRows).toBeGreaterThanOrEqual(0);
      expect(data.counts.addRows).toBeGreaterThanOrEqual(0);
      expect(data.counts.entities).toBeGreaterThanOrEqual(0);
    });
  });

  describe("entity count and hashes are present", () => {
    it("should have entity count", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.counts.entities).toBeDefined();
      expect(typeof data.counts.entities).toBe("number");
    });

    it("should have all three SHA256 hashes", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.hashes.sdnSha256).toBeDefined();
      expect(data.hashes.altSha256).toBeDefined();
      expect(data.hashes.addSha256).toBeDefined();
    });

    it("should have valid SHA256 hashes", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      
      // SHA256 hashes are 64 hex characters
      const sha256Regex = /^[a-f0-9]{64}$/i;
      expect(data.hashes.sdnSha256).toMatch(sha256Regex);
      expect(data.hashes.altSha256).toMatch(sha256Regex);
      expect(data.hashes.addSha256).toMatch(sha256Regex);
    });
  });

  describe("response format and headers", () => {
    it("should return 200 status when metadata exists", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(200);
    });

    it("should return 404 when metadata does not exist", async () => {
      mockStore.get.mockResolvedValueOnce(null);

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.status).toBe(404);
      const data = await response.json() as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBeDefined();
    });

    it("should return JSON content type", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should include cache control headers", async () => {
      mockStore.get.mockResolvedValueOnce(JSON.stringify(mockMetadata));

      const req = new Request("http://localhost/.netlify/functions/ofac-meta");
      const response = await metaHandler(req, {} as any);

      expect(response.headers.get("cache-control")).toBeDefined();
      expect(response.headers.get("cache-control")).toContain("max-age");
    });
  });
});
