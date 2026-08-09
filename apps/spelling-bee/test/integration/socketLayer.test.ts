import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { signAccessToken } from "../../src/http/jwt.ts";
import { buildStartedBee, createTestUser } from "../helpers/factories.ts";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(testPrisma);
});

afterAll(async () => {
  await server.close();
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

function connectClient(): ClientSocket {
  return ioClient(server.baseUrl, { transports: ["websocket"], forceNew: true });
}

function waitForEvent<T = unknown>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

async function joinAndWait(
  gamekey: string,
  token?: string,
): Promise<{ client: ClientSocket; role: string }> {
  const client = connectClient();
  const connected = waitForEvent<{ role: string }>(client, "client:connected");
  client.emit("join", token ? { gamekey, token } : { gamekey });
  const { role } = await connected;
  return { client, role };
}

describe("socket join", () => {
  it("joins as display when no token is provided", async () => {
    const bee = await buildStartedBee(testPrisma);

    const { client, role } = await joinAndWait(bee.gamekey!);
    expect(role).toBe("display");
    client.disconnect();
  });

  it("joins as host when a valid access token for the bee owner is provided", async () => {
    const bee = await buildStartedBee(testPrisma);

    const { client, role } = await joinAndWait(bee.gamekey!, signAccessToken(bee.userId));
    expect(role).toBe("host");
    client.disconnect();
  });

  it("falls back to display role for a token belonging to a different user", async () => {
    const otherUser = await createTestUser(testPrisma);
    const bee = await buildStartedBee(testPrisma);

    const { client, role } = await joinAndWait(bee.gamekey!, signAccessToken(otherUser.id));
    expect(role).toBe("display");
    client.disconnect();
  });

  it("emits join:error for an unknown gamekey", async () => {
    const client = connectClient();
    const errorPromise = waitForEvent<{ message: string }>(client, "join:error");
    client.emit("join", { gamekey: "BEE-NOPE99" });

    const payload = await errorPromise;
    expect(payload.message).toMatch(/no bee found/i);
    client.disconnect();
  });
});

describe("role-gated relay events", () => {
  it("relays typing:update from a host socket to the room, but ignores it from a display socket", async () => {
    const bee = await buildStartedBee(testPrisma);

    const { client: hostClient } = await joinAndWait(bee.gamekey!, signAccessToken(bee.userId));
    const { client: displayClient } = await joinAndWait(bee.gamekey!);

    const displayReceived = waitForEvent<{ currentSpelling: string }>(displayClient, "typing:update");
    hostClient.emit("typing:update", { currentSpelling: "ap" });
    expect((await displayReceived).currentSpelling).toBe("ap");

    let hostSawSpoofedEvent = false;
    hostClient.on("typing:update", () => {
      hostSawSpoofedEvent = true;
    });
    displayClient.emit("typing:update", { currentSpelling: "spoofed" });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(hostSawSpoofedEvent).toBe(false);

    hostClient.disconnect();
    displayClient.disconnect();
  });

  it("relays word:revealed only to the host room, never to display sockets", async () => {
    const bee = await buildStartedBee(testPrisma);

    const { client: hostClient } = await joinAndWait(bee.gamekey!, signAccessToken(bee.userId));
    const { client: secondHostClient } = await joinAndWait(bee.gamekey!, signAccessToken(bee.userId));
    const { client: displayClient } = await joinAndWait(bee.gamekey!);

    let displayReceivedWord = false;
    displayClient.on("word:revealed", () => {
      displayReceivedWord = true;
    });

    const secondHostReceived = waitForEvent<{ word: string }>(secondHostClient, "word:revealed");
    hostClient.emit("word:revealed", { word: "apple" });
    expect((await secondHostReceived).word).toBe("apple");

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(displayReceivedWord).toBe(false);

    hostClient.disconnect();
    secondHostClient.disconnect();
    displayClient.disconnect();
  });
});

describe("disconnect", () => {
  it("broadcasts client:disconnected to the rest of the room", async () => {
    const bee = await buildStartedBee(testPrisma);

    const { client: hostClient } = await joinAndWait(bee.gamekey!, signAccessToken(bee.userId));
    const { client: displayClient } = await joinAndWait(bee.gamekey!);

    const disconnected = waitForEvent<{ gamekey: string }>(displayClient, "client:disconnected");
    hostClient.disconnect();

    expect((await disconnected).gamekey).toBe(bee.gamekey);
    displayClient.disconnect();
  });
});
