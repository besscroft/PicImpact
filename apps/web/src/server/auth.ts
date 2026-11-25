import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import type { Database } from "./db";

export function createAuth(
  db: Database,
  options: {
    secret?: string;
    baseURL?: string;
  } = {},
) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
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
  });
}
