CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"album_value" text NOT NULL,
	"detail" text,
	"theme" text DEFAULT '0' NOT NULL,
	"show" smallint DEFAULT 1 NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	"random_show" smallint DEFAULT 1 NOT NULL,
	"license" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"del" smallint DEFAULT 0 NOT NULL,
	"image_sorting" smallint DEFAULT 1 NOT NULL,
	"daily_weight" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"config_key" varchar(200) NOT NULL,
	"config_value" text,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"image_name" text,
	"url" text,
	"preview_url" text,
	"video_url" text,
	"blurhash" text,
	"image_key" text,
	"variants_ready" boolean DEFAULT false NOT NULL,
	"ready_max_width" integer DEFAULT 0 NOT NULL,
	"exif" jsonb,
	"labels" jsonb,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"lon" text,
	"lat" text,
	"title" varchar(200),
	"detail" text,
	"type" smallint DEFAULT 1 NOT NULL,
	"show" smallint DEFAULT 1 NOT NULL,
	"show_on_mainpage" smallint DEFAULT 1 NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"del" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images_albums_relation" (
	"imageId" varchar(50) NOT NULL,
	"album_value" text NOT NULL,
	CONSTRAINT "images_albums_relation_imageId_album_value_pk" PRIMARY KEY("imageId","album_value")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "albums_album_value_idx" ON "albums" USING btree ("album_value");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images_albums_relation" ADD CONSTRAINT "images_albums_relation_imageId_images_id_fk" FOREIGN KEY ("imageId") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images_albums_relation" ADD CONSTRAINT "images_albums_relation_album_value_albums_album_value_fk" FOREIGN KEY ("album_value") REFERENCES "public"."albums"("album_value") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "configs_config_key_idx" ON "configs" USING btree ("config_key");--> statement-breakpoint
CREATE INDEX "images_variants_ready_del_idx" ON "images" USING btree ("variants_ready","del");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");