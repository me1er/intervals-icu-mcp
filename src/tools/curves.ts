import { z } from "zod";
import { get, athleteId, withErrorHandling } from "../client.js";
import { isoDate, jsonResult } from "../utils.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function defaultDates() {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  return { today: isoDate(today), oneYearAgo: isoDate(oneYearAgo) };
}

const curveInputSchema = {
  oldest: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to 1 year ago."),
  newest: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to today."),
  type: z.string().optional().describe("Sport type filter (e.g. Ride, Run, Swim)."),
};

export async function getPowerCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/power-curves`, query);
  return jsonResult(data);
}

export async function getHrCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/hr-curves`, query);
  return jsonResult(data);
}

export async function getPaceCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/pace-curves`, query);
  return jsonResult(data);
}

export async function getActivityPowerCurve(params: {
  activityId: string;
  fatigue?: "kj0" | "kj1";
}) {
  const query: Record<string, unknown> = {};
  if (params.fatigue !== undefined) query.fatigue = params.fatigue;

  const data = await get(`/activity/${params.activityId}/power-curve`, query);
  return jsonResult(data);
}

export async function getActivityPowerCurves(params: {
  activityId: string;
  types?: string[];
  fatigue?: Array<"normal" | "kj0" | "kj1">;
}) {
  const query: Record<string, unknown> = {};
  if (params.types?.length) query.types = params.types.join(",");
  if (params.fatigue?.length) query.fatigue = params.fatigue.join(",");

  const data = await get(`/activity/${params.activityId}/power-curves`, query);
  return jsonResult(data);
}

export async function getActivityHrCurve(params: { activityId: string }) {
  const data = await get(`/activity/${params.activityId}/hr-curve`);
  return jsonResult(data);
}

export async function getActivityPaceCurve(params: { activityId: string; gap?: boolean }) {
  const query: Record<string, unknown> = {};
  if (params.gap !== undefined) query.gap = params.gap;

  const data = await get(`/activity/${params.activityId}/pace-curve`, query);
  return jsonResult(data);
}

export async function getActivityPowerVsHrCurve(params: { activityId: string }) {
  const data = await get(`/activity/${params.activityId}/power-vs-hr`);
  return jsonResult(data);
}

const activityIdSchema = z.string().describe("The activity ID (e.g. from list_activities).");

export function registerCurveTools(server: McpServer) {
  server.registerTool(
    "get_power_curves",
    {
      description:
        "Get the power-duration curve (MMP) for the athlete. Returns best average power in watts for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    withErrorHandling(getPowerCurves)
  );

  server.registerTool(
    "get_hr_curves",
    {
      description:
        "Get the heart rate-duration curve for the athlete. Returns best average HR in bpm for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    withErrorHandling(getHrCurves)
  );

  server.registerTool(
    "get_pace_curves",
    {
      description:
        "Get the pace-duration curve for the athlete. Returns best average pace for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    withErrorHandling(getPaceCurves)
  );

  server.registerTool(
    "get_activity_power_curve",
    {
      description:
        "Get the power-duration curve of a single activity: best average power (secs/values, plus watts_per_kg) for each duration, " +
        "with start_index/end_index locating each effort in the activity streams. Also includes estimates like vo2max_5m.",
      inputSchema: {
        activityId: activityIdSchema,
        fatigue: z
          .enum(["kj0", "kj1"])
          .optional()
          .describe("Return the curve after the athlete's predefined fatigue level (work done in kJ) instead of the fresh curve."),
      },
    },
    withErrorHandling(getActivityPowerCurve)
  );

  server.registerTool(
    "get_activity_power_curves",
    {
      description:
        "Get power-duration curves of a single activity for one or more power streams (e.g. watts, fixed_watts or custom streams) " +
        "and/or fatigue levels in one call. Returns a list of curves.",
      inputSchema: {
        activityId: activityIdSchema,
        types: z
          .array(z.string())
          .optional()
          .describe("Streams to build curves for (e.g. [\"watts\", \"fixed_watts\"]). Defaults to watts."),
        fatigue: z
          .array(z.enum(["normal", "kj0", "kj1"]))
          .optional()
          .describe("Fresh (normal) and/or fatigued (kj0, kj1) curves to return. Defaults to normal."),
      },
    },
    withErrorHandling(getActivityPowerCurves)
  );

  server.registerTool(
    "get_activity_hr_curve",
    {
      description:
        "Get the heart rate-duration curve of a single activity: best average HR in bpm (secs/values) for each duration, " +
        "with start_index/end_index locating each effort in the activity streams.",
      inputSchema: { activityId: activityIdSchema },
    },
    withErrorHandling(getActivityHrCurve)
  );

  server.registerTool(
    "get_activity_pace_curve",
    {
      description:
        "Get the pace-distance curve of a single activity: fastest time in seconds (values) for each distance in meters (distance), " +
        "with start_index/end_index locating each effort in the activity streams.",
      inputSchema: {
        activityId: activityIdSchema,
        gap: z.boolean().optional().describe("Use grade adjusted pace (GAP) instead of actual pace. Defaults to false."),
      },
    },
    withErrorHandling(getActivityPaceCurve)
  );

  server.registerTool(
    "get_activity_power_vs_hr_curve",
    {
      description:
        "Get the power vs heart rate relationship of a single activity, used to judge aerobic decoupling (cardiac drift). " +
        "Returns the power/HR ratio for the whole activity (powerHr) and its first and second half (powerHrFirst, powerHrSecond), " +
        "decoupling in percent, the detected HR lag in seconds, warmup/cooldown excluded from the analysis, " +
        "per-bucket averages of watts, hr and cadence (series, bucketSize seconds each) and fitted curves (coefficients, r2).",
      inputSchema: { activityId: activityIdSchema },
    },
    withErrorHandling(getActivityPowerVsHrCurve)
  );
}
