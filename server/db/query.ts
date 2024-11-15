'use server'

import { db } from '~/server/lib/db'

export async function fetchS3Info() {
  const findConfig = await db.configs.findMany({
    where: {
      config_key: {
        in: [
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
          's3_cdn',
          's3_cdn_url'
        ]
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })

  return findConfig;
}

export async function fetchR2Info() {
  const findConfig = await db.configs.findMany({
    where: {
      config_key: {
        in: [
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_endpoint',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain'
        ]
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })

  return findConfig;
}

export async function fetchAListInfo() {
  const findConfig = await db.configs.findMany({
    where: {
      config_key: {
        in: [
          'alist_url',
          'alist_token'
        ]
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })

  return findConfig;
}

export async function fetchAlbumsList() {
  const findAll = await db.albums.findMany({
    where: {
      del: 0
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        createdAt: 'desc',
      },
      {
        updatedAt: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchAlbumsListAndNotDefault() {
  const findAll = await db.albums.findMany({
    where: {
      del: 0
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        createdAt: 'desc',
      },
      {
        updatedAt: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchServerImagesListByAlbum(pageNum: number, album: string) {
  if (album === 'all') {
    album = ''
  }
  if (pageNum < 1) {
    pageNum = 1
  }
  if (album && album !== '') {
    const findAll = await db.$queryRaw`
      SELECT 
          image.*,
          albums.name AS album_name,
          albums.id AS album_value,
          (
              SELECT json_agg(row_to_json(t))
              FROM (
                  SELECT copyright.id
                  FROM "public"."copyrights" AS copyright
                      INNER JOIN "public"."images_copyright_relation" AS icrelation
                          ON copyright.id = icrelation."copyrightId"
                      INNER JOIN "public"."images" AS image_child
                          ON icrelation."imageId" = image_child."id"
                  WHERE copyright.del = 0
                      AND image_child.del = 0
                      AND image.id = image_child.id
              ) t
          ) AS copyrights
      FROM 
          "public"."images" AS image
      INNER JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
      INNER JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
      WHERE
          image.del = 0
      AND
          albums.del = 0
      AND
          albums.album_value = ${album}
      ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
      LIMIT 8 OFFSET ${(pageNum - 1) * 8}
    `

    return findAll;
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.id
                FROM "public"."copyrights" AS copyright
                INNER JOIN "public"."images_copyright_relation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."images" AS image_child
                    ON icrelation."imageId" = image_child."id"
            WHERE copyright.del = 0
            AND image_child.del = 0
            AND image.id = image_child.id
            ) t
        ) AS copyrights
    FROM 
        "public"."images" AS image
    LEFT JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    LEFT JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE 
        image.del = 0
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC 
    LIMIT 8 OFFSET ${(pageNum - 1) * 8}
  `

  return findAll;
}

export async function fetchServerImagesPageTotalByAlbum(album: string) {
  if (album === 'all') {
    album = ''
  }
  if (album && album !== '') {
    const pageTotal = await db.$queryRaw`
      SELECT COALESCE(COUNT(1),0) AS total
      FROM (
        SELECT DISTINCT ON (image.id)
            image.id 
        FROM 
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE 
            image.del = 0
        AND
            albums.del = 0
        AND
            albums.album_value = ${album}
      ) AS unique_images;
    `
    // @ts-ignore
    return Number(pageTotal[0].total) ?? 0
  }
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
      SELECT DISTINCT ON (image.id)
          image.id
      FROM
          "public"."images" AS image
      LEFT JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
      LEFT JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
      WHERE
          image.del = 0
     ) AS unique_images;
  `
  // @ts-ignore
  // return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 8) : 0
  return Number(pageTotal[0].total) ?? 0
}

export async function fetchClientImagesListByAlbum(pageNum: number, album: string) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.*
                FROM "public"."copyrights" AS copyright
                INNER JOIN "public"."images_copyright_relation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."images" AS image_child
                    ON icrelation."imageId" = image_child."id"
                WHERE copyright.del = 0
                AND image_child.del = 0
                AND copyright.show = 0
                AND copyright.default = 1
                AND image.id = image_child.id
                UNION
                SELECT copyright.*
                FROM "public"."copyrights" AS copyright
                WHERE copyright.del = 0
                AND copyright.show = 0
                AND copyright.default = 0
            ) t
        ) AS copyrights
    FROM 
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE
        image.del = 0
    AND
        albums.del = 0
    AND
        image.show = 0
    AND
        albums.show = 0
    AND
        albums.album_value = ${album}
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `

  return findAll;
}

export async function fetchClientImagesPageTotalByAlbum(album: string) {
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            albums.album_value = ${album}
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

export async function fetchClientImagesListByTag(pageNum: number, tag: string) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.*
                FROM "public"."copyrights" AS copyright
                INNER JOIN "public"."images_copyright_relation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."images" AS image_child
                    ON icrelation."imageId" = image_child."id"
                WHERE copyright.del = 0
                AND image_child.del = 0
                AND copyright.show = 0
                AND image.id = image_child.id
            ) t
        ) AS copyrights
    FROM 
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE
        image.del = 0
    AND
        albums.del = 0
    AND
        image.show = 0
    AND
        albums.show = 0
    AND
        image.labels::jsonb @> ${JSON.stringify([tag])}::jsonb
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `
  return findAll;
}

export async function fetchClientImagesPageTotalByTag(tag: string) {
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            image.labels::jsonb @> ${JSON.stringify([tag])}::jsonb
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

export async function fetchAlbumsShow() {
  const findAll = await db.albums.findMany({
    where: {
      del: 0,
      show: 0
    },
    orderBy: [
      {
        sort: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchImagesAnalysis() {
  const total = await db.images.count({
    where: {
      del: 0
    },
  });

  const showTotal = await db.images.count({
    where: {
      del: 0,
      show: 0
    },
  })

  const crTotal = await db.copyright.count({
    where: {
      del: 0
    }
  })

  const tagsTotal = await db.albums.count({
    where: {
      del: 0
    },
  })

  const result = await db.$queryRaw`
    SELECT
        albums.name AS name,
        albums.album_value AS value,
        COALESCE(COUNT(1), 0) AS total,
        COALESCE(SUM(CASE WHEN image.show = 0 THEN 1 ELSE 0 END), 0) AS show_total
    FROM
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE 
        image.del = 0
    AND
        albums.del = 0
    GROUP BY albums.name, albums.album_value
    ORDER BY total DESC
  `

  // @ts-ignore
  result.total = Number(result.total)
  // @ts-ignore
  result.show_total = Number(result.show_total)

  return {
    total,
    showTotal,
    crTotal,
    tagsTotal,
    result
  }
}

export async function fetchUserById(userId: string) {
  const findUser = await db.user.findUnique({
    where: {
      id: userId
    }
  })
  return findUser
}

export async function fetchSecretKey() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'secret_key'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find
}

export async function fetchCustomInfo() {
  const find = await db.configs.findMany({
    where: {
      config_key: {
        in: ['custom_title', 'custom_favicon_url', 'custom_author', 'rss_feed_id', 'rss_user_id']
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find
}

export async function fetchCopyrightList() {
  const findAll = await db.copyright.findMany({
    where: {
      del: 0,
    },
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        updatedAt: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchImageByIdAndAuth(id: string) {
  const findAll = await db.$queryRaw`
    SELECT
        "images".*
    FROM
        "images"
    INNER JOIN "images_albums_relation"
        ON "images"."id" = "images_albums_relation"."imageId"
    INNER JOIN "albums"
        ON "images_albums_relation".album_value = "albums".album_value
    WHERE
        "images".del = 0
    AND
        "albums".del = 0
    AND
        "images".show = 0
    AND
        "albums".show = 0
    AND
        "images".id = ${id}
  `

  return findAll;
}

export async function queryAuthStatus() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'auth_enable'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find;
}

export async function queryAuthTemplateSecret() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'auth_temp_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find;
}

export async function queryAuthSecret() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'auth_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find;
}

export async function getRSSImages() {
  // 每个相册取最新 10 张照片
  const find = await db.$queryRaw`
    WITH RankedImages AS (
    SELECT
      i.*,
      A.album_value,
      ROW_NUMBER() OVER (PARTITION BY A.album_value ORDER BY i.created_at DESC) AS rn
    FROM
      images i
      INNER JOIN images_albums_relation iar ON i.ID = iar."imageId"
      INNER JOIN albums A ON iar.album_value = A.album_value
    WHERE
      A.del = 0
      AND A."show" = 0
      AND i.del = 0
      AND i."show" = 0
    )
    SELECT *
    FROM RankedImages
    WHERE rn <= 10;
  `

  return find;
}
