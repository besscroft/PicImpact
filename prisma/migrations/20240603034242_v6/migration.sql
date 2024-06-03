-- CreateTable
CREATE TABLE "Copyright" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "social_name" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "avatar_url" TEXT,
    "detail" TEXT,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "create_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "Copyright_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageCopyrightRelation" (
    "copyrightId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,

    CONSTRAINT "ImageCopyrightRelation_pkey" PRIMARY KEY ("copyrightId","imageId")
);

-- AddForeignKey
ALTER TABLE "ImageCopyrightRelation" ADD CONSTRAINT "ImageCopyrightRelation_copyrightId_fkey" FOREIGN KEY ("copyrightId") REFERENCES "Copyright"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageCopyrightRelation" ADD CONSTRAINT "ImageCopyrightRelation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
