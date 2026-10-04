[CmdletBinding()]
param([switch]$CheckRemote)

# Read-only preparation check. Does not install, stage, commit, push, or deploy.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$script:ReadinessFailures = 0

function Show-Check {
    param(
        [ValidateSet('PASS', 'WARN', 'FAIL', 'INFO')][string]$State,
        [string]$Message
    )
    Write-Output "[$State] $Message"
    if ($State -eq 'FAIL') { $script:ReadinessFailures++ }
}

function Invoke-Probe {
    param([string]$Executable, [string[]]$Parameters)
    try {
        $probeOutput = & $Executable @Parameters 2>&1 | ForEach-Object { "$_" }
        $probeExitCode = $LASTEXITCODE
        if ($null -eq $probeExitCode) { $probeExitCode = 0 }
        return [pscustomobject]@{
            Success = ($probeExitCode -eq 0)
            Output = (($probeOutput -join "`n").Trim())
        }
    } catch {
        return [pscustomobject]@{ Success = $false; Output = $_.Exception.Message }
    }
}

Write-Output "Development preparation check: $projectRoot"

$nodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nodeCommand) {
    $nodeProbe = Invoke-Probe -Executable $nodeCommand.Source -Parameters @('--version')
    if ($nodeProbe.Success) { Show-Check PASS "Node: $($nodeProbe.Output)" }
    else { Show-Check FAIL 'Node was found but its version check failed.' }
} else {
    Show-Check FAIL 'Node is not available on PATH.'
}

$npmCommand = Get-Command npm -ErrorAction SilentlyContinue | Select-Object -First 1
$npmReady = $false
if ($npmCommand) {
    $npmProbe = Invoke-Probe -Executable $npmCommand.Source -Parameters @('--version')
    if ($npmProbe.Success) {
        Show-Check PASS "npm: $($npmProbe.Output)"
        $npmReady = $true
    }
}

if (-not $npmReady -and $nodeCommand) {
    $nodeDirectory = Split-Path -Parent $nodeCommand.Source
    $bundledNpmCli = Join-Path $nodeDirectory 'node_modules\npm\bin\npm-cli.js'
    if (Test-Path -LiteralPath $bundledNpmCli -PathType Leaf) {
        $bundledNpmProbe = Invoke-Probe -Executable $nodeCommand.Source -Parameters @($bundledNpmCli, '--version')
        if ($bundledNpmProbe.Success) {
            Show-Check WARN 'The default npm launcher failed in this runner; bundled npm works. Check a normal terminal before changing the installation.'
            Show-Check PASS "Bundled npm: $($bundledNpmProbe.Output)"
            $npmReady = $true
        }
    }
}
if (-not $npmReady) { Show-Check FAIL 'No working npm command was verified.' }

$gitCommand = Get-Command git -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($gitCommand) {
    $gitProbe = Invoke-Probe -Executable $gitCommand.Source -Parameters @('--version')
    if ($gitProbe.Success) { Show-Check PASS $gitProbe.Output }
    else { Show-Check FAIL 'Git was found but its version check failed.' }

    $rootProbe = Invoke-Probe -Executable $gitCommand.Source -Parameters @('-C', $projectRoot, 'rev-parse', '--show-toplevel')
    if ($rootProbe.Success -and ([IO.Path]::GetFullPath($rootProbe.Output) -eq [IO.Path]::GetFullPath($projectRoot))) {
        Show-Check PASS 'This folder is the Git repository root.'
    } else { Show-Check FAIL 'This folder is not the expected Git repository root.' }

    $remoteProbe = Invoke-Probe -Executable $gitCommand.Source -Parameters @('-C', $projectRoot, 'remote', 'get-url', 'origin')
    if ($remoteProbe.Success -and $remoteProbe.Output -match '^https://github\.com/alve775/Ritu(?:\.git)?/?$') {
        Show-Check PASS 'origin points to alve775/Ritu.'
    } else { Show-Check FAIL 'origin does not match the expected Ritu repository.' }

    foreach ($identitySetting in @('user.name', 'user.email')) {
        $identityProbe = Invoke-Probe -Executable $gitCommand.Source -Parameters @('-C', $projectRoot, 'config', $identitySetting)
        if ($identityProbe.Success -and $identityProbe.Output) { Show-Check PASS "Git $identitySetting is configured; value omitted." }
        else { Show-Check WARN "Git $identitySetting is not configured. Set your own identity before an authorized commit." }
    }

    if ($CheckRemote -and $remoteProbe.Success) {
        $networkProbe = Invoke-Probe -Executable $gitCommand.Source -Parameters @('-C', $projectRoot, 'ls-remote', 'origin')
        if ($networkProbe.Success) {
            Show-Check PASS 'Remote read access works; an empty result is valid for an empty repository.'
        } else { Show-Check FAIL 'Remote read failed. Check connectivity and access in a normal terminal.' }
    } else { Show-Check INFO 'Remote network access was not checked; use -CheckRemote to check it.' }
} else { Show-Check FAIL 'Git is not available on PATH.' }

Show-Check INFO 'Application builds, framework compatibility, deployment access, and event registration are not validated by this script.'
if ($script:ReadinessFailures -gt 0) {
    Write-Output "Result: $script:ReadinessFailures failed development checks."
    exit 1
}
Write-Output 'Result: development prerequisites passed; review any warnings.'
exit 0
