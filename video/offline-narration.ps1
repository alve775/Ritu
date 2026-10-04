$ErrorActionPreference = 'Stop'
$rituRoot = Split-Path $PSScriptRoot -Parent
$rituOut = Join-Path $rituRoot 'research/pitch'
$rituData = Get-Content (Join-Path $PSScriptRoot 'narration.json') -Raw | ConvertFrom-Json
$rituText = ($rituData.chunks | ForEach-Object { $_.text }) -join "`n`n"
[System.IO.File]::WriteAllText((Join-Path $rituOut 'speech.txt'), $rituText, [System.Text.UTF8Encoding]::new($false))
$rituManifest = @{ blocks = @(@{ vo_line = $rituText.Replace('Ritu', 'RITU') }) } | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $rituOut 'script_manifest.json'), $rituManifest, [System.Text.UTF8Encoding]::new($false))
Add-Type -AssemblyName System.Speech
$rituSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $rituSynth.SelectVoice('Microsoft Mark')
  $rituSynth.Rate = 0
  $rituSynth.Volume = 100
  $rituSynth.SetOutputToWaveFile((Join-Path $rituOut 'narration-raw.wav'))
  $rituSynth.Speak($rituText)
} finally { $rituSynth.Dispose() }
$rituFfmpeg = Join-Path $rituOut 'python-libs/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
& $rituFfmpeg -y -v warning -i (Join-Path $rituOut 'narration-raw.wav') -af 'loudnorm=I=-16:TP=-1.5:LRA=11' -ar 48000 -ac 1 (Join-Path $rituOut 'narration.wav')
if ($LASTEXITCODE -ne 0) { throw 'Narration normalization failed' }
ffprobe -v error -show_entries format=duration -of csv=p=0 (Join-Path $rituOut 'narration.wav')
