#!/usr/bin/env pwsh

param(
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$OutputDir = Join-Path (Join-Path $RepoRoot ".tmp") "uat-full"
$CliPath = Join-Path (Join-Path (Join-Path (Join-Path $RepoRoot "apps") "cli") "dist") "index.js"

if (-not (Test-Path $CliPath)) {
    Write-Error "CLI not found at $CliPath. Run 'npm run build' first."
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$script:Steps = New-Object System.Collections.ArrayList
$script:AllPassed = $true
$script:TotalSteps = 12

function Add-StepRecord {
    param(
        [int]$Step,
        [string]$Name,
        [bool]$Ok,
        [object]$Operation,
        [bool]$RequestIdPresent,
        [bool]$ReceiptPresent,
        [bool]$HangOrTimeout,
        [int]$ElapsedMs,
        [int]$ExitCode
    )

    $record = [pscustomobject]@{
        step = $Step
        name = $Name
        ok = $Ok
        operation = $Operation
        request_id_present = $RequestIdPresent
        receipt_present = $ReceiptPresent
        hang_or_timeout = $HangOrTimeout
        elapsed_ms = $ElapsedMs
        exit_code = $ExitCode
    }

    [void]$script:Steps.Add($record)
}

function Invoke-UATStep {
    param(
        [string]$Name,
        [string[]]$Arguments,
        [int]$Timeout = $TimeoutSeconds
    )

    $StepNum = $script:Steps.Count + 1
    $StdoutFile = Join-Path $OutputDir ("{0:D2}-{1}.stdout.json" -f $StepNum, $Name)
    $StderrFile = Join-Path $OutputDir ("{0:D2}-{1}.stderr.log" -f $StepNum, $Name)

    Remove-Item -Force $StdoutFile, $StderrFile -ErrorAction SilentlyContinue

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    $argList = @(("`"{0}`"" -f $CliPath)) + $Arguments

    $process = Start-Process -FilePath "node" -ArgumentList $argList -WorkingDirectory $RepoRoot -RedirectStandardOutput $StdoutFile -RedirectStandardError $StderrFile -PassThru -NoNewWindow

    $completed = $process.WaitForExit($Timeout * 1000)

    if (-not $completed) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        $sw.Stop()
        Add-StepRecord -Step $StepNum -Name $Name -Ok $false -Operation $null -RequestIdPresent $false -ReceiptPresent $false -HangOrTimeout $true -ElapsedMs ([int]$sw.ElapsedMilliseconds) -ExitCode -1
        $script:AllPassed = $false
        return $null
    }

    $sw.Stop()

    $stdout = ""
    if (Test-Path $StdoutFile) {
        $stdout = Get-Content -Raw -Path $StdoutFile
    }

    $parsed = $null
    $ok = $false
    $operation = $null
    $requestIdPresent = $false
    $receiptPresent = $false

    if ($stdout -and $stdout.Trim().Length -gt 0) {
        try {
            $parsed = $stdout | ConvertFrom-Json -ErrorAction Stop
            $ok = ($parsed.ok -eq $true)
            $operation = $parsed.operation
            $requestIdPresent = ($parsed.PSObject.Properties.Name -contains "request_id") -and (-not [string]::IsNullOrWhiteSpace([string]$parsed.request_id))
            $receiptPresent = ($parsed.PSObject.Properties.Name -contains "receipt") -and ($null -ne $parsed.receipt)
        } catch {
            $ok = $false
        }
    }

    if (-not $ok) {
        $script:AllPassed = $false
    }

    Add-StepRecord -Step $StepNum -Name $Name -Ok $ok -Operation $operation -RequestIdPresent $requestIdPresent -ReceiptPresent $receiptPresent -HangOrTimeout $false -ElapsedMs ([int]$sw.ElapsedMilliseconds) -ExitCode $process.ExitCode

    return $parsed
}

$null = Invoke-UATStep -Name "bridge-start" -Arguments @("bridge", "start", "--mode", "gui", "--verbose")
$null = Invoke-UATStep -Name "bridge-status" -Arguments @("bridge", "status", "--verbose")
$null = Invoke-UATStep -Name "bridge-logs" -Arguments @("bridge", "logs", "--tail", "40")
$null = Invoke-UATStep -Name "bridge-operations" -Arguments @("bridge", "operations", "--verbose")
$null = Invoke-UATStep -Name "scene-inspect" -Arguments @("scene", "inspect", "--verbose")
$null = Invoke-UATStep -Name "object-create" -Arguments @("object", "create", "--type", "cube", "--name", "test_cube", "--location", "0,0,1", "--scale", "1,1,1", "--verbose")
$null = Invoke-UATStep -Name "material-create" -Arguments @("material", "create", "--name", "test_material", "--color", "#ff0000", "--roughness", "0.5", "--metallic", "0", "--verbose")
$null = Invoke-UATStep -Name "material-apply" -Arguments @("material", "apply", "--object", "test_cube", "--material", "test_material", "--verbose")
$null = Invoke-UATStep -Name "validate-scene" -Arguments @("validate", "scene", "--preset", "basic", "--verbose")

$dryRun = Invoke-UATStep -Name "batch-dry-run" -Arguments @("batch", "execute", "--file", "examples/batch/basic-scene.json", "--dry-run", "--verbose")

if ($dryRun -and $dryRun.ok -and $dryRun.data -and $dryRun.data.dry_run_id -and $dryRun.data.plan_fingerprint) {
    $null = Invoke-UATStep -Name "batch-real" -Arguments @("batch", "execute", "--file", "examples/batch/basic-scene.json", "--confirm", "EXECUTE_BATCH", "--dry-run-id", [string]$dryRun.data.dry_run_id, "--plan-fingerprint", [string]$dryRun.data.plan_fingerprint, "--verbose")
} else {
    Add-StepRecord -Step 11 -Name "batch-real" -Ok $false -Operation $null -RequestIdPresent $false -ReceiptPresent $false -HangOrTimeout $false -ElapsedMs 0 -ExitCode -1
    $script:AllPassed = $false
}

$null = Invoke-UATStep -Name "bridge-stop" -Arguments @("bridge", "stop", "--verbose")

$totalElapsed = ($script:Steps | Measure-Object -Property elapsed_ms -Sum).Sum
if ($null -eq $totalElapsed) {
    $totalElapsed = 0
}

$summary = [pscustomobject]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    total_steps = $script:Steps.Count
    passed = ($script:Steps | Where-Object { $_.ok }).Count
    failed = ($script:Steps | Where-Object { -not $_.ok }).Count
    total_elapsed_ms = [int]$totalElapsed
    all_passed = $script:AllPassed
    steps = $script:Steps
}

$summaryPath = Join-Path $OutputDir "summary.json"
$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $summaryPath -Encoding UTF8

$script:Steps |
    Select-Object step, name, ok, operation, request_id_present, receipt_present, hang_or_timeout, elapsed_ms |
    Format-Table -AutoSize

Write-Host ("summary_path={0}" -f $summaryPath)

if ($script:AllPassed) {
    exit 0
}

exit 1
