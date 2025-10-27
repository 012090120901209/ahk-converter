#!/bin/bash

# Auto-reload debugger script
# Compiles TypeScript and provides instructions for reloading

set -e

echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Compilation successful!"
    echo ""
    echo "📋 Next steps to reload debugger:"
    echo ""
    echo "  Option 1 (Recommended):"
    echo "    • Press Ctrl+Shift+F5 to restart debugging"
    echo ""
    echo "  Option 2:"
    echo "    • Stop debugger (Shift+F5)"
    echo "    • Start debugger (F5)"
    echo ""
    echo "  Option 3 (In Extension Development Host):"
    echo "    • Press Ctrl+R to reload window"
    echo "    • Or: Ctrl+Shift+P → 'Developer: Reload Window'"
    echo ""
    echo "💡 Your changes are compiled and ready!"
else
    echo ""
    echo "❌ Compilation failed!"
    echo "Fix the errors above and try again."
    exit 1
fi
