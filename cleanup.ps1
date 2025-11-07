# Repository Cleanup Script
# Safely removes obsolete files and directories identified in cleanup analysis

param(
    [switch]$DryRun,
    [switch]$NoConfirm
)

$script:deletedCount = 0
$script:freedSpace = 0
$script:errors = @()

function Write-Header {
    param([string]$Text)
    Write-Host "`n─ " -NoNewline -ForegroundColor DarkGray
    Write-Host $Text -NoNewline -ForegroundColor White
    Write-Host " ────────────────────────────────" -ForegroundColor DarkGray
}

function Write-Item {
    param(
        [string]$Status,
        [string]$Path,
        [string]$Size = ""
    )

    $statusColor = switch ($Status) {
        "DELETE" { "Yellow" }
        "DELETED" { "Green" }
        "ERROR" { "Red" }
        "SKIP" { "DarkGray" }
        default { "White" }
    }

    Write-Host "🟨 " -NoNewline
    Write-Host $Status -ForegroundColor $statusColor
    Write-Host $Path -ForegroundColor Gray
    if ($Size) {
        Write-Host "  $Size" -ForegroundColor DarkGray
    }
}

function Get-ItemSize {
    param([string]$Path)

    if (Test-Path $Path -PathType Container) {
        $size = (Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue |
                 Measure-Object -Property Length -Sum).Sum
    } else {
        $size = (Get-Item $Path -Force -ErrorAction SilentlyContinue).Length
    }

    if ($size -gt 1MB) {
        return "{0:N2} MB" -f ($size / 1MB)
    } elseif ($size -gt 1KB) {
        return "{0:N2} KB" -f ($size / 1KB)
    } else {
        return "$size bytes"
    }
}

function Remove-ItemSafe {
    param(
        [string]$Path,
        [string]$Description
    )

    if (-not (Test-Path $Path)) {
        Write-Item "SKIP" $Path "Not found"
        return
    }

    $size = Get-ItemSize $Path

    if ($DryRun) {
        Write-Item "DELETE" $Path $size
        return
    }

    try {
        Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
        Write-Item "DELETED" $Path $size
        $script:deletedCount++
        $script:freedSpace += (Get-Item $Path -Force -ErrorAction SilentlyContinue).Length
    } catch {
        Write-Item "ERROR" $Path $_.Exception.Message
        $script:errors += @{Path = $Path; Error = $_.Exception.Message}
    }
}

# Main execution
Write-Header "REPOSITORY CLEANUP"

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN MODE - No files will be deleted`n" -ForegroundColor Cyan
} elseif (-not $NoConfirm) {
    Write-Host "`n⚠️  This will permanently delete obsolete files." -ForegroundColor Yellow
    $response = Read-Host "Continue? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Red
        exit 0
    }
}

Write-Header "DELETING: VS Code History"
Remove-ItemSafe ".\.history" "VS Code local history (648 files, ~4MB)"

Write-Header "DELETING: Obsolete Status Documents"
$statusDocs = @(
    ".\Status_v0.4.3.md",
    ".\Status_v0.4.3_BackupBeforeMajorRefactor.md",
    ".\Status_v0.4.3_BeforeParticipantRemoval.md",
    ".\Status_v0.4.3_ClaudeModelOptimization.md",
    ".\Status_v0.4.3_EnhancedChatParticipant.md",
    ".\Status_v0.4.3_FinalSnapshot.md",
    ".\Status_v0.4.3_GitCleanupSnapshot.md",
    ".\Status_v0.4.3_PostLibraryAttributionFix.md",
    ".\Status_v0.4.3_PostParticipantCleanup.md",
    ".\Status_v0.4.3_PostRefactor.md",
    ".\Status_v0.4.3_PreAttributionParticipantUpdate.md",
    ".\Status_v0.4.3_PreModelUpdate.md",
    ".\Status_v0.4.3_PreParticipantRemoval.md",
    ".\Status_v0.4.3_PreRefactor.md",
    ".\Status_v0.4.3_RefactorCheckpoint.md",
    ".\Status_v0.4.3_WorkingBaseline.md"
)
foreach ($doc in $statusDocs) {
    Remove-ItemSafe $doc "Obsolete v0.4.3 status document"
}

Write-Header "DELETING: Blocker/Frustration Documents"
$blockerDocs = @(
    ".\Blockers.md",
    ".\frustrations.md",
    ".\No Claude.md",
    ".\Workflow_BLOCKER.md"
)
foreach ($doc in $blockerDocs) {
    Remove-ItemSafe $doc "Obsolete blocker document"
}

Write-Header "DELETING: Temporary Files"
Remove-ItemSafe ".\Test.txt" "Temporary test file"
Remove-ItemSafe ".\Untitled-1.txt" "Temporary file"
Remove-ItemSafe ".\nul" "Null device file"

Write-Header "DELETING: Empty Test Files"
Remove-ItemSafe ".\Test_v2.ahk" "Empty test file"

Write-Header "DELETING: Log Files"
Remove-ItemSafe ".\logs\mcp-debug.log" "MCP debug log"
Remove-ItemSafe ".\vendor\debug.log" "Vendor debug log"
Remove-ItemSafe ".\vendor\error.log" "Vendor error log"

# Summary
Write-Header "SUMMARY"

if ($DryRun) {
    Write-Host "`n✓ Dry run completed" -ForegroundColor Green
    Write-Host "Run without -DryRun to perform actual deletions`n" -ForegroundColor Cyan
} else {
    Write-Host "`n✓ Deleted: " -NoNewline -ForegroundColor Green
    Write-Host "$script:deletedCount items" -ForegroundColor White

    if ($script:errors.Count -gt 0) {
        Write-Host "✗ Errors: " -NoNewline -ForegroundColor Red
        Write-Host "$($script:errors.Count) items" -ForegroundColor White
        Write-Host "`nFailed deletions:" -ForegroundColor Yellow
        foreach ($err in $script:errors) {
            Write-Host "  $($err.Path): $($err.Error)" -ForegroundColor DarkGray
        }
    }

    Write-Host "`nCleanup complete!`n" -ForegroundColor Green
}
