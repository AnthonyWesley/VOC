import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server as HttpServer } from "http";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import jwt from "jsonwebtoken";
import { SocketServer } from "../../SocketServer";

const PORT = 9876;
const JWT_SECRET = "test-secret-for-socket-tests";

function makeToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

describe("SocketServer — presence and rooms", () => {
  let httpServer: HttpServer;
  let socketServer: SocketServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    httpServer = createServer();
    socketServer = new SocketServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(PORT, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    delete process.env.JWT_SECRET;
  });

  function connectClient(userId: string): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${PORT}`, {
        path: "/socket.io/",
        transports: ["websocket"],
        auth: { token: makeToken(userId) },
      });
      client.on("connect", () => resolve(client));
      client.on("connect_error", reject);
    });
  }

  function connectUnauthenticated(): Promise<ClientSocket> {
    return new Promise((resolve) => {
      const client = Client(`http://localhost:${PORT}`, {
        path: "/socket.io/",
        transports: ["websocket"],
      });
      client.on("connect_error", () => resolve(client));
      client.connect();
    });
  }

  it("unauthenticated connection is rejected", async () => {
    const client = await connectUnauthenticated();
    expect(client.connected).toBe(false);
    client.close();
  });

  it("two tabs of same user both join and stay online", async () => {
    const tab1 = await connectClient("user-multi");
    const tab2 = await connectClient("user-multi");

    expect(tab1.connected).toBe(true);
    expect(tab2.connected).toBe(true);
    expect(socketServer.isUserOnline("user-multi")).toBe(true);
    expect(socketServer.getOnlineUserCount()).toBeGreaterThanOrEqual(1);

    tab1.close();
    // still online because tab2 is connected
    await new Promise((r) => setTimeout(r, 100));
    expect(socketServer.isUserOnline("user-multi")).toBe(true);

    tab2.close();
    await new Promise((r) => setTimeout(r, 100));
    expect(socketServer.isUserOnline("user-multi")).toBe(false);
  });

  it("disconnecting last tab removes user", async () => {
    const client = await connectClient("user-single");
    expect(socketServer.isUserOnline("user-single")).toBe(true);

    client.close();
    await new Promise((r) => setTimeout(r, 100));
    expect(socketServer.isUserOnline("user-single")).toBe(false);
  });

  it("user A does not receive event emitted to user B", async () => {
    const receivedByA: string[] = [];
    const receivedByB: string[] = [];

    const clientA = await connectClient("user-a");
    const clientB = await connectClient("user-b");

    clientA.on("test-event", () => receivedByA.push("got-it"));
    clientB.on("test-event", () => receivedByB.push("got-it"));

    socketServer.emitToUser("user-b", "test-event", { msg: "for B only" });

    await new Promise((r) => setTimeout(r, 100));

    expect(receivedByA).toHaveLength(0);
    expect(receivedByB).toHaveLength(1);

    clientA.close();
    clientB.close();
  });

  it("broadcast emit reaches all connected users", async () => {
    const received: string[] = [];

    const clientA = await connectClient("user-bc-a");
    const clientB = await connectClient("user-bc-b");

    clientA.on("broadcast", () => received.push("a"));
    clientB.on("broadcast", () => received.push("b"));

    socketServer.emit("broadcast", { msg: "all" });

    await new Promise((r) => setTimeout(r, 100));

    expect(received).toContain("a");
    expect(received).toContain("b");

    clientA.close();
    clientB.close();
  });
});
