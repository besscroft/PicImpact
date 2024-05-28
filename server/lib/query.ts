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
          'force_path_style'
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
          STRING_AGG(tags.tag_value, ',') AS tag_values
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
    return findAll;
  }
  const findAll = await db.$queryRaw`
    SELECT 
        image.*,
        STRING_AGG(tags."name", ',') AS tag_names,
        STRING_AGG(tags.tag_value, ',') AS tag_values
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
    GROUP BY image.id
    ORDER BY image.sort DESC, image.create_time DESC, image.update_time DESC 
    LIMIT 8 OFFSET ${(pageNum - 1) * 8}
  `
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
      INNER JOIN "public"."ImageTagRelation" AS relation
          ON image.id = relation."imageId"
      INNER JOIN "public"."Tags" AS tags
          ON relation.tag_value = tags.tag_value
      WHERE
          image.del = 0
      AND
          tags.del = 0
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
        STRING_AGG(tags.tag_value, ',') AS tag_values
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
        STRING_AGG(tags.tag_value, ',') AS tag_values
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

  const result = await db.$queryRaw`
    SELECT 
        tags.name,
        tags.tag_value,
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

  return {
    total,
    showTotal,
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
