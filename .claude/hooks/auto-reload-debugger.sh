#!/bin/bash

# Auto-reload debugger hook
# Triggers when files are saved and offers to restart VS Code debugger

# This hook is called after each tool execution
# We check if TypeScript files were modified and if debugger is running

# Get the list of modified files from the last operation
MODIFIED_FILES="${MODIFIED_FILES:-}"

# Check if any TypeScript files in src/ were modified
if echo "$MODIFIED_FILES" | grep -q "src/.*\.ts"; then
    echo ""
    echo "🔄 TypeScript files in src/ were modified."
    echo "💡 You may want to restart the debugger to see your changes."
    echo ""
    echo "Quick actions:"
    echo "  • Press F5 in VS Code to restart debugger"
    echo "  • Or run: Developer: Reload Window (Ctrl+R in debug host)"
    echo ""
fi

exit 0
