import type { FirstName, LastName, UserId } from "./identity";
import type { ProviderConnection } from "./provider-connection";

export type User = Readonly<{
  id: UserId;
  firstName: FirstName;
  lastName: LastName;
  connection: ProviderConnection;
}>;

export type CreateUserResult =
  | Readonly<{ kind: "created"; user: User }>
  | Readonly<{ kind: "invalid-user" }>;

export function createUser(input: {
  id: string;
  firstName: string;
  lastName: string;
  connection: ProviderConnection;
}): CreateUserResult {
  const id = input.id.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (id.length === 0 || firstName.length === 0 || lastName.length === 0) {
    return { kind: "invalid-user" };
  }
  return {
    kind: "created",
    user: {
      id: id as UserId,
      firstName: firstName as FirstName,
      lastName: lastName as LastName,
      connection: input.connection,
    },
  };
}

export function replaceProviderConnection(user: User, connection: ProviderConnection): User {
  return { ...user, connection };
}
