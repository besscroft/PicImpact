import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import worker from "../src/server/worker";

const { createClient, connect, end, query } = vi.hoisted(() => ({
  createClient: vi.fn<(options: { connectionString: string }) => void>(),
  connect: vi.fn<() => Promise<void>>(),
  end: vi.fn<() => Promise<void>>(),
  query: vi.fn<() => Promise<{ rows: unknown[] }>>(),
}));

vi.mock("pg", () => ({
  Client: class {
    constructor(options: { connectionString: string }) {
      createClient(options);
    }
    connect = connect;
    end = end;
    query = query;
    on() {}
  },
  Pool: class {},
}));

const env = {
  HYPERDRIVE: { connectionString: "postgresql://test:sample@database.example:5432/picimpact" },
  BETTER_AUTH_URL: "https://photos.example",
  BETTER_AUTH_SECRET: "test-secret-not-used-in-production-1234",
};

const directEnv = {
  DATABASE_URL: "postgresql://test:sample@direct.example:5432/picimpact",
  BETTER_AUTH_URL: "https://photos.example",
  BETTER_AUTH_SECRET: "test-secret-not-used-in-production-1234",
};

function createContext() {
  const pending: Promise<unknown>[] = [];
  return {
    pending,
    context: {
      waitUntil(promise: Promise<unknown>) {
        pending.push(promise);
      },
    } as ExecutionContext,
  };
}

describe("Worker PostgreSQL", () => {
  beforeEach(() => {
    createClient.mockClear();
    connect.mockReset().mockResolvedValue(undefined);
    end.mockReset().mockResolvedValue(undefined);
    query.mockReset().mockResolvedValue({ rows: [] });
  });

  it("serves a database-backed endpoint through Hyperdrive and closes the client", async () => {
    const { context, pending } = createContext();
    const request = new Request("https://photos.example/api/public/albums");

    const response = await worker.fetch(request, env, context);
    await Promise.all(pending);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining(env.HYPERDRIVE));
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("returns a service-unavailable response when Hyperdrive is not configured", async () => {
    const { context } = createContext();
    const response = await worker.fetch(
      new Request("https://photos.example/api/health"),
      {},
      context,
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 503 });
    expect(connect).not.toHaveBeenCalled();
  });

  it("connects directly with DATABASE_URL when Hyperdrive is not configured", async () => {
    const { context, pending } = createContext();
    const response = await worker.fetch(
      new Request("https://photos.example/api/public/albums"),
      directEnv,
      context,
    );
    await Promise.all(pending);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: directEnv.DATABASE_URL }),
    );
    expect(connect).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("returns 503 and closes the client when the database cannot be reached", async () => {
    connect.mockRejectedValueOnce({ code: "ECONNREFUSED" });
    const { context, pending } = createContext();
    const response = await worker.fetch(
      new Request("https://photos.example/api/health"),
      env,
      context,
    );
    await Promise.all(pending);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: 503, message: "PostgreSQL is unavailable" });
    expect(query).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
  });
});
