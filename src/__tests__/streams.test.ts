import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActivityStreams, getActivityStream } from "../tools/streams.js";

vi.mock("../client.js", () => ({
  get: vi.fn(),
}));

import * as client from "../client.js";

describe("get_activity_streams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all streams when no types are given", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getActivityStreams({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/streams", {});
  });

  it("passes requested types as a comma-separated list", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getActivityStreams({ activityId: "abc123", types: ["watts", "heartrate"] });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/streams", {
      types: "watts,heartrate",
    });
  });

  it("returns the complete stream data keyed by type", async () => {
    vi.mocked(client.get).mockResolvedValue([
      { type: "time", data: [0, 1, 2] },
      { type: "watts", data: [150, null, 210] },
    ]);

    const result = await getActivityStreams({ activityId: "abc123" });

    expect(JSON.parse(result.content[0].text)).toEqual({
      activity_id: "abc123",
      available_streams: ["time", "watts"],
      stream_lengths: { time: 3, watts: 3 },
      streams: { time: [0, 1, 2], watts: [150, null, 210] },
    });
  });

  it("returns compact JSON without indentation", async () => {
    vi.mocked(client.get).mockResolvedValue([{ type: "watts", data: [1, 2] }]);

    const result = await getActivityStreams({ activityId: "abc123" });

    expect(result.content[0].text).not.toContain("\n");
  });

  it("merges data2 into value pairs (e.g. latlng)", async () => {
    vi.mocked(client.get).mockResolvedValue([
      { type: "latlng", data: [47.1, 47.2], data2: [8.5, 8.6] },
    ]);

    const result = await getActivityStreams({ activityId: "abc123" });

    expect(JSON.parse(result.content[0].text).streams.latlng).toEqual([
      [47.1, 8.5],
      [47.2, 8.6],
    ]);
  });

  it("returns a message when the activity has no stream data", async () => {
    vi.mocked(client.get).mockResolvedValue([{ type: "watts", data: null }]);

    const result = await getActivityStreams({ activityId: "abc123" });

    expect(JSON.parse(result.content[0].text)).toEqual({
      activity_id: "abc123",
      streams: {},
      available_streams: [],
      message: "No stream data available for this activity",
    });
  });
});

describe("get_activity_stream (single stream)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests only the given stream type", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getActivityStream({ activityId: "abc123", type: "heartrate" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/streams", {
      types: "heartrate",
    });
  });

  it("returns just the data of that stream", async () => {
    vi.mocked(client.get).mockResolvedValue([{ type: "heartrate", data: [120, 125, 130] }]);

    const result = await getActivityStream({ activityId: "abc123", type: "heartrate" });

    expect(JSON.parse(result.content[0].text)).toEqual({
      activity_id: "abc123",
      type: "heartrate",
      length: 3,
      data: [120, 125, 130],
    });
  });

  it("returns a message when the stream is not available", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    const result = await getActivityStream({ activityId: "abc123", type: "watts" });

    expect(JSON.parse(result.content[0].text)).toEqual({
      activity_id: "abc123",
      type: "watts",
      data: [],
      message: "No watts stream available for this activity",
    });
  });
});
