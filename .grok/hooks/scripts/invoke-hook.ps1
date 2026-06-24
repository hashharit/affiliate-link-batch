# OS-aware hook dispatcher. Windows → *.ps1; Unix → *.sh (pwsh fallback).
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Hook
)

$ScriptDir = $PSScriptRoot
$isWindows = $IsWindows -or $env:OS -eq 'Windows_NT'

if ($isWindows) {
    $target = Join-Path $ScriptDir "$Hook.ps1"
    if (-not (Test-Path $target)) { exit 0 }
    & $target
    exit $LASTEXITCODE
}

$bashTarget = Join-Path $ScriptDir "$Hook.sh"
if (Test-Path $bashTarget) {
    & bash $bashTarget
    exit $LASTEXITCODE
}

$psTarget = Join-Path $ScriptDir "$Hook.ps1"
if (Test-Path $psTarget) {
    & $psTarget
    exit $LASTEXITCODE
}

exit 0