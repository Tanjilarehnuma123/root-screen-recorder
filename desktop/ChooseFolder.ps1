$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Choose where Root saves new recordings and MP4 exports'
$dialog.ShowNewFolderButton = $true
if ($env:ROOT_SAVE_FOLDER -and (Test-Path -LiteralPath $env:ROOT_SAVE_FOLDER)) { $dialog.SelectedPath = $env:ROOT_SAVE_FOLDER }
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.ShowInTaskbar = $false
$owner.WindowState = 'Minimized'
try {
    if ($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) {
        [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
        [Console]::Write($dialog.SelectedPath)
    }
} finally { $dialog.Dispose(); $owner.Dispose() }
