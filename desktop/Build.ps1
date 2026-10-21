$ErrorActionPreference = 'Stop'
$appFolder = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $appFolder
New-Item -ItemType Directory -Path runtime -Force | Out-Null
$nodeSource = (Get-Command node.exe -ErrorAction Stop).Source
Copy-Item -LiteralPath $nodeSource -Destination (Join-Path $appFolder 'runtime/node.exe') -Force
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object Drawing.Bitmap 256,256
$graphics = [Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([Drawing.Color]::FromArgb(18,133,116))
$pen = New-Object Drawing.Pen ([Drawing.Color]::White),13
$graphics.DrawEllipse($pen,46,46,164,164)
$graphics.FillEllipse([Drawing.Brushes]::White,87,87,82,82)
$bitmap.Save((Join-Path $appFolder 'public/root-icon.png'),[Drawing.Imaging.ImageFormat]::Png)
$handle = $bitmap.GetHicon()
$icon = [Drawing.Icon]::FromHandle($handle)
$stream = [IO.File]::Create((Join-Path $appFolder 'Root.ico'))
$icon.Save($stream)
$stream.Dispose()
$icon.Dispose()
$pen.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /win32icon:Root.ico /out:Root.exe (Join-Path $PSScriptRoot 'RootLauncher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Launcher build failed.' }
Write-Host 'Built Root.exe with bundled Node.js runtime.'
