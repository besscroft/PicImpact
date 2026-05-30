-- Rebuild the daily_images materialized view to include the image variant
-- columns (image_key / variants_ready / ready_max_width) added to "images" in
-- 20260530000000_add_image_variant_fields.
--
-- A materialized view's column set is frozen at CREATE time, and this view
-- projects an explicit column list (not images.*), so the new columns never
-- reached it — the daily-random homepage therefore couldn't serve responsive
-- variants and fell back to preview/blurhash. Rebuilding with the columns added
-- lets the gallery loader serve variants (incl. AVIF) for daily images too.
--
-- Definition is otherwise identical to 20260322000000_add_daily_homepage.

DROP MATERIALIZED VIEW IF EXISTS "daily_images";

CREATE MATERIALIZED VIEW "daily_images" AS
WITH config AS (
  SELECT COALESCE(
    (SELECT CAST(config_value AS INTEGER) FROM "configs" WHERE config_key = 'daily_total_count'),
    30
  ) AS total_count
),
album_weights AS (
  SELECT
    a.album_value,
    a.daily_weight,
    COUNT(DISTINCT i.id) AS photo_count,
    a.daily_weight::FLOAT / SUM(a.daily_weight) OVER () AS weight_ratio
  FROM "albums" a
  INNER JOIN "images_albums_relation" iar ON a.album_value = iar.album_value
  INNER JOIN "images" i ON iar."imageId" = i.id
  WHERE a.del = 0 AND a.daily_weight > 0 AND i.del = 0 AND i.show = 0
  GROUP BY a.album_value, a.daily_weight
),
album_quotas AS (
  SELECT
    album_value,
    daily_weight,
    photo_count,
    weight_ratio,
    LEAST(
      photo_count,
      CEIL(weight_ratio * (SELECT total_count FROM config))
    )::INTEGER AS quota
  FROM album_weights
),
ranked_images AS (
  SELECT
    i.*,
    aq.quota,
    ROW_NUMBER() OVER (PARTITION BY aq.album_value ORDER BY random()) AS rn
  FROM "images" i
  INNER JOIN "images_albums_relation" iar ON i.id = iar."imageId"
  INNER JOIN album_quotas aq ON iar.album_value = aq.album_value
  WHERE i.del = 0 AND i.show = 0
),
deduped_images AS (
  SELECT DISTINCT ON (id)
    id, image_name, url, preview_url, video_url, blurhash,
    image_key, variants_ready, ready_max_width,
    exif, labels,
    width, height, lon, lat, title, detail, type, show, show_on_mainpage,
    sort, created_at, updated_at, del
  FROM ranked_images
  WHERE rn <= quota
  ORDER BY id, random()
)
SELECT
  id, image_name, url, preview_url, video_url, blurhash,
  image_key, variants_ready, ready_max_width,
  exif, labels,
  width, height, lon, lat, title, detail, type, show, show_on_mainpage,
  sort, created_at, updated_at, del,
  ROW_NUMBER() OVER (ORDER BY random()) AS daily_sort
FROM deduped_images
LIMIT (SELECT total_count FROM config);

-- Recreate the unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
-- (dropped together with the view above).
CREATE UNIQUE INDEX "daily_images_id_idx" ON "daily_images" (id);
