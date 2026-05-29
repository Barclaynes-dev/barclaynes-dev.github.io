@echo off
title Portfolio Deployment Tool
echo ===================================================
echo             Portfolio Deployment Tool
echo ===================================================
echo.

:: Check for changes using git status and file size
git status --porcelain > temp_status.txt
for %%I in (temp_status.txt) do set file_size=%%~zI
del temp_status.txt

if "%file_size%"=="0" (
    echo [INFO] No local changes detected. Checking remote...
    git push origin main
    if %errorlevel% equ 0 (
        echo [SUCCESS] Everything is already up-to-date!
    ) else (
        echo [ERROR] Failed to communicate with GitHub.
    )
    goto end
)

:: Display modified files to the user
echo [INFO] The following changes will be deployed:
git status -s
echo.

set /p commit_msg="Enter commit message (or press Enter for 'Update portfolio'): "

if "%commit_msg%"=="" (
    set commit_msg=Update portfolio
)

echo.
echo [+] Staging changes...
git add -A

echo [+] Committing changes: "%commit_msg%"
git commit -m "%commit_msg%"

echo [+] Pushing to GitHub Pages...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Portfolio updated successfully!
    echo Your live site will update in a few minutes at:
    echo https://barclaynes-dev.github.io/
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo [ERROR] Failed to push changes to GitHub.
    echo Please make sure:
    echo 1. You are logged into Git/GitHub on this machine.
    echo 2. You have write access to the repository.
    echo 3. You have an active internet connection.
    echo ===================================================
)

:end
echo.
pause
