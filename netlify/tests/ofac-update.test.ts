import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import zlib from "node:zlib";
import type { OfacEntity } from "../functions/ofac-parser";

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  setJSON: vi.fn(),
};

vi.mock("@netlify/blobs", () => ({
  getStore: () => mockStore,
}));

import updateHandler, { computeDelta } from "../functions/ofac-update";

describe("ofac-update", () => {
  const sdnCsv = [
    '1,"ONE, Person",individual,SDN,-0-',
    '2,"TWO LLC",entity,SDN,-0-',
  ].join("\n");

  const altCsv = [
    '1,aka,1,"ONE ALT",-0-',
  ].join("\n");

  const addCsv = [
    '1,1,"123 Road",Miami,United States,-0-',
  ].join("\n");

  beforeEach(() => {
    mockStore.get.mockReset();
    mockStore.set.mockReset();
    mockStore.setJSON.mockReset();
    delete process.env.OFAC_UPDATE_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OFAC_UPDATE_SECRET;
  });

  it("rejects manual updates when OFAC_UPDATE_SECRET is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/.netlify/functions/ofac-update", {
      method: "POST",
    });
    const response = await updateHandler(req, {} as any);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects manual updates with an invalid secret", async () => {
    process.env.OFAC_UPDATE_SECRET = "correct-secret";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/.netlify/functions/ofac-update", {
      method: "POST",
      headers: { "x-update-secret": "wrong-secret" },
    });
    const response = await updateHandler(req, {} as any);

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches OFAC CSVs, stores metadata, and records a baseline delta with a valid secret", async () => {
    process.env.OFAC_UPDATE_SECRET = "correct-secret";
    mockStore.get.mockResolvedValueOnce(null);

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/SDN.CSV")) return new Response(sdnCsv, { status: 200 });
      if (url.endsWith("/ALT.CSV")) return new Response(altCsv, { status: 200 });
      if (url.endsWith("/ADD.CSV")) return new Response(addCsv, { status: 200 });
      return new Response("not found", { status: 404 });
    }));

    const req = new Request("http://localhost/.netlify/functions/ofac-update", {
      method: "POST",
      headers: { "authorization": "Bearer correct-secret" },
    });
    const response = await updateHandler(req, {} as any);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.meta.counts.entities).toBe(2);
    expect(data.meta.delta).toMatchObject({
      baseline: true,
      previousCount: 0,
      currentCount: 2,
      addedCount: 2,
      removedCount: 0,
      changedCount: 0,
    });
    expect(mockStore.set).toHaveBeenCalledWith(
      "dataset.json.gz",
      expect.any(Buffer),
      expect.any(Object)
    );
    expect(mockStore.setJSON).toHaveBeenCalledWith(
      "delta.json",
      expect.objectContaining({ baseline: true, addedCount: 2 }),
      expect.any(Object)
    );
  });

  it("computes added, removed, changed, and unchanged entities", () => {
    const previous: OfacEntity[] = [
      { uid: "1", name: "One", programs: ["SDN"], aka: [], addresses: [] },
      { uid: "2", name: "Two", programs: ["SDN"], aka: [], addresses: [] },
      { uid: "3", name: "Three", programs: ["SDN"], aka: [], addresses: [] },
    ];

    const current: OfacEntity[] = [
      { uid: "1", name: "One", programs: ["SDN"], aka: [], addresses: [] },
      { uid: "2", name: "Two Updated", programs: ["SDN"], aka: [], addresses: [] },
      { uid: "4", name: "Four", programs: ["SDN"], aka: [], addresses: [] },
    ];

    expect(computeDelta(previous, current)).toMatchObject({
      baseline: false,
      previousCount: 3,
      currentCount: 3,
      addedCount: 1,
      removedCount: 1,
      changedCount: 1,
      unchangedCount: 1,
      addedUids: ["4"],
      removedUids: ["3"],
      changedUids: ["2"],
    });
  });
});
