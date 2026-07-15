import { createDisconnectProvider } from "../application/use-cases/disconnect-provider";
import { createListWorkouts } from "../application/use-cases/list-workouts";
import { createLoadUser } from "../application/use-cases/load-user";
import { createSynchronizeWorkouts } from "../application/use-cases/synchronize-workouts";
import { lepreBackend } from "../infrastructure/api/lepre-backend";
import { indexedDbLocalStore } from "../infrastructure/indexeddb/local-store";

export const application = {
  loadUser: createLoadUser(indexedDbLocalStore, lepreBackend),
  listWorkouts: createListWorkouts(indexedDbLocalStore),
  synchronizeWorkouts: createSynchronizeWorkouts(indexedDbLocalStore, lepreBackend),
  disconnectProvider: createDisconnectProvider(indexedDbLocalStore, lepreBackend),
} as const;
