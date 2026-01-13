#!/bin/bash

# MedWard - clasp Setup Script
# This script helps you set up clasp for deploying to Google Apps Script

set -e

echo "🚀 MedWard - Google Apps Script Deployment Setup"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if clasp is installed
if ! command -v clasp &> /dev/null; then
    echo "📦 Installing clasp..."
    npm install -g @google/clasp
    echo "✅ clasp installed successfully"
else
    echo "✅ clasp is already installed ($(clasp --version))"
fi

echo ""
echo "🔑 Logging in to Google Apps Script..."
echo "A browser window will open. Please authorize clasp."
echo ""

clasp login

echo ""
echo "✅ Successfully logged in to Google Apps Script"
echo ""

# Check if .clasp.json exists
if [ -f ".clasp.json" ]; then
    SCRIPT_ID=$(grep -o '"scriptId": *"[^"]*"' .clasp.json | cut -d'"' -f4)

    if [ "$SCRIPT_ID" = "YOUR_SCRIPT_ID_HERE" ]; then
        echo "⚠️  You need to update .clasp.json with your actual Script ID"
        echo ""
        echo "To get your Script ID:"
        echo "1. Go to https://script.google.com"
        echo "2. Open your MedWard project"
        echo "3. Click Project Settings (gear icon)"
        echo "4. Copy the Script ID"
        echo ""
        echo "Then update .clasp.json with your Script ID"
        echo ""
        read -p "Do you want to create a new Apps Script project instead? (y/N): " create_new

        if [ "$create_new" = "y" ] || [ "$create_new" = "Y" ]; then
            echo ""
            echo "📝 Creating new Apps Script project..."
            cd google-apps-script
            clasp create --type webapp --title "MedWard"
            cd ..
            echo ""
            echo "✅ New project created!"
            echo "The Script ID has been saved to .clasp.json"
        fi
    else
        echo "✅ Script ID is configured: $SCRIPT_ID"
        echo ""
        echo "Testing connection to Apps Script project..."

        if clasp open --webapp 2>/dev/null; then
            echo "✅ Successfully connected to your Apps Script project"
        else
            echo "⚠️  Could not open project. Please verify your Script ID is correct."
        fi
    fi
else
    echo "❌ .clasp.json not found"
    echo ""
    read -p "Do you want to create a new Apps Script project? (y/N): " create_new

    if [ "$create_new" = "y" ] || [ "$create_new" = "Y" ]; then
        echo ""
        echo "📝 Creating new Apps Script project..."

        # Create .clasp.json
        cat > .clasp.json << 'EOF'
{
  "scriptId": "",
  "rootDir": "google-apps-script",
  "fileExtension": "gs"
}
EOF

        cd google-apps-script
        clasp create --type webapp --title "MedWard"
        cd ..

        echo ""
        echo "✅ New project created!"
    fi
fi

echo ""
echo "📤 Testing deployment..."
echo ""

if clasp push --force; then
    echo ""
    echo "✅ Successfully pushed files to Apps Script!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Add API keys to Script Properties:"
    echo "   - Go to: https://script.google.com"
    echo "   - Open your project"
    echo "   - Click Project Settings > Script Properties"
    echo "   - Add: OPENAI_API_KEY and GOOGLE_VISION_API_KEY"
    echo ""
    echo "2. Deploy your web app:"
    echo "   clasp deploy --description 'Initial deployment'"
    echo ""
    echo "3. Get your web app URL:"
    echo "   clasp open --webapp"
    echo ""
    echo "For automatic GitHub deployment, see:"
    echo "google-apps-script/DEPLOY-FROM-GITHUB.md"
else
    echo ""
    echo "⚠️  Push failed. This might be because:"
    echo "- Script ID is incorrect"
    echo "- You haven't enabled Apps Script API"
    echo "- Permission issues"
    echo ""
    echo "Please check:"
    echo "1. Enable Apps Script API: https://script.google.com/home/usersettings"
    echo "2. Verify Script ID in .clasp.json"
    echo "3. Run: clasp open"
    echo ""
    echo "See DEPLOY-FROM-GITHUB.md for troubleshooting"
fi
