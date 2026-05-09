// Server-side Pusher instance for real-time collaboration
// To enable real-time features, set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER in .env
// For now we use a mock that no-ops if keys are missing

class MockPusher {
  async trigger(_channel: string, _event: string, _data: unknown) {
    // No-op in development without Pusher keys
    console.log("[Pusher Mock] Event triggered:", _channel, _event);
  }
}

let pusherServer: { trigger: (channel: string, event: string, data: unknown) => Promise<unknown> };

if (
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
) {
  // Dynamic import to avoid issues when pusher is not configured
  const Pusher = require("pusher");
  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
} else {
  pusherServer = new MockPusher();
}

export { pusherServer };

// Channel and event constants
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
