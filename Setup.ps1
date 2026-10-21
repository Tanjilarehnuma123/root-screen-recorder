$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Force tools | Out-Null
function Fetch($Url, $File) { if (!(Test-Path -LiteralPath $File)) { Write-Host "Downloading $File"; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri $Url -OutFile "$File.download"; Move-Item -LiteralPath "$File.download" -Destination $File -Force } }
Fetch 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' 'tools/ffmpeg.zip'
if (!(Get-ChildItem tools -Recurse -Filter ffmpeg.exe)) { Expand-Archive -LiteralPath tools/ffmpeg.zip -DestinationPath tools/ffmpeg -Force }
Fetch 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.7.6/whisper-bin-x64.zip' 'tools/whisper.zip'
if (!(Get-ChildItem tools -Recurse -Filter whisper-cli.exe)) { Expand-Archive -LiteralPath tools/whisper.zip -DestinationPath tools/whisper -Force }
Fetch 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin' 'tools/ggml-base.en.bin'
Fetch 'https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.ttf' 'public/Inter.ttf'
Write-Host 'Setup complete. Double-click Start.cmd to open Root.'
