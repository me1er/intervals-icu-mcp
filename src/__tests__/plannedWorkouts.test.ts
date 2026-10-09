import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createPlannedWorkout,
  updatePlannedWorkout,
  deletePlannedWorkout,
  toLocalDateTime,
} from "../tools/plannedWorkouts.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  postFile: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2024-06-30T12:00:00.000Z");

describe("toLocalDateTime", () => {
  it("appends midnight to a plain date", () => {
    expect(toLocalDateTime("2024-07-01")).toBe("2024-07-01T00:00:00");
  });

  it("leaves a date-time unchanged", () => {
    expect(toLocalDateTime("2024-07-01T06:30:00")).toBe("2024-07-01T06:30:00");
  });
});

describe("create_planned_workout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults to today, WORKOUT category, AUTO target and outdoor", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createPlannedWorkout({});

    expect(client.post).toHaveBeenCalledWith("/athlete/0/events", {
      category: "WORKOUT",
      start_date_local: "2024-06-30T00:00:00",
      target: "AUTO",
      indoor: false,
    });
  });

  it("maps all fields to the API body", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createPlannedWorkout({
      startDateLocal: "2024-07-02",
      name: "Sweet Spot",
      type: "Ride",
      description: "- 10m 55%\n3x\n- 10m 90%\n- 5m 55%",
      movingTime: 3600,
      distance: 30000,
      target: "POWER",
      indoor: true,
    });

    expect(client.post).toHaveBeenCalledWith("/athlete/0/events", {
      category: "WORKOUT",
      start_date_local: "2024-07-02T00:00:00",
      name: "Sweet Spot",
      type: "Ride",
      description: "- 10m 55%\n3x\n- 10m 90%\n- 5m 55%",
      moving_time: 3600,
      distance: 30000,
      target: "POWER",
      indoor: true,
    });
  });

  it("uses the given athlete ID instead of the configured one", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createPlannedWorkout({ athleteId: "i999" });

    expect(client.post).toHaveBeenCalledWith("/athlete/i999/events", expect.any(Object));
  });

  it("returns the created event as JSON text", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 42, name: "Sweet Spot" });

    const result = await createPlannedWorkout({ name: "Sweet Spot" });

    expect(JSON.parse(result.content[0].text)).toEqual({ id: 42, name: "Sweet Spot" });
  });
});

describe("update_planned_workout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends only the provided fields", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 42 });

    await updatePlannedWorkout({ eventId: 42, name: "New name", startDateLocal: "2024-07-03" });

    expect(client.put).toHaveBeenCalledWith("/athlete/0/events/42", {
      name: "New name",
      start_date_local: "2024-07-03T00:00:00",
    });
  });

  it("uses the given athlete ID", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 42 });

    await updatePlannedWorkout({ eventId: 42, athleteId: "i999", indoor: true });

    expect(client.put).toHaveBeenCalledWith("/athlete/i999/events/42", { indoor: true });
  });
});

describe("delete_planned_workout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls DELETE /athlete/0/events/{eventId}", async () => {
    vi.mocked(client.del).mockResolvedValue({});

    await deletePlannedWorkout({ eventId: 42 });

    expect(client.del).toHaveBeenCalledWith("/athlete/0/events/42");
  });

  it("uses the given athlete ID", async () => {
    vi.mocked(client.del).mockResolvedValue({});

    await deletePlannedWorkout({ eventId: 42, athleteId: "i999" });

    expect(client.del).toHaveBeenCalledWith("/athlete/i999/events/42");
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.del).mockRejectedValue(new Error("Network error"));

    await expect(deletePlannedWorkout({ eventId: 42 })).rejects.toThrow("Network error");
  });
});
