import { z } from "zod";
import { post, put, del, athleteId as defaultAthleteId, withErrorHandling } from "../client.js";
import { isoDate, jsonResult } from "../utils.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const WORKOUT_TARGETS = ["AUTO", "POWER", "HR", "PACE"] as const;

type PlannedWorkoutFields = {
  startDateLocal?: string;
  name?: string;
  type?: string;
  description?: string;
  movingTime?: number;
  distance?: number;
  target?: (typeof WORKOUT_TARGETS)[number];
  indoor?: boolean;
};

// The events API expects a local date-time; accept a plain date for convenience
export function toLocalDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
}

function eventsPath(athleteId?: string) {
  return `/athlete/${athleteId ?? defaultAthleteId()}/events`;
}

function workoutBody(params: PlannedWorkoutFields): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.startDateLocal !== undefined) body.start_date_local = toLocalDateTime(params.startDateLocal);
  if (params.name !== undefined) body.name = params.name;
  if (params.type !== undefined) body.type = params.type;
  if (params.description !== undefined) body.description = params.description;
  if (params.movingTime !== undefined) body.moving_time = params.movingTime;
  if (params.distance !== undefined) body.distance = params.distance;
  if (params.target !== undefined) body.target = params.target;
  if (params.indoor !== undefined) body.indoor = params.indoor;
  return body;
}

export async function createPlannedWorkout(params: PlannedWorkoutFields & { athleteId?: string }) {
  const body = {
    ...workoutBody(params),
    category: "WORKOUT",
    start_date_local: toLocalDateTime(params.startDateLocal ?? isoDate(new Date())),
    target: params.target ?? "AUTO",
    indoor: params.indoor ?? false,
  };
  const data = await post(eventsPath(params.athleteId), body);
  return jsonResult(data);
}

export async function updatePlannedWorkout(params: PlannedWorkoutFields & { eventId: number; athleteId?: string }) {
  const data = await put(`${eventsPath(params.athleteId)}/${params.eventId}`, workoutBody(params));
  return jsonResult(data);
}

export async function deletePlannedWorkout(params: { eventId: number; athleteId?: string }) {
  const data = await del(`${eventsPath(params.athleteId)}/${params.eventId}`);
  return jsonResult(data ?? { deleted: params.eventId });
}

const athleteIdSchema = z
  .string()
  .optional()
  .describe("Athlete ID (e.g. i12345). Defaults to the configured athlete. Use when coaching another athlete.");

const DESCRIPTION_HELP =
  "Workout steps in intervals.icu workout-builder syntax, one step per line " +
  "(e.g. '- 10m 55%\\n3x\\n- 5m 95-105%\\n- 3m 55%\\n- 10m 50%'). intervals.icu parses this into a structured workout.";

export function registerPlannedWorkoutTools(server: McpServer) {
  server.registerTool(
    "create_planned_workout",
    {
      description:
        "Schedule a workout on an athlete's calendar for a given date. " +
        "Returns the created event, including its id (needed to update or delete it).",
      inputSchema: {
        athleteId: athleteIdSchema,
        startDateLocal: z
          .string()
          .optional()
          .describe("Date (YYYY-MM-DD) or local date-time (YYYY-MM-DDTHH:mm:ss). Defaults to today."),
        name: z.string().optional().describe("Workout title."),
        type: z.string().optional().describe("Sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe(DESCRIPTION_HELP),
        movingTime: z.number().int().positive().optional().describe("Planned duration in seconds."),
        distance: z.number().positive().optional().describe("Planned distance in meters."),
        target: z.enum(WORKOUT_TARGETS).default("AUTO").describe("Training target metric. Defaults to AUTO."),
        indoor: z.boolean().default(false).describe("Whether the workout is indoors."),
      },
    },
    withErrorHandling(createPlannedWorkout)
  );

  server.registerTool(
    "update_planned_workout",
    {
      description: "Update a planned workout on an athlete's calendar by event ID. Only the given fields are changed.",
      inputSchema: {
        athleteId: athleteIdSchema,
        eventId: z.number().int().describe("The calendar event ID of the planned workout."),
        startDateLocal: z
          .string()
          .optional()
          .describe("New date (YYYY-MM-DD) or local date-time (YYYY-MM-DDTHH:mm:ss)."),
        name: z.string().optional().describe("New workout title."),
        type: z.string().optional().describe("New sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe(DESCRIPTION_HELP),
        movingTime: z.number().int().positive().optional().describe("New planned duration in seconds."),
        distance: z.number().positive().optional().describe("New planned distance in meters."),
        target: z.enum(WORKOUT_TARGETS).optional().describe("New training target metric."),
        indoor: z.boolean().optional().describe("Whether the workout is indoors."),
      },
    },
    withErrorHandling(updatePlannedWorkout)
  );

  server.registerTool(
    "delete_planned_workout",
    {
      description: "Delete a planned workout from an athlete's calendar by event ID. This cannot be undone.",
      inputSchema: {
        athleteId: athleteIdSchema,
        eventId: z.number().int().describe("The calendar event ID of the planned workout to delete."),
      },
    },
    withErrorHandling(deletePlannedWorkout)
  );
}
