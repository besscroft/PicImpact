-- Rename the JSONB key `data_time` to `dateTime` inside the `images.exif`
-- column to match the camelCase `ExifType.dateTime` field used by the API
-- and frontend. The column type stays JSONB; we only rename a key inside it.
--
-- Idempotent: only rows that still have the old key are touched, so running
-- this migration multiple times is safe.
UPDATE "images"
SET "exif" = ("exif" - 'data_time') || jsonb_build_object('dateTime', "exif"->>'data_time')
WHERE "exif" ? 'data_time';
