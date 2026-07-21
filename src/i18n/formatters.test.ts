import { describe, expect, it } from "vitest";
import { formatClassification, formatDistance, formatWorkoutDate } from "./formatters";
import { i18n } from "./i18n";

const intervalWorkout = {
  schemaVersion: 1,
  classifierVersion: 1,
  source: "inferred_from_strava_laps",
  confidence: 0.94,
  kind: "intervals",
  repetitions: 4,
  work: { kind: "distance", meters: 1_000 },
  recovery: { kind: "distance", meters: 400 },
  coreLapIndexes: [1, 2, 3, 4, 5, 6, 7],
  lapRoles: {
    warmup: [],
    work: [1, 3, 5, 7],
    recovery: [2, 4, 6],
    cooldown: [],
    main: [],
    unknown: [],
  },
} as const;

describe("presentation formatters", () => {
  it("uses English by default", () => {
    expect(formatWorkoutDate("2026-07-15T06:00:00.000Z")).toBe("Jul 15, 2026");
    expect(formatDistance(8_000)).toBe("8.00 km");
    expect(formatClassification(intervalWorkout, i18n.t)).toBe(
      "4 × 1 km intervals with 400 m recovery",
    );
    expect(i18n.t("feed.storedCount", { count: 1 })).toBe("1 stored locally");
    expect(i18n.t("feed.storedCount", { count: 5 })).toBe("5 stored locally");
  });

  it("can render the same presentation in Italian", () => {
    const t = i18n.getFixedT("it");
    expect(formatWorkoutDate("2026-07-15T06:00:00.000Z", "it")).toBe("15 lug 2026");
    expect(formatDistance(8_000, "it")).toBe("8,00 km");
    expect(formatClassification(intervalWorkout, t, "it")).toBe(
      "Ripetute: 4 × 1 km, recupero 400 m",
    );
    expect(t("feed.storedCount", { count: 1 })).toBe("1 allenamento salvato in locale");
    expect(t("feed.storedCount", { count: 5 })).toBe("5 allenamenti salvati in locale");
  });
});
