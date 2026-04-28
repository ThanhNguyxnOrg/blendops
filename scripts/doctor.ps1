#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$CliPath = Join-Path $RepoRoot "apps\cli\dist\index.js"
$McpPath = Join-Path $RepoRoot "apps\mcp-server\dist\index.js"

Write-Host "BlendOps Doctor - Installation Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$script:AllPassed = $true

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [string]$Recommendation
    )

    Write-Host "Checking: $Name..." -NoNewline

    try {
        $result = & $Check
        if ($result) {
            Write-Host " OK" -ForegroundColor Green
            if ($SuccessMessage) {
                Write-Host "  $SuccessMessage" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            if ($FailureMessage) {
                Write-Host "  $FailureMessage" -ForegroundColor Yellow
            }
            if ($Recommendation) {
                Write-Host "  -> $Recommendation" -ForegroundColor Cyan
            }
            $script:AllPassed = $false
            return $false
        }
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Yellow
        if ($Recommendation) {
            Write-Host "  -> $Recommendation" -ForegroundColor Cyan
        }
        $script:AllPassed = $false
        return $false
    }
}

Write-Host "Environment Checks" -ForegroundColor Yellow
Write-Host "------------------" -ForegroundColor Yellow

$null = Test-Check -Name "Node.js version >= 18" -Check {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)\.") {
        $major = [int]$Matches[1]
        return $major -ge 18
    }
    return $false
} -SuccessMessage "Node.js $(node --version) detected" -FailureMessage "Node.js not found or version less than 18" -Recommendation "Install Node.js 18+ from https://nodejs.org/"

$null = Test-Check -Name "npm available" -Check {
    $null = npm --version 2>$null
    return $?
} -SuccessMessage "npm $(npm --version) detected" -FailureMessage "npm not found" -Recommendation "Install npm or ensure it is in PATH"

Write-Host ""
Write-Host "Build Artifacts" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow

$null = Test-Check -Name "CLI built" -Check {
    Test-Path $CliPath
} -SuccessMessage "CLI found at apps/cli/dist/index.js" -FailureMessage "CLI not built" -Recommendation "Run: npm run build"

$null = Test-Check -Name "MCP server built" -Check {
    Test-Path $McpPath
} -SuccessMessage "MCP server found at apps/mcp-server/dist/index.js" -FailureMessage "MCP server not built" -Recommendation "Run: npm run build"

Write-Host ""
Write-Host "Blender Detection" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Yellow

$blenderPath = $env:BLENDOPS_BLENDER_PATH
if (-not $blenderPath) {
    $commonPaths = @(
        "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 3.6\blender.exe"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $blenderPath = $path
            break
        }
    }
}

$null = Test-Check -Name "Blender executable" -Check {
    if ($blenderPath -and (Test-Path $blenderPath)) {
        return $true
    }
    return $false
} -SuccessMessage "Blender found at $blenderPath" -FailureMessage "Blender not found in common locations" -Recommendation "Set BLENDOPS_BLENDER_PATH or use --blender flag"

Write-Host ""
Write-Host "Bridge Status" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow

if (Test-Path $CliPath) {
    $null = Test-Check -Name "Bridge status command invocation" -Check {
        $doctorOutputDir = Join-Path $RepoRoot ".tmp\blendops"
        New-Item -ItemType Directory -Force -Path $doctorOutputDir | Out-Null

        $stdoutFile = Join-Path $doctorOutputDir "doctor-bridge-status.stdout.txt"
        $stderrFile = Join-Path $doctorOutputDir "doctor-bridge-status.stderr.txt"
        Remove-Item -Force $stdoutFile, $stderrFile -ErrorAction SilentlyContinue

        $argList = @("`"$CliPath`"", "bridge", "status")
        $process = Start-Process -FilePath "node" -ArgumentList $argList -WorkingDirectory $RepoRoot -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile -PassThru -NoNewWindow
        $process.WaitForExit() | Out-Null

        $stdout = ""
        if (Test-Path $stdoutFile) {
            $stdout = Get-Content -Raw -Path $stdoutFile
        }

        $stderr = ""
        if (Test-Path $stderrFile) {
            $stderr = Get-Content -Raw -Path $stderrFile
        }

        if ($stdout) {
            $parsed = $stdout | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($parsed -and (($parsed.operation -eq "bridge.status") -or ($parsed.operation -eq "bridge.error"))) {
                return $true
            }
        }

        if ($stderr -match "bridge connection error|fetch failed|bridge\.status") {
            return $true
        }

        return $false
    } -SuccessMessage "Bridge status command returned expected structured output or bridge-down signal" -FailureMessage "Bridge status command did not produce expected output" -Recommendation "Run: node apps/cli/dist/index.js bridge start --mode gui --verbose"
} else {
    Write-Host "Checking: Bridge status command invocation... SKIP" -ForegroundColor Gray
    Write-Host "  Skipped (CLI not built)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Recommendations" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow

if ($script:AllPassed) {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  - Run UAT: npm run uat" -ForegroundColor Gray
    Write-Host "  - Link CLI: npm link" -ForegroundColor Gray
    Write-Host "  - Test command: blendops --help" -ForegroundColor Gray
} else {
    Write-Host "Some checks failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix issues above, then re-run: npm run doctor" -ForegroundColor Cyan
}

Write-Host ""

if ($script:AllPassed) {
    exit 0
}

exit 1
