export const english = {
  home: {
    opening: "Opening your local workouts…",
    heroTitle: "Train with direction.",
    heroDescription: "See the structure inside every run, not just its average.",
    connectStrava: "Connect with Strava",
  },
  actions: {
    sync: "Sync",
    syncing: "Syncing…",
    paused: "Paused",
    download: "Download",
    disconnect: "Disconnect",
  },
  notices: {
    reconnectError: "Reconnect Strava to synchronize workouts.",
    synchronizationError: "Could not synchronize workouts right now.",
    rateLimited_one:
      "Strava’s request limit was reached. Import paused and will resume automatically in about {{count}} minute.",
    rateLimited_other:
      "Strava’s request limit was reached. Import paused and will resume automatically in about {{count}} minutes.",
    disconnectError: "Could not disconnect Strava.",
    offline: "You are offline. Showing workouts stored on this device.",
    reauthorization: "Reconnect Strava to synchronize. Local workouts remain available.",
  },
  feed: {
    eyebrow: "Workout feed",
    title: "Your training, stage by stage.",
    storedCount_one: "{{count}} stored locally",
    storedCount_other: "{{count}} stored locally",
    importing: "Importing your recent runs…",
    emptyTitle: "No runs found",
    emptyDescription: "Completed workouts will appear here after their laps have been classified.",
  },
  workout: {
    date: "Date",
    distance: "Distance",
    lapStructure: "Lap structure",
    moving: "moving",
    noLaps: "Strava did not provide lap data for this run.",
  },
  download: {
    eyebrow: "Portable history",
    title: "Download workout history",
    description: "Choose a date range and download an LLM-ready JSON file.",
    from: "From",
    to: "To",
    workoutCount_one: "{{count}} workout will be included",
    workoutCount_other: "{{count}} workouts will be included",
    downloadJson: "Download JSON",
    cancel: "Cancel",
  },
  classification: {
    intervals: "{{repetitions}} × {{work}} intervals with {{recovery}} recovery",
    progressive: "{{stageCount}}-stage progressive run",
    tempo: "{{distance}} tempo",
    repeatedHills: "{{repetitions}} repeated hills with jog recovery",
    steadyStructuredRun: "Steady structured run",
    freeRun: "Free run",
    unknown: "Unknown workout",
  },
  connectFailed: {
    title: "Connect failed",
    tryAgain: "Try again",
    reference: "ref: {{id}}",
    reasons: {
      userDenied: "You declined the Strava authorization.",
      stateInvalid: "The link expired or didn't match. Please try again.",
      missingCode: "Strava didn't return an authorization code.",
      stravaExchangeFailed: "We couldn't reach Strava. Please try again.",
      stravaNotConfigured: "The Strava connection is not configured yet.",
      scopeInsufficient: "We need all three permissions to connect your account.",
      databaseFailure: "Something went wrong on our side. Please try again.",
      unknown: "Something went wrong. Please try again.",
    },
  },
} as const;

type WidenCatalog<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : WidenCatalog<T[Key]>;
};

export type TranslationCatalog = WidenCatalog<typeof english>;
