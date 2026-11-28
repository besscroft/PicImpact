import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const images = pgTable(
  "images",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    image_name: text("image_name"),
    url: text("url"),
    preview_url: text("preview_url"),
    video_url: text("video_url"),
    blurhash: text("blurhash"),
    image_key: text("image_key"),
    variants_ready: boolean("variants_ready").notNull().default(false),
    ready_max_width: integer("ready_max_width").notNull().default(0),
    exif: jsonb("exif"),
    labels: jsonb("labels"),
    width: integer("width").notNull().default(0),
    height: integer("height").notNull().default(0),
    lon: text("lon"),
    lat: text("lat"),
    title: varchar("title", { length: 200 }),
    detail: text("detail"),
    type: smallint("type").notNull().default(1),
    show: smallint("show").notNull().default(1),
    show_on_mainpage: smallint("show_on_mainpage").notNull().default(1),
    sort: smallint("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }),
    del: smallint("del").notNull().default(0),
  },
  (table) => ({
    variantsReadyDelIdx: index("images_variants_ready_del_idx").on(table.variants_ready, table.del),
  }),
);

export const configs = pgTable(
  "configs",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    config_key: varchar("config_key", { length: 200 }).notNull(),
    config_value: text("config_value"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }),
  },
  (table) => ({
    configKeyIdx: uniqueIndex("configs_config_key_idx").on(table.config_key),
  }),
);

export const albums = pgTable(
  "albums",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    album_value: text("album_value").notNull(),
    detail: text("detail"),
    theme: text("theme").notNull().default("0"),
    show: smallint("show").notNull().default(1),
    sort: smallint("sort").notNull().default(0),
    random_show: smallint("random_show").notNull().default(1),
    license: text("license"),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }),
    del: smallint("del").notNull().default(0),
    image_sorting: smallint("image_sorting").notNull().default(1),
    daily_weight: smallint("daily_weight").notNull().default(0),
  },
  (table) => ({
    albumValueIdx: uniqueIndex("albums_album_value_idx").on(table.album_value),
  }),
);

export const imagesAlbumsRelation = pgTable(
  "images_albums_relation",
  {
    imageId: varchar("imageId", { length: 50 })
      .notNull()
      .references(() => images.id),
    album_value: text("album_value")
      .notNull()
      .references(() => albums.album_value),
  },
  (table) => ({
    relationPk: primaryKey({ columns: [table.imageId, table.album_value] }),
  }),
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    username: text("username"),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    // better-auth twoFactor 插件在 user 上的标记字段（1.7.x 插件 schema，default false）
    twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
    usernameIdx: uniqueIndex("user_username_idx").on(table.username),
  }),
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userIdx: index("session_user_id_idx").on(table.userId),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("account_user_id_idx").on(table.userId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);

// better-auth twoFactor 插件表，字段对齐 better-auth 1.7.x 插件 schema：
// secret/backupCodes/userId + verified、failedVerificationCount、lockedUntil（账户锁定）
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failedVerificationCount").default(0),
    lockedUntil: timestamp("lockedUntil"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    secretIdx: index("two_factor_secret_idx").on(table.secret),
    userIdx: index("two_factor_user_id_idx").on(table.userId),
  }),
);

// @better-auth/passkey 1.7.x 插件表：credentialID 唯一定位凭据，aaguid 标记认证器型号
export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("publicKey").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credentialID").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("deviceType").notNull(),
    backedUp: boolean("backedUp").notNull(),
    transports: text("transports"),
    createdAt: timestamp("createdAt"),
    aaguid: text("aaguid"),
  },
  (table) => ({
    userIdx: index("passkey_user_id_idx").on(table.userId),
    credentialIdx: index("passkey_credential_id_idx").on(table.credentialID),
  }),
);

export const schema = {
  images,
  configs,
  albums,
  imagesAlbumsRelation,
  user,
  session,
  account,
  verification,
  twoFactor,
  passkey,
};
