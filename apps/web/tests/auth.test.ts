import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
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

  function createTestApp(database = pool) {
    return createApp({
      store: new MemoryPicImpactStore(),
      auth: createAuth(createPostgresDb(database), authOptions),
    });
  }

  function signUp(
    app: ReturnType<typeof createTestApp>,
    username = "administrator",
    password = "test-password-1234",
  ) {
    return app.request("http://localhost/api/auth/sign-up/username", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ username, password }),
    });
  }

  async function session(app: ReturnType<typeof createTestApp>) {
    const response = await app.request("http://localhost/api/session");
    expect(response.headers.get("cache-control")).toContain("no-store");
    return response.json();
  }

  const migrations = readMigrationFiles({
    migrationsFolder: fileURLToPath(new URL("../drizzle/", import.meta.url)),
  });

  async function applyMigration(
    database: Pool,
    name: string,
    migration: (typeof migrations)[number],
  ) {
    for (const statement of migration.sql) {
      await database.query(statement.replaceAll('"public".', `"${name}".`));
    }
  }

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({ connectionString: databaseUrl, options: `-c search_path=${schemaName}` });
    for (const migration of migrations) await applyMigration(pool, schemaName, migration);
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
    const createdUser = await pool.query('SELECT username FROM "user"');
    expect(createdUser.rows).toEqual([{ username: "administrator" }]);
    expect(await session(app)).toMatchObject({ authenticated: false, registrationOpen: false });
  });

  it("rejects additional registrations and still allows the administrator to sign in", async () => {
    const app = createTestApp();
    expect((await signUp(app)).status).toBe(200);

    const response = await signUp(app, "another_admin");
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "REGISTRATION_CLOSED" });
    const restarted = createTestApp();
    expect(await session(restarted)).toMatchObject({ registrationOpen: false });
    expect((await signUp(restarted, "third_admin")).status).toBe(403);

    const login = await restarted.request("http://localhost/api/auth/sign-in/username", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ username: "Administrator", password: "test-password-1234" }),
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
      signUp(createTestApp(), "first_admin"),
      signUp(createTestApp(), "second_admin"),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 403]);
    const users = await pool.query('SELECT count(*)::int AS count FROM "user"');
    expect(users.rows).toEqual([{ count: 1 }]);
  });

  it("keeps registration open after an invalid submission", async () => {
    const app = createTestApp();
    expect((await signUp(app, "administrator", "short")).status).toBe(400);
    expect((await signUp(app, "")).status).toBe(400);
    expect(await session(app)).toMatchObject({ registrationOpen: true });
    expect((await signUp(app, "New..Admin")).status).toBe(200);
  });

  it("does not expose email-based registration", async () => {
    const app = createTestApp();
    const response = await app.request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: "Administrator",
        email: "legacy@example.test",
        password: "test-password-1234",
      }),
    });
    expect(response.status).toBe(404);
    expect(await session(app)).toMatchObject({ registrationOpen: true });
  });

  it("migrates existing accounts to distinct usernames and keeps their passwords", async () => {
    const legacySchema = `${schemaName}_legacy`;
    await adminPool.query(`CREATE SCHEMA "${legacySchema}"`);
    const legacyPool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${legacySchema}`,
    });
    try {
      await applyMigration(legacyPool, legacySchema, migrations[0]);
      await legacyPool.query(`
        INSERT INTO "user" (id, name, email) VALUES
          ('1', 'Legacy', 'legacy@example.test'),
          ('2', 'First', 'shared@example.test'),
          ('3', 'Second', 'shared@example.org'),
          ('4', 'Third', 'shared_2@example.test');
      `);
      await legacyPool.query(
        `INSERT INTO "account" (id, "accountId", "providerId", "userId", password)
         VALUES ('credential-1', '1', 'credential', '1', $1)`,
        [await hashPassword("test-password-1234")],
      );
      for (const migration of migrations.slice(1)) {
        await applyMigration(legacyPool, legacySchema, migration);
      }
      const users = await legacyPool.query('SELECT username FROM "user"');
      expect(new Set(users.rows.map(({ username }) => username)).size).toBe(4);

      const app = createTestApp(legacyPool);
      const post = (method: string, body: Record<string, string>) =>
        app.request(`http://localhost/api/auth/sign-in/${method}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "http://localhost" },
          body: JSON.stringify({ ...body, password: "test-password-1234" }),
        });
      expect((await post("username", { username: "legacy" })).status).toBe(200);
      expect((await post("email", { email: "legacy@example.test" })).status).toBe(404);
      expect(await session(app)).toMatchObject({ registrationOpen: false });
    } finally {
      await legacyPool.end();
      await adminPool.query(`DROP SCHEMA "${legacySchema}" CASCADE`);
    }
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
