import type { Workout } from "../../domain/workout";
import type { LocalStore } from "../ports";

type ListWorkoutsResult =
  | Readonly<{ kind: "loaded"; workouts: ReadonlyArray<Workout> }>
  | Readonly<{ kind: "storage-unavailable" }>;

export type ListWorkouts = () => Promise<ListWorkoutsResult>;

export function createListWorkouts(store: LocalStore): ListWorkouts {
  return async () => {
    try {
      return { kind: "loaded", workouts: await store.listWorkouts() };
    } catch {
      return { kind: "storage-unavailable" };
    }
  };
}
