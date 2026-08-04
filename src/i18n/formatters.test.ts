import { describe, expect, it } from "vitest";
import {
  formatClassification,
  formatDistance,
  formatHeartRate,
  formatHeartRateValue,
  formatLapRole,
  formatWorkoutDate,
} from "./formatters";
import { i18n } from "./i18n";

const intervalWorkout = {
  schemaVersion: 1,
  classifierVersion: 2,
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

const hillCircuitWorkout = {
  schemaVersion: 1,
  classifierVersion: 2,
  source: "inferred_from_strava_laps",
  confidence: 0.95,
  kind: "hill-circuit",
  repetitions: 2,
  coreLapIndexes: [2, 3, 4, 5, 6, 7, 8],
  lapRoles: {
    warmup: [1],
    work: [2, 4, 6, 8],
    recovery: [3, 5, 7],
    cooldown: [9],
    main: [],
    unknown: [],
  },
} as const;

describe("presentation formatters", () => {
  it("uses English by default", () => {
    expect(formatWorkoutDate("2026-07-15T06:00:00.000Z")).toBe("Jul 15, 2026");
    expect(formatDistance(8_000)).toBe("8.00 km");
    expect(formatHeartRate(148.2)).toBe("148 bpm");
    expect(formatHeartRate(null)).toBe("—");
    expect(formatHeartRateValue(148.2)).toBe("148");
    expect(formatHeartRateValue(null)).toBe("—");
    expect(formatClassification(intervalWorkout, i18n.t)).toBe(
      "4 × 1 km intervals with 400 m recovery",
    );
    expect(formatClassification(hillCircuitWorkout, i18n.t)).toBe("2-loop Lydiard hill circuit");
    expect(i18n.t("feed.storedCount", { count: 1 })).toBe("1 stored locally");
    expect(i18n.t("feed.storedCount", { count: 5 })).toBe("5 stored locally");
    expect(i18n.t("workout.averageHeartRateShort")).toBe("avg");
    expect(i18n.t("workout.maxHeartRateShort")).toBe("max");
    expect(i18n.t("workout.lapHeartRate", { average: "148", maximum: "176" })).toBe(
      "Heart rate: 148 bpm average, 176 bpm maximum",
    );
    expect(formatLapRole({ role: "work", progressiveStage: 3 }, i18n.t)).toBe("Lap 3");
  });

  it("can render the same presentation in Italian", () => {
    const t = i18n.getFixedT("it");
    expect(formatWorkoutDate("2026-07-15T06:00:00.000Z", "it")).toBe("15 lug 2026");
    expect(formatDistance(8_000, "it")).toBe("8,00 km");
    expect(formatClassification(intervalWorkout, t, "it")).toBe(
      "Ripetute: 4 × 1 km, recupero 400 m",
    );
    expect(formatClassification(hillCircuitWorkout, t, "it")).toBe(
      "Circuito estensivo di Lydiard da 2 giri",
    );
    expect(t("feed.storedCount", { count: 1 })).toBe("1 allenamento salvato in locale");
    expect(t("feed.storedCount", { count: 5 })).toBe("5 allenamenti salvati in locale");
    expect(t("workout.averageHeartRateShort")).toBe("media");
    expect(t("workout.maxHeartRateShort")).toBe("max");
    expect(t("workout.lapHeartRate", { average: "148", maximum: "176" })).toBe(
      "Frequenza cardiaca: media 148 bpm, massima 176 bpm",
    );
    expect(t("workout.sourceLapEvidence")).toBe("Dettaglio dei lap originali");
    expect(t("workout.lapCount", { count: 1 })).toBe("1 lap");
    expect(t("workout.lapCount", { count: 4 })).toBe("4 lap");
    expect(t("workout.lapNumber", { number: 2 })).toBe("Lap 2");
    expect(formatLapRole({ role: "work", progressiveStage: 3 }, t)).toBe("Lap 3");
    expect(formatLapRole({ role: "recovery" }, t)).toBe("Recupero");
  });
});
