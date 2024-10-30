-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50),
    "username" VARCHAR(50),
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(200),
    "email_verified" TIMESTAMP,
    "image" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(50) NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "images" (
    "id" VARCHAR(50) NOT NULL,
    "url" TEXT,
    "preview_url" TEXT,
    "exif" JSON,
    "labels" JSON,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "lon" TEXT,
    "lat" TEXT,
    "title" VARCHAR(200),
    "detail" TEXT,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "id" VARCHAR(50) NOT NULL,
    "config_key" VARCHAR(200) NOT NULL,
    "config_value" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "album_value" TEXT NOT NULL,
    "detail" TEXT,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images_albums_relation" (
    "album_value" TEXT NOT NULL,
    "imageId" VARCHAR(50) NOT NULL,

    CONSTRAINT "images_albums_relation_pkey" PRIMARY KEY ("imageId","album_value")
);

-- CreateTable
CREATE TABLE "copyrights" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "social_name" VARCHAR(200),
    "type" VARCHAR(50) NOT NULL,
    "url" TEXT,
    "avatar_url" TEXT,
    "detail" TEXT,
    "default" SMALLINT NOT NULL DEFAULT 1,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "copyrights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images_copyright_relation" (
    "copyrightId" VARCHAR(50) NOT NULL,
    "imageId" VARCHAR(50) NOT NULL,

    CONSTRAINT "images_copyright_relation_pkey" PRIMARY KEY ("copyrightId","imageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "configs_config_key_key" ON "configs"("config_key");

-- CreateIndex
CREATE UNIQUE INDEX "albums_album_value_key" ON "albums"("album_value");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_albums_relation" ADD CONSTRAINT "images_albums_relation_album_value_fkey" FOREIGN KEY ("album_value") REFERENCES "albums"("album_value") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_albums_relation" ADD CONSTRAINT "images_albums_relation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_copyright_relation" ADD CONSTRAINT "images_copyright_relation_copyrightId_fkey" FOREIGN KEY ("copyrightId") REFERENCES "copyrights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images_copyright_relation" ADD CONSTRAINT "images_copyright_relation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
