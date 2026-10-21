$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $root 'dist'

if (-not (Test-Path $distPath)) {
  throw "Build output not found at '$distPath'. Run the build first."
}

$packageJson = Get-Content (Join-Path $root 'package.json') | ConvertFrom-Json
$zipName = "avtonet-garaza-$($packageJson.version).zip"
$zipPath = Join-Path $root $zipName

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $distPath '*') -DestinationPath $zipPath -Force
Write-Output "Packaged extension: $zipPath"