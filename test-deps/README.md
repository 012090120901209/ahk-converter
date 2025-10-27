# Dependency Tree Test Files

This directory contains test files to verify the Dependency Tree functionality.

## File Structure

```
test-deps/
├── main.ahk                 - Entry point, includes utils and MyLib
├── lib/
│   ├── utils.ahk           - Utilities, includes helper
│   └── helper.ahk          - Helper functions
└── Lib/
    └── MyLib.ahk           - Library-style include
```

## Include Types Tested

1. **Relative path includes**: `#Include lib/utils.ahk`
2. **Library includes**: `#Include <MyLib>`
3. **Same-directory includes**: `#Include helper.ahk`

## Expected Dependency Tree

When you open the Dependency Tree view in VS Code, you should see:

```
📄 main.ahk (2 includes)
  ├── 📄 utils.ahk (1 includes)
  │   └── 📄 helper.ahk
  └── 📄 MyLib.ahk

📄 lib/utils.ahk (1 includes)
  └── 📄 helper.ahk

📄 lib/helper.ahk

📄 Lib/MyLib.ahk
```

## Testing Instructions

1. Open this `ahk-converter` folder in VS Code
2. Look for "AHKv2 Toolbox" in the sidebar
3. Expand the "Dependencies" view
4. You should see all 4 `.ahk` files listed
5. Click on `main.ahk` to expand its dependencies
6. Click any file to open it in the editor

## Cross-Platform Testing

This structure tests cross-platform path resolution:
- Mixed case folders (`lib` vs `Lib`)
- Both `/` and `\` separators work
- Library includes (`<MyLib>`) resolve to `Lib/` folder

## Troubleshooting

If you don't see files:
1. Make sure you opened the workspace folder (not just files)
2. Check the VS Code output panel for errors
3. Try clicking the refresh button in the Dependencies view
