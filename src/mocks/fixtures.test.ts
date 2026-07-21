import { createWorkout } from "../domain/workout";
import { mockWorkouts } from "./fixtures";

describe("mock workout fixtures", () => {
  it("cover the workout classifications needed for feed development", () => {
    const classifications = mockWorkouts.map((fixture) => {
      const result = createWorkout(fixture);
      expect(result.kind).toBe("created");
      return result.kind === "created" ? result.workout.structure.kind : "invalid";
    });

    expect(classifications).toEqual(["intervals", "progressive", "tempo", "unknown", "free-run"]);
  });
});
