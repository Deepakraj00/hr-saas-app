"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!pusherClient) {
    pusherClient = new PusherClient(key, { cluster });
  }
  return pusherClient;
}

// Re-export channel/event constants for client use
export const CHANNELS = {
  CANDIDATES: "candidates",
  INTERVIEWS: "interviews",
  DASHBOARD: "dashboard",
} as const;

export const EVENTS = {
  CANDIDATE_ADDED: "candidate:added",
  CANDIDATE_UPDATED: "candidate:updated",
  CANDIDATE_DELETED: "candidate:deleted",
  INTERVIEW_ADDED: "interview:added",
  INTERVIEW_UPDATED: "interview:updated",
  STATS_UPDATED: "stats:updated",
} as const;
