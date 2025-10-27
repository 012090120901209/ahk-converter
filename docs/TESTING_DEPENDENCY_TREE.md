# Testing the Dependency Tree Feature

## Quick Start Testing

### 1. Build and Run

```bash
# Compile the extension
npm run compile

# Press F5 in VS Code to launch Extension Development Host
# Or: Run > Start Debugging
```

### 2. Open Test Workspace

In the Extension Development Host window:
```
File > Open Folder > Navigate to: ahk-converter/test-deps
```

### 3. View Dependencies

1. Click the AHKv2 Toolbox icon in the Activity Bar (left sidebar)
2. Expand the "Dependencies" section
3. You should see 4 files listed

### 4. Test Interactions

- **Click a file**: Should open in editor
- **Expand main.ahk**: Should show 2 dependencies
- **Click refresh button**: Should reload tree
- **Edit a file**: Tree should auto-refresh

## Detailed Test Cases

### Test Case 1: Basic Tree Rendering

**Steps**:
1. Open `test-deps` folder
2. Open Dependencies view

**Expected**:
```
📄 main.ahk (2 includes)
📄 lib/utils.ahk (1 includes)
📄 lib/helper.ahk
📄 Lib/MyLib.ahk
```

**Pass Criteria**: All 4 files appear

---

### Test Case 2: Dependency Expansion

**Steps**:
1. Click arrow next to `main.ahk`

**Expected**:
```
📄 main.ahk (2 includes)
  ├── 📄 utils.ahk (1 includes)
  └── 📄 MyLib.ahk
```

**Pass Criteria**: Shows both dependencies

---

### Test Case 3: Nested Dependencies

**Steps**:
1. Expand `main.ahk`
2. Expand `utils.ahk` under `main.ahk`

**Expected**:
```
📄 main.ahk (2 includes)
  ├── 📄 utils.ahk (1 includes)
  │   └── 📄 helper.ahk
  └── 📄 MyLib.ahk
```

**Pass Criteria**: Shows nested dependency

---

### Test Case 4: Library Include Resolution

**Steps**:
1. Expand `main.ahk`
2. Verify `MyLib.ahk` appears (from `<MyLib>` include)

**Expected**: `MyLib.ahk` resolves from `Lib/` folder

**Pass Criteria**: Library include works

---

### Test Case 5: Click to Open File

**Steps**:
1. Click `main.ahk` in tree
2. Observe editor

**Expected**: `main.ahk` opens in editor

**Pass Criteria**: File opens, cursor at line 1

---

### Test Case 6: Unresolved Include

**Steps**:
1. Edit `main.ahk`, add: `#Include nonexistent.ahk`
2. Save file
3. Expand `main.ahk` in tree

**Expected**:
```
📄 main.ahk (3 includes)
  ├── 📄 utils.ahk
  ├── 📄 MyLib.ahk
  └── ⚠️ nonexistent.ahk
```

**Pass Criteria**: Warning icon appears for missing file

---

### Test Case 7: Auto-Refresh on File Change

**Steps**:
1. Note current tree state
2. Edit `lib/utils.ahk`, add: `#Include newfile.ahk`
3. Save file

**Expected**: Tree refreshes, shows `utils.ahk` count changes

**Pass Criteria**: Automatic update without clicking refresh

---

### Test Case 8: Manual Refresh

**Steps**:
1. Click refresh button in Dependencies title bar

**Expected**: Tree reloads

**Pass Criteria**: Tree refreshes, no errors

---

### Test Case 9: Cross-Platform Paths (Windows)

**Steps** (on Windows):
1. Edit `main.ahk`, change to: `#Include lib\utils.ahk` (backslash)
2. Save

**Expected**: Still resolves correctly

**Pass Criteria**: Both `/` and `\` separators work

---

### Test Case 10: Cross-Platform Paths (WSL/Linux)

**Steps** (on WSL/Linux):
1. Verify all includes resolve
2. Check no path errors in console

**Expected**: Forward slashes work correctly

**Pass Criteria**: All paths resolve on Linux

---

## Manual Testing Checklist

- [ ] Extension compiles without errors
- [ ] Dependency view appears in sidebar
- [ ] All test files are listed
- [ ] Expand/collapse works
- [ ] Click opens files
- [ ] Icons display correctly
- [ ] File counts are accurate
- [ ] Library includes resolve
- [ ] Unresolved includes show warning
- [ ] Auto-refresh works
- [ ] Manual refresh works
- [ ] No console errors
- [ ] Works on Windows
- [ ] Works on WSL/Linux

## Cross-Platform Testing

### Windows Testing

```powershell
# From Windows terminal
cd C:\Users\...\ahk-converter
code .

# Test:
# - Backslash paths work
# - Library includes resolve to Lib\ folder
# - No path separator errors
```

### WSL Testing

```bash
# From WSL terminal
cd /mnt/c/Users/.../ahk-converter
code .

# Test:
# - Forward slash paths work
# - Library includes resolve to Lib/ folder
# - Cross-platform path normalization works
```

### Linux Testing

```bash
# From Linux terminal
cd ~/path/to/ahk-converter
code .

# Test:
# - All paths use forward slashes
# - No Windows-specific path issues
```

## Debugging

### Enable Developer Tools

1. In Extension Development Host: `Help > Toggle Developer Tools`
2. Go to Console tab
3. Look for errors

### Common Issues

**Issue**: "Cannot read property 'fsPath' of undefined"
- **Cause**: No workspace folder open
- **Fix**: Open folder, not just files

**Issue**: Tree is empty
- **Cause**: No `.ahk` files found
- **Fix**: Ensure test files exist

**Issue**: Includes don't resolve
- **Cause**: Path resolution failed
- **Fix**: Check file paths, verify Lib/ folder exists

### Logging

Add debug logging to `dependencyTreeProvider.ts`:

```typescript
console.log('[DependencyTree] Parsing file:', filePath);
console.log('[DependencyTree] Found includes:', includes);
console.log('[DependencyTree] Resolved:', resolved);
console.log('[DependencyTree] Unresolved:', unresolved);
```

## Performance Testing

### Large Workspace Test

Create 100 test files:

```bash
cd test-deps
for i in {1..100}; do
  echo "#Requires AutoHotkey v2.0" > "file$i.ahk"
  echo "#Include lib/utils.ahk" >> "file$i.ahk"
  echo "MsgBox \"File $i\"" >> "file$i.ahk"
done
```

**Expected**: Tree loads within 1-2 seconds

### Deep Dependency Chain

Create 10-level deep chain:

```bash
for i in {1..10}; do
  echo "#Requires AutoHotkey v2.0" > "level$i.ahk"
  if [ $i -lt 10 ]; then
    echo "#Include level$((i+1)).ahk" >> "level$i.ahk"
  fi
done
```

**Expected**: All levels expandable, no stack overflow

## Automated Testing (Future)

### Unit Tests

```typescript
// Example test structure
describe('DependencyTreeProvider', () => {
  it('should parse simple include', () => {
    const content = '#Include utils.ahk';
    const includes = provider.parseIncludes(content);
    expect(includes).toEqual(['utils.ahk']);
  });

  it('should parse library include', () => {
    const content = '#Include <MyLib>';
    const includes = provider.parseIncludes(content);
    expect(includes).toEqual(['MyLib']);
  });

  it('should resolve relative path', async () => {
    const resolved = await provider.resolveInclude(
      'lib/utils.ahk',
      '/workspace/main.ahk'
    );
    expect(resolved).toBe('/workspace/lib/utils.ahk');
  });
});
```

### Integration Tests

```typescript
suite('Dependency Tree Integration', () => {
  test('should render tree for test workspace', async () => {
    const provider = new DependencyTreeProvider(context);
    const roots = await provider.getChildren();

    assert.strictEqual(roots.length, 4);
    assert.ok(roots.some(r => r.label === 'main.ahk'));
  });
});
```

## Sign-Off Criteria

Before considering the feature complete:

✅ All manual tests pass
✅ Works on Windows
✅ Works on WSL
✅ Works on Linux
✅ No console errors
✅ Documentation complete
✅ Example files provided
✅ Performance acceptable (<2s for 100 files)
✅ Error handling robust
✅ Code reviewed

## Next Steps

After testing:
1. Fix any discovered bugs
2. Add automated tests
3. Update changelog
4. Create release notes
5. Update README with feature description
