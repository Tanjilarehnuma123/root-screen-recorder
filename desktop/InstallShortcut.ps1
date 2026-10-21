$ErrorActionPreference = 'Stop'
$appFolder = Split-Path -Parent $PSScriptRoot
$desktopFolder = 'C:\Users\DELL\Desktop'
if (!(Test-Path -LiteralPath $desktopFolder)) { throw 'Your Desktop folder was not found.' }
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $desktopFolder 'Root Screen Recorder.lnk'))
$shortcut.TargetPath = Join-Path $appFolder 'Root.exe'
$shortcut.WorkingDirectory = $appFolder
$shortcut.IconLocation = (Join-Path $appFolder 'Root.ico') + ',0'
$shortcut.Description = 'Record your screen locally with Root'
$shortcut.Save()
Write-Host ('Desktop shortcut created: ' + $shortcut.FullName)
