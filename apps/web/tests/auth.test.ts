import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { createApp } from "../src/server/app";
import { createAuth } from "../src/server/auth";
import { createPostgresDb } from "../src/server/db";
import { MemoryPicImpactStore } from "./helpers";

const databaseUrl = process.env.TEST_DATABASE_URL;
const schemaName = `auth_test_${randomUUID().replaceAll("-", "")}`;
const authOptions = {
  baseURL: "http://localhost",
  secret: "picimpact-auth-test-secret-for-isolated-database",
};

describe.skipIf(!databaseUrl)("first administrator registration", () => {
  let adminPool: Pool;
  let pool: Pool;

  function createTestApp() {
    return createApp({
      store: new MemoryPicImpactStore(),
      auth: createAuth(createPostgresDb(pool), authOptions),
    });
  }

  function signUp(
    app: ReturnType<typeof createTestApp>,
    email = "admin@example.test",
    password = "test-password-1234",
  ) {
    return app.request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ name: "Administrator", email, password }),
    });
  }

  async function session(app: ReturnType<typeof createTestApp>) {
    const response = await app.request("http://localhost/api/session");
    expect(response.headers.get("cache-control")).toContain("no-store");
    return response.json();
  }

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${schemaName}`,
    });
    const migration = readFileSync(
      new URL("../drizzle/0000_absent_chimera.sql", import.meta.url),
      "utf8",
    ).replaceAll('"public".', `"${schemaName}".`);
    await pool.query(migration);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE "user" CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await adminPool.end();
    }
  });

  it("opens registration only until the first account is created", async () => {
    const app = createTestApp();
    expect(await session(app)).toMatchObject({ authenticated: false, registrationOpen: true });

    const created = await signUp(app);
    expect(created.status).toBe(200);
    expect(created.headers.get("set-cookie")).toContain("pic-impact.session_token");
    expect(await session(app)).toMatchObject({ authenticated: false, registrationOpen: false });
  });

  it("rejects additional registrations and still allows the administrator to sign in", async () => {
    const app = createTestApp();
    expect((await signUp(app)).status).toBe(200);

    const response = await signUp(app, "another@example.test");
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "REGISTRATION_CLOSED" });
    const restarted = createTestApp();
    expect(await session(restarted)).toMatchObject({ registrationOpen: false });
    expect((await signUp(restarted, "third@example.test")).status).toBe(403);

    const login = await restarted.request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ email: "admin@example.test", password: "test-password-1234" }),
    });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const signedIn = await restarted.request("http://localhost/api/session", {
      headers: { Cookie: cookie },
    });
    expect(await signedIn.json()).toMatchObject({ authenticated: true, registrationOpen: false });
  });

  it("allows only one registration across concurrent application instances", async () => {
    const responses = await Promise.all([
      signUp(createTestApp(), "first@example.test"),
      signUp(createTestApp(), "second@example.test"),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 403]);
    const users = await pool.query('SELECT count(*)::int AS count FROM "user"');
    expect(users.rows).toEqual([{ count: 1 }]);
  });

  it("keeps registration open after an invalid submission", async () => {
    const app = createTestApp();
    expect((await signUp(app, "admin@example.test", "short")).status).toBe(400);
    expect(await session(app)).toMatchObject({ registrationOpen: true });
    expect((await signUp(app)).status).toBe(200);
  });

  it("rolls back the user when saving credentials fails so registration can be retried", async () => {
    await pool.query(`
      CREATE FUNCTION reject_test_account() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test credential failure'; END;
      $$;
      CREATE TRIGGER reject_test_account BEFORE INSERT ON account
      FOR EACH ROW EXECUTE FUNCTION reject_test_account();
    `);
    const app = createTestApp();
    try {
      expect((await signUp(app)).ok).toBe(false);
      expect(await session(app)).toMatchObject({ registrationOpen: true });
    } finally {
      await pool.query(
        "DROP TRIGGER reject_test_account ON account; DROP FUNCTION reject_test_account()",
      );
    }
    expect((await signUp(app)).status).toBe(200);
  });
});
