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

export async function fetchTagsList() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0,
      tag_value: {
        notIn: ['/']
      }
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        create_time: 'desc',
      },
      {
        update_time: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchTagsListAndNotDefault() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        create_time: 'desc',
      },
      {
        update_time: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchServerImagesListByTag(pageNum: number, tag: string) {
  if (tag === 'all') {
    tag = ''
  }
  if (pageNum < 1) {
    pageNum = 1
  }
  if (tag && tag !== '') {
    const findAll = await db.$queryRaw`
      SELECT 
          image.*,
          STRING_AGG(tags."name", ',') AS tag_names,
          STRING_AGG(tags.id::text, ',') AS tag_values,
          (
              SELECT json_agg(row_to_json(t))
              FROM (
                  SELECT copyright.id
                  FROM "public"."Copyright" AS copyright
                      INNER JOIN "public"."ImageCopyrightRelation" AS icrelation
                          ON copyright.id = icrelation."copyrightId"
                      INNER JOIN "public"."Images" AS image_child
                          ON icrelation."imageId" = image_child."id"
                  WHERE copyright.del = 0
                      AND image_child.del = 0
                      AND image.id = image_child.id
              ) t
          ) AS copyrights
      FROM 
          "public"."Images" AS image
      INNER JOIN "public"."ImageTagRelation" AS relation
          ON image.id = relation."imageId"
      INNER JOIN "public"."Tags" AS tags
          ON relation.tag_value = tags.tag_value
      WHERE
          image.del = 0
      AND
          tags.del = 0
      AND
          tags.tag_value = ${tag}
      GROUP BY image.id
      ORDER BY image.sort DESC, image.create_time DESC, image.update_time DESC
      LIMIT 8 OFFSET ${(pageNum - 1) * 8}
    `

    if (findAll) {
      // @ts-ignore
      findAll?.map((item: any) => {
        if (item.copyrights) {
          item.copyrights = item?.copyrights.map((item: any) => Number(item.id))
        }
      })
    }

    return findAll;
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        STRING_AGG(tags."name", ',') AS tag_names,
        STRING_AGG(tags.id::text, ',') AS tag_values,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.id
                FROM "public"."Copyright" AS copyright
                INNER JOIN "public"."ImageCopyrightRelation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."Images" AS image_child
                    ON icrelation."imageId" = image_child."id"
            WHERE copyright.del = 0
            AND image_child.del = 0
            AND image.id = image_child.id
            ) t
        ) AS copyrights
    FROM 
        "public"."Images" AS image
    LEFT JOIN "public"."ImageTagRelation" AS relation
        ON image.id = relation."imageId"
    LEFT JOIN "public"."Tags" AS tags
        ON relation.tag_value = tags.tag_value
    WHERE 
        image.del = 0
    GROUP BY image.id
    ORDER BY image.sort DESC, image.create_time DESC, image.update_time DESC 
    LIMIT 8 OFFSET ${(pageNum - 1) * 8}
  `
  if (findAll) {
    // @ts-ignore
    findAll?.map((item: any) => {
      if (item.copyrights) {
        item.copyrights = item?.copyrights.map((item: any) => Number(item.id))
      }
    })
  }
  return findAll;
}

export async function fetchServerImagesPageTotalByTag(tag: string) {
  if (tag === 'all') {
    tag = ''
  }
  if (tag && tag !== '') {
    const pageTotal = await db.$queryRaw`
      SELECT COALESCE(COUNT(1),0) AS total
      FROM (
        SELECT DISTINCT ON (image.id)
            image.id 
        FROM 
            "public"."Images" AS image
        INNER JOIN "public"."ImageTagRelation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."Tags" AS tags
            ON relation.tag_value = tags.tag_value
        WHERE 
            image.del = 0
        AND
            tags.del = 0
        AND
            tags.tag_value = ${tag}
      ) AS unique_images;
    `
    // @ts-ignore
    return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 8) : 0
  }
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
      SELECT DISTINCT ON (image.id)
          image.id
      FROM
          "public"."Images" AS image
      LEFT JOIN "public"."ImageTagRelation" AS relation
          ON image.id = relation."imageId"
      LEFT JOIN "public"."Tags" AS tags
          ON relation.tag_value = tags.tag_value
      WHERE
          image.del = 0
     ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 8) : 0
}

export async function fetchClientImagesListByTag(pageNum: number, tag: string) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        STRING_AGG(tags."name", ',') AS tag_names,
        STRING_AGG(tags.tag_value, ',') AS tag_values,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.*
                FROM "public"."Copyright" AS copyright
                INNER JOIN "public"."ImageCopyrightRelation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."Images" AS image_child
                    ON icrelation."imageId" = image_child."id"
                WHERE copyright.del = 0
                AND image_child.del = 0
                AND copyright.show = 0
                AND copyright.default = 1
                AND image.id = image_child.id
                UNION
                SELECT copyright.*
                FROM "public"."Copyright" AS copyright
                WHERE copyright.del = 0
                AND copyright.show = 0
                AND copyright.default = 0
            ) t
        ) AS copyrights
    FROM 
        "public"."Images" AS image
    INNER JOIN "public"."ImageTagRelation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."Tags" AS tags
        ON relation.tag_value = tags.tag_value
    WHERE
        image.del = 0
    AND
        tags.del = 0
    AND
        image.show = 0
    AND
        tags.show = 0
    AND
        tags.tag_value = ${tag}
    GROUP BY image.id
    ORDER BY image.sort DESC, image.create_time DESC, image.update_time DESC
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
           "public"."Images" AS image
        INNER JOIN "public"."ImageTagRelation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."Tags" AS tags
            ON relation.tag_value = tags.tag_value
        WHERE
            image.del = 0
        AND
            tags.del = 0
        AND
            image.show = 0
        AND
            tags.show = 0
        AND
            tags.tag_value = ${tag}
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

export async function fetchClientImagesListByLabel(pageNum: number, label: string) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        STRING_AGG(tags."name", ',') AS tag_names,
        STRING_AGG(tags.tag_value, ',') AS tag_values,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT copyright.*
                FROM "public"."Copyright" AS copyright
                INNER JOIN "public"."ImageCopyrightRelation" AS icrelation
                    ON copyright.id = icrelation."copyrightId"
                INNER JOIN "public"."Images" AS image_child
                    ON icrelation."imageId" = image_child."id"
                WHERE copyright.del = 0
                AND image_child.del = 0
                AND copyright.show = 0
                AND image.id = image_child.id
            ) t
        ) AS copyrights
    FROM 
        "public"."Images" AS image
    INNER JOIN "public"."ImageTagRelation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."Tags" AS tags
        ON relation.tag_value = tags.tag_value
    WHERE
        image.del = 0
    AND
        tags.del = 0
    AND
        image.show = 0
    AND
        tags.show = 0
    AND
        image.labels::jsonb @> ${JSON.stringify([label])}::jsonb
    GROUP BY image.id
    ORDER BY image.sort DESC, image.create_time DESC, image.update_time DESC
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `
  return findAll;
}

export async function fetchClientImagesPageTotalByLabel(label: string) {
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."Images" AS image
        INNER JOIN "public"."ImageTagRelation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."Tags" AS tags
            ON relation.tag_value = tags.tag_value
        WHERE
            image.del = 0
        AND
            tags.del = 0
        AND
            image.show = 0
        AND
            tags.show = 0
        AND
            image.labels::jsonb @> ${JSON.stringify([label])}::jsonb
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

export async function fetchTagsShow() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0,
      show: 0,
      tag_value: {
        notIn: ['/']
      }
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

  const tagsTotal = await db.tags.count({
    where: {
      del: 0
    },
  })

  const result = await db.$queryRaw`
    SELECT 
        tags.name AS name,
        tags.tag_value AS value,
        COALESCE(COUNT(1), 0) AS total,
        COALESCE(SUM(CASE WHEN image.show = 0 THEN 1 ELSE 0 END), 0) AS show_total
    FROM
        "public"."Images" AS image
    INNER JOIN "public"."ImageTagRelation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."Tags" AS tags
        ON relation.tag_value = tags.tag_value
    WHERE 
        image.del = 0
    AND 
        tags.del = 0
    GROUP BY tags.name, tags.tag_value
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

export async function fetchCustomTitle() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'custom_title'
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
        create_time: 'desc',
      },
      {
        update_time: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchImageByIdAndAuth(id: number) {
  const findAll = await db.$queryRaw`
    SELECT
        "Images".*
    FROM
        "Images"
    INNER JOIN "ImageTagRelation"
        ON "Images"."id" = "ImageTagRelation"."imageId"
    INNER JOIN "Tags"
        ON "ImageTagRelation".tag_value = "Tags".tag_value
    WHERE
        "Images".del = 0
    AND
        "Tags".del = 0
    AND
        "Images".show = 0
    AND
        "Tags".show = 0
    AND
        "Images".id = ${id}
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