@echo off
title Push Affiliate Portal to GitHub
cd /d "%~dp0"

echo.
echo  ============================================
echo    VP Affiliate Portal ^> GitHub Push
echo  ============================================
echo.

:: First-time setup — init the repo and point it at GitHub if that hasn't
:: happened yet. Safe to run every time; each step is skipped if already done.
if not exist ".git" (
    echo  No git repo here yet — initializing...
    git init
    git branch -M main
)

:: Repo moved to its own dedicated name (was Nikola0803/affiliate) so it can
:: get its own domain instead of sharing naming with anything else.
if not exist ".git" goto skipremotecheck
for /f "delims=" %%u in ('git remote get-url origin 2^>nul') do set CURRENT_ORIGIN=%%u
if "%CURRENT_ORIGIN%"=="https://github.com/Nikola0803/affiliate.git" (
    echo  Updating remote to the new repo name...
    git remote set-url origin https://github.com/Nikola0803/vp-affiliate.git
)
:skipremotecheck

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo  Adding GitHub remote...
    git remote add origin https://github.com/Nikola0803/vp-affiliate.git
)

:: Stage all current files
git add -A

:: Commit if there are staged changes
git diff --cached --quiet
if %errorlevel% == 0 (
    echo  No new changes to commit.
    echo.
) else (
    set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2% %time:~0,5%
    git commit -m "Update %TIMESTAMP%"
    echo.
)

:: Push
echo  Pushing to github.com/Nikola0803/vp-affiliate ...
echo.
git push -u origin main

echo.
if %errorlevel% == 0 (
    echo  ============================================
    echo    SUCCESS - live on GitHub!
    echo  ============================================
) else (
    echo  ============================================
    echo    Error - check output above.
    echo  ============================================
)
echo.
pause
