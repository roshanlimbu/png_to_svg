#!/bin/bash

echo "🚀 Setting up PNG to SVG Converter with API and Frontend"
echo "========================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install express multer cors @types/express @types/multer @types/cors @types/node

echo ""
echo "🎨 Installing frontend dependencies..."
cd frontend
npm install

echo ""
echo "🏗️  Building the converter..."
cd ..
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the full application:"
echo "1. Run the API server: npm run server"
echo "2. In another terminal, run the frontend: cd frontend && npm run dev"
echo ""
echo "Or use the demo script: ./demo.sh"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "📡 API will be available at: http://localhost:3001"
