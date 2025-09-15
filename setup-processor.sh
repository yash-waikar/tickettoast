#!/bin/bash

# TicketToast - Document AI Processor Setup Script
# This script provides step-by-step instructions for setting up your Custom Extraction Processor

echo "🎯 TicketToast - Document AI Setup Guide"
echo "========================================"
echo ""

echo "📋 Current Status:"
echo "- Your processor ID: a22dab6a55e6f57c"
echo "- Project ID: tickettoast"
echo "- Location: us"
echo "- Schema file: parking-citation-schema.json ✅"
echo ""

echo "🔧 Required Actions:"
echo ""

echo "1️⃣  Go to Google Cloud Console:"
echo "   👉 https://console.cloud.google.com/ai/document-ai/processors"
echo "   👉 Make sure you're in project 'tickettoast'"
echo ""

echo "2️⃣  Find your processor:"
echo "   👉 Look for processor ID: a22dab6a55e6f57c"
echo "   👉 Click on it to open the details"
echo ""

echo "3️⃣  Upload the schema:"
echo "   👉 Click on 'Schema' tab"
echo "   👉 Click 'Upload Schema' button"
echo "   👉 Select the 'parking-citation-schema.json' file from this directory"
echo "   👉 Click 'Save'"
echo ""

echo "4️⃣  Test the setup:"
echo "   👉 Run: npm run dev"
echo "   👉 Go to: http://localhost:3000"
echo "   👉 Upload a parking citation document"
echo ""

echo "💡 Alternative - Create New Processor:"
echo "If you prefer a simpler setup:"
echo "   👉 Create a new 'Form Parser' processor instead"
echo "   👉 Form Parsers don't require custom schemas"
echo "   👉 Update GOOGLE_CLOUD_PROCESSOR_ID in .env.local"
echo ""

echo "❓ Need the schema file contents?"
echo "The parking-citation-schema.json file contains:"
cat parking-citation-schema.json
echo ""

echo "✅ Once completed, your processor will extract these fields:"
echo "   • Citation Number"
echo "   • Plate Number"
echo "   • Violation Type"
echo "   • Issue Date"
echo "   • Fine Amount"
echo "   • And 10+ more parking citation fields"
echo ""

echo "🚀 Ready to process parking citations!"
