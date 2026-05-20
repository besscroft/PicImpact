-- Rename the JSON key `data_time` to `dateTime` inside the `images.exif`
-- column to match the camelCase `ExifType.dateTime` field used by the API
-- and frontend. The column type stays `json`; we only rename a key inside it.
--
-- `images.exif` is `json` (not `jsonb`), and operators `?`, `-`, `||` are only
-- defined on `jsonb`, so we cast to `jsonb` for the manipulation and back to
-- `json` on write.
--
-- Idempotent: only rows that still have the old key are touched, so running
-- this migration multiple times is safe.
UPDATE "images"
SET "exif" = (
  (("exif"::jsonb) - 'data_time')
  || jsonb_build_object('dateTime', "exif"->>'data_time')
)::json
WHERE ("exif"::jsonb) ? 'data_time';
