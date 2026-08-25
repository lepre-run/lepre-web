import type { BackendGateway, LocalStore } from "../ports";

type DisconnectProviderResult =
  | Readonly<{ kind: "disconnected" }>
  | Readonly<{ kind: "provider-unavailable" }>;

export type DisconnectProvider = () => Promise<DisconnectProviderResult>;

export function createDisconnectProvider(
  store: LocalStore,
  backend: BackendGateway,
): DisconnectProvider {
  return async () => {
    const result = await backend.disconnect();
    if (result === "unavailable") return { kind: "provider-unavailable" };
    await store.clear();
    return { kind: "disconnected" };
  };
}
