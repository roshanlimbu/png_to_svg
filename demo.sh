#!/bin/bash

echo "🚀 PNG to SVG Converter Demo"
echo "=============================="
echo ""

echo "📦 Installing dependencies..."
cd /Volumes/Workspace/png_to_svg
npm install

echo ""
echo "🖼️  Building the converter..."
npm run build

echo ""
echo "🧪 Creating a test image..."
node dist/test.js

echo ""
echo "� Starting the API server..."
echo "   📡 API will run on http://localhost:3001"
npm run server &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

echo ""
echo "🎨 Starting the frontend..."
echo "   🌐 Open http://localhost:3000 in your browser"
echo "   📁 Try uploading the test image: examples/test-input.png"
echo ""
echo "   Press Ctrl+C to stop both servers"

cd frontend
npm install
npm run dev

# Kill the server when frontend stops
kill $SERVER_PID 2>/dev/null
