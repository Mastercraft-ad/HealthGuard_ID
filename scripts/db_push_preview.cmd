@echo off
setlocal
set "DATABASE_URL=postgresql://neondb_owner:npg_1DQGHRX3wBVM@ep-small-voice-ad6ltt23-pooler.c-2.us-east-1.aws.neon.tech/HealthGuardX?sslmode=require&channel_binding=require"
cd /d "%~dp0\.."
REM Generate SQL that would be applied and write to drizzle_preview.sql for inspection
npx drizzle-kit push --print > drizzle_preview.sql 2> drizzle_preview.err || echo drizzle-kit returned non-zero, see drizzle_preview.err
endlocal
echo Wrote drizzle_preview.sql and drizzle_preview.err
pause
