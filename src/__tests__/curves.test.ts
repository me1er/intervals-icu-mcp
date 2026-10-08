import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPowerCurves,
  getHrCurves,
  getPaceCurves,
  getActivityPowerCurve,
  getActivityPowerCurves,
  getActivityHrCurve,
  getActivityPaceCurve,
  getActivityPowerVsHrCurve,
} from "../tools/curves.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2024-06-30T12:00:00.000Z");
const FIXED_TODAY = "2024-06-30";
const FIXED_ONE_YEAR_AGO = "2023-06-30";

describe("get_power_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("uses provided date range when given", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({ oldest: "2024-01-01", newest: "2024-06-01" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: "2024-01-01",
      newest: "2024-06-01",
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({ type: "Ride" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Ride",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 1, watts: 1200 }, { secs: 60, watts: 450 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getPowerCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});

describe("get_hr_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getHrCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/hr-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getHrCurves({ type: "Run" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/hr-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Run",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 60, bpm: 185 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getHrCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});

describe("get_pace_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPaceCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/pace-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPaceCurves({ type: "Run" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/pace-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Run",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 60, ms: 4.5 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getPaceCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});

describe("get_activity_power_curve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id/power-curve without query by default", async () => {
    const mockCurve = { id: "abc123", secs: [1, 2], values: [800, 750] };
    vi.mocked(client.get).mockResolvedValue(mockCurve);

    const result = await getActivityPowerCurve({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/power-curve", {});
    expect(JSON.parse(result.content[0].text)).toEqual(mockCurve);
  });

  it("passes the fatigue level when given", async () => {
    vi.mocked(client.get).mockResolvedValue({});

    await getActivityPowerCurve({ activityId: "abc123", fatigue: "kj1" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/power-curve", { fatigue: "kj1" });
  });
});

describe("get_activity_power_curves", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id/power-curves without query by default", async () => {
    const mockCurves = [{ id: "abc123", secs: [1], values: [800] }];
    vi.mocked(client.get).mockResolvedValue(mockCurves);

    const result = await getActivityPowerCurves({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/power-curves", {});
    expect(JSON.parse(result.content[0].text)).toEqual(mockCurves);
  });

  it("passes types and fatigue as comma-separated lists", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getActivityPowerCurves({
      activityId: "abc123",
      types: ["watts", "fixed_watts"],
      fatigue: ["normal", "kj0"],
    });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/power-curves", {
      types: "watts,fixed_watts",
      fatigue: "normal,kj0",
    });
  });
});

describe("get_activity_hr_curve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id/hr-curve and returns the curve as JSON text", async () => {
    const mockCurve = { id: "abc123", secs: [1, 2], values: [180, 179] };
    vi.mocked(client.get).mockResolvedValue(mockCurve);

    const result = await getActivityHrCurve({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/hr-curve");
    expect(JSON.parse(result.content[0].text)).toEqual(mockCurve);
  });
});

describe("get_activity_pace_curve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id/pace-curve without query by default", async () => {
    const mockCurve = { id: "abc123", distance: [400, 1000], values: [80, 210], type: "PACE" };
    vi.mocked(client.get).mockResolvedValue(mockCurve);

    const result = await getActivityPaceCurve({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/pace-curve", {});
    expect(JSON.parse(result.content[0].text)).toEqual(mockCurve);
  });

  it("requests the grade adjusted curve when gap is true", async () => {
    vi.mocked(client.get).mockResolvedValue({});

    await getActivityPaceCurve({ activityId: "abc123", gap: true });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/pace-curve", { gap: true });
  });
});

describe("get_activity_power_vs_hr_curve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id/power-vs-hr and returns the data as JSON text", async () => {
    const mockPlot = { bucketSize: 60, decoupling: 3.2, series: [{ start: 0, watts: 250, hr: 140 }] };
    vi.mocked(client.get).mockResolvedValue(mockPlot);

    const result = await getActivityPowerVsHrCurve({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123/power-vs-hr");
    expect(JSON.parse(result.content[0].text)).toEqual(mockPlot);
  });
});
