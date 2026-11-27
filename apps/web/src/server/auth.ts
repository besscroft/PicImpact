import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { sql } from "drizzle-orm";

import type { Database } from "./db";
import { schema, user } from "./db/schema";

type AuthDatabase = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export function createAuth(
  db: Database,
  options: {
    secret?: string;
    baseURL?: string;
  } = {},
) {
  const authOptions = {
    baseURL: options.baseURL,
    secret: options.secret,
    advanced: {
      cookiePrefix: "pic-impact",
    },
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  };
  const buildAuth = (database: AuthDatabase) =>
    betterAuth({
      ...authOptions,
      database: drizzleAdapter(database, { provider: "pg", schema, transaction: true }),
    });
  const auth = buildAuth(db);
  const isRegistrationOpen = async (database: AuthDatabase = db) => {
    const users = await database.select({ id: user.id }).from(user).limit(1);
    return users.length === 0;
  };

  return {
    api: { getSession: auth.api.getSession },
    isRegistrationOpen: () => isRegistrationOpen(),
    handler: async (request: Request) => {
      const path = new URL(request.url).pathname.replace(/\/+$/, "");
      if (request.method !== "POST" || !path.endsWith("/sign-up/email")) {
        return auth.handler(request);
      }

      return db.transaction(async (transaction) => {
        await transaction.execute(sql`LOCK TABLE ${user} IN SHARE ROW EXCLUSIVE MODE`);
        if (!(await isRegistrationOpen(transaction))) {
          return Response.json(
            {
              code: "REGISTRATION_CLOSED",
              message: "管理员账号已创建，注册已关闭，请登录。",
            },
            { status: 403 },
          );
        }
        return buildAuth(transaction).handler(request);
      });
    },
  };
}
