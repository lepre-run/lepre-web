import { describe, expect, it } from "vitest";
import { retryAfterSeconds } from "./retry-after";

describe("retryAfterSeconds", () => {
  it("uses the Retry-After header when the response body is malformed", async () => {
    const response = new Response("not JSON", {
      headers: { "Retry-After": "12" },
    });

    await expect(retryAfterSeconds(response, 30)).resolves.toBe(12);
  });
});
