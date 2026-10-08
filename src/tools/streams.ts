import { z } from "zod";
import { get, withErrorHandling } from "../client.js";
import { compactJsonResult } from "../utils.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type ActivityStream = {
  type: string;
  data?: unknown[] | null;
  data2?: unknown[] | null;
};

async function fetchStreams(activityId: string, types?: string[]): Promise<Record<string, unknown[]>> {
  const query: Record<string, unknown> = {};
  if (types?.length) query.types = types.join(",");

  const data = await get<ActivityStream[]>(`/activity/${activityId}/streams`, query);

  const streams: Record<string, unknown[]> = {};
  for (const stream of data ?? []) {
    if (!stream.data) continue;
    // Two-valued streams (e.g. latlng) carry the second value in data2 — merge into pairs
    streams[stream.type] = stream.data2
      ? stream.data.map((value, i) => [value, stream.data2?.[i] ?? null])
      : stream.data;
  }
  return streams;
}

export async function getActivityStreams(params: { activityId: string; types?: string[] }) {
  const streams = await fetchStreams(params.activityId, params.types);

  const availableStreams = Object.keys(streams);
  if (availableStreams.length === 0) {
    return compactJsonResult({
      activity_id: params.activityId,
      streams: {},
      available_streams: [],
      message: "No stream data available for this activity",
    });
  }

  const streamLengths = Object.fromEntries(
    availableStreams.map((type) => [type, streams[type].length])
  );

  return compactJsonResult({
    activity_id: params.activityId,
    available_streams: availableStreams,
    stream_lengths: streamLengths,
    streams,
  });
}

export async function getActivityStream(params: { activityId: string; type: string }) {
  const streams = await fetchStreams(params.activityId, [params.type]);
  const data = streams[params.type];

  if (!data) {
    return compactJsonResult({
      activity_id: params.activityId,
      type: params.type,
      data: [],
      message: `No ${params.type} stream available for this activity`,
    });
  }

  return compactJsonResult({
    activity_id: params.activityId,
    type: params.type,
    length: data.length,
    data,
  });
}

const activityIdSchema = z.string().describe("The activity ID (e.g. from list_activities).");

const DEDICATED_STREAMS = [
  { tool: "get_activity_time_stream", type: "time", label: "elapsed time in seconds for each sample — use it to align the other single-stream tools" },
  { tool: "get_activity_power_stream", type: "watts", label: "power in watts" },
  { tool: "get_activity_heartrate_stream", type: "heartrate", label: "heart rate in bpm" },
  { tool: "get_activity_cadence_stream", type: "cadence", label: "cadence (rpm for cycling, spm for running)" },
  { tool: "get_activity_speed_stream", type: "velocity_smooth", label: "smoothed speed in m/s" },
  { tool: "get_activity_altitude_stream", type: "altitude", label: "altitude in meters" },
  { tool: "get_activity_gps_stream", type: "latlng", label: "GPS position as [lat, lng] pairs" },
] as const;

export function registerStreamTools(server: McpServer) {
  server.registerTool(
    "get_activity_streams",
    {
      description:
        "Get the complete time-series data streams (one sample per recorded data point, usually per second) for an activity. " +
        "Common stream types: time, watts, heartrate, cadence, velocity_smooth, distance, altitude, latlng ([lat, lng] pairs), " +
        "temp, grade_smooth, moving, plus device-specific streams such as torque, respiration or running dynamics. " +
        "Full streams can be large — prefer the single-stream tools (e.g. get_activity_power_stream) or request only the types you need.",
      inputSchema: {
        activityId: activityIdSchema,
        types: z
          .array(z.string())
          .optional()
          .describe("Stream types to fetch (e.g. [\"watts\", \"heartrate\"]). Omit to fetch all available streams."),
      },
    },
    withErrorHandling(getActivityStreams)
  );

  for (const stream of DEDICATED_STREAMS) {
    server.registerTool(
      stream.tool,
      {
        description: `Get only the complete ${stream.type} stream of an activity: ${stream.label}, one value per sample.`,
        inputSchema: { activityId: activityIdSchema },
      },
      withErrorHandling((params: { activityId: string }) =>
        getActivityStream({ activityId: params.activityId, type: stream.type })
      )
    );
  }
}
