-- CreateTable
CREATE TABLE "Images" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "url" TEXT,
    "exif" JSON,
    "rating" SMALLINT,
    "detail" TEXT,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configs" (
    "id" SERIAL NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT,
    "detail" TEXT,
    "create_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP,

    CONSTRAINT "Configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tag_value" TEXT NOT NULL,
    "detail" TEXT,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "create_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Configs_config_key_key" ON "Configs"("config_key");

-- CreateIndex
CREATE UNIQUE INDEX "Tags_tag_value_key" ON "Tags"("tag_value");
