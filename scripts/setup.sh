#!/bin/bash

# Music Sheet Reader Setup Script

echo "🎵 Setting up Music Sheet Reader..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Tauri CLI if not already installed
if ! command -v tauri &> /dev/null; then
    echo "🔧 Installing Tauri CLI..."
    npm install -g @tauri-apps/cli@next
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To run the application:"
echo "   npm run tauri:dev"
echo ""
echo "📱 For mobile development:"
echo "   Android: npm run tauri:android"
echo "   iOS:     npm run tauri:ios"
echo ""
echo "🏗️  To build for production:"
echo "   npm run tauri:build"