/*
  Warnings:

  - The values [RUNNING,COMPLETED,FAILED] on the enum `AgentRunStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AgentRunStatus_new" AS ENUM ('SUCCESS', 'NEEDS_CLARIFICATION', 'OUT_OF_SCOPE', 'SAFETY_ESCALATION', 'ERROR');
ALTER TABLE "public"."agent_runs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "agent_runs" ALTER COLUMN "status" TYPE "AgentRunStatus_new" USING ("status"::text::"AgentRunStatus_new");
ALTER TYPE "AgentRunStatus" RENAME TO "AgentRunStatus_old";
ALTER TYPE "AgentRunStatus_new" RENAME TO "AgentRunStatus";
DROP TYPE "public"."AgentRunStatus_old";
ALTER TABLE "agent_runs" ALTER COLUMN "status" SET DEFAULT 'ERROR';
COMMIT;

-- AlterTable
ALTER TABLE "agent_runs" ALTER COLUMN "status" SET DEFAULT 'ERROR';
