@echo off
REM Music Sheet Reader Setup Script for Windows

echo 🎵 Setting up Music Sheet Reader...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if Rust is installed
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust first.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Install Tauri CLI if not already installed
tauri --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Installing Tauri CLI...
    npm install -g @tauri-apps/cli@next
)

echo ✅ Setup complete!
echo.
echo 🚀 To run the application:
echo    npm run tauri:dev
echo.
echo 📱 For mobile development:
echo    Android: npm run tauri:android
echo    iOS:     npm run tauri:ios
echo.
echo 🏗️  To build for production:
echo    npm run tauri:build