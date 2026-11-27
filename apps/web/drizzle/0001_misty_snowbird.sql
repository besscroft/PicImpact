ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
WITH candidates AS (
	SELECT
		"id",
		lower(regexp_replace(split_part("email", '@', 1), '[^A-Za-z0-9_.]', '_', 'g')) AS base
	FROM "user"
),
ranked AS (
	SELECT
		"id",
		CASE
			WHEN length(base) BETWEEN 3 AND 30
				AND left(base, 9) <> 'migrated_'
				AND row_number() OVER (PARTITION BY base ORDER BY "id") = 1 THEN base
			ELSE 'migrated_' || row_number() OVER (ORDER BY "id")
		END AS username
	FROM candidates
)
UPDATE "user" AS users
SET "username" = ranked.username
FROM ranked
WHERE users."id" = ranked."id";--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "user" USING btree ("username");
