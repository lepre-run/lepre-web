import type { User } from "../domain/user";
import { mockUser } from "../mocks/fixtures";

export const readyScreen = {
  kind: "ready",
  user: mockUser as unknown as User,
  availability: "online",
} as const;
