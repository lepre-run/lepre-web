import type { ConnectionId, ExternalAccountId } from "./identity";

export type ProviderId = "strava";

export type ProviderConnection = Readonly<{
  id: ConnectionId;
  provider: ProviderId;
  externalAccountId: ExternalAccountId;
}>;

export type CreateProviderConnectionResult =
  | Readonly<{ kind: "created"; connection: ProviderConnection }>
  | Readonly<{ kind: "invalid-connection" }>;

export function createProviderConnection(input: {
  id: string;
  provider: string;
  externalAccountId: string;
}): CreateProviderConnectionResult {
  const id = input.id.trim();
  const externalAccountId = input.externalAccountId.trim();
  if (id.length === 0 || input.provider !== "strava" || externalAccountId.length === 0) {
    return { kind: "invalid-connection" };
  }
  return {
    kind: "created",
    connection: {
      id: id as ConnectionId,
      provider: "strava",
      externalAccountId: externalAccountId as ExternalAccountId,
    },
  };
}
