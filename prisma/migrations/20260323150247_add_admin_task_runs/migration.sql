-- CreateTable
CREATE TABLE "admin_task_runs" (
    "id" VARCHAR(50) NOT NULL,
    "task_key" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'queued',
    "scope" JSON NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "next_cursor" VARCHAR(50),
    "recent_issues" JSON NOT NULL DEFAULT '[]',
    "last_error" JSON,
    "lease_expires_at" TIMESTAMP,
    "started_at" TIMESTAMP,
    "finished_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "admin_task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_task_runs_task_key_status_idx" ON "admin_task_runs"("task_key", "status");

-- CreateIndex
CREATE INDEX "admin_task_runs_status_idx" ON "admin_task_runs"("status");
