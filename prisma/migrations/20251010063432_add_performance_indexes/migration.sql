-- Add performance indexes for ApiKey table
-- These indexes optimize stats queries, leaderboard, and filtering

-- Single column indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS "api_keys_totalTokens_idx" ON "api_keys"("totalTokens");
CREATE INDEX IF NOT EXISTS "api_keys_totalCalls_idx" ON "api_keys"("totalCalls");

-- Composite indexes for common query patterns
-- Query: Get user's keys filtered by status
CREATE INDEX IF NOT EXISTS "api_keys_userId_status_idx" ON "api_keys"("userId", "status");

-- Query: Get user's keys sorted by total tokens (leaderboard)
CREATE INDEX IF NOT EXISTS "api_keys_userId_totalTokens_idx" ON "api_keys"("userId", "totalTokens");

-- Query: Get user's keys sorted by last usage
CREATE INDEX IF NOT EXISTS "api_keys_userId_lastUsedAt_idx" ON "api_keys"("userId", "lastUsedAt");
