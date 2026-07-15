import type { User } from "../../domain/user";
import type { BackendGateway, LocalStore } from "../ports";

export type LoadUserResult =
  | Readonly<{ kind: "connected"; user: User }>
  | Readonly<{ kind: "offline"; user: User }>
  | Readonly<{ kind: "reauthorization-required"; user: User }>
  | Readonly<{ kind: "disconnected" }>;

export type LoadUser = () => Promise<LoadUserResult>;

export function createLoadUser(store: LocalStore, backend: BackendGateway): LoadUser {
  return async () => {
    const local = await store.loadUser();
    try {
      const remote = await backend.session();
      if (remote.kind === "connected") {
        await store.reconcileUser(remote.user);
        const reconciled = await store.loadUser();
        if (reconciled.kind === "not-found") throw new Error("reconciled user was not stored");
        return { kind: "connected", user: reconciled.user };
      }
      return local.kind === "found"
        ? { kind: "reauthorization-required", user: local.user }
        : { kind: "disconnected" };
    } catch {
      return local.kind === "found"
        ? { kind: "offline", user: local.user }
        : { kind: "disconnected" };
    }
  };
}
