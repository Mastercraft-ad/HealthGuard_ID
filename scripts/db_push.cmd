@echo off
REM db_push wrapper: sets DATABASE_URL and runs drizzle-kit push via npm script
setlocal
	set "DATABASE_URL=postgresql://neondb_owner:npg_1DQGHRX3wBVM@ep-small-voice-ad6ltt23-pooler.c-2.us-east-1.aws.neon.tech/HealthGuardX?sslmode=require"
	cd /d "C:\Users\Moses\Downloads\HealthGuard-X"
	REM Run drizzle-kit push non-interactively (auto-approve data-loss statements)
	npx drizzle-kit push --force --verbose
endlocal
pause
