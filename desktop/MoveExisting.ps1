$ErrorActionPreference = 'Stop'
$appFolder = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$sourceFolder = [IO.Path]::GetFullPath((Join-Path $appFolder 'recordings'))
$configPath = Join-Path $appFolder 'storage.json'
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$targetFolder = [IO.Path]::GetFullPath($config.directory)
if ($targetFolder -ne 'C:\Users\DELL\Desktop\New folder') { throw 'The selected folder changed. No files were moved.' }
if (!(Test-Path -LiteralPath $targetFolder)) { New-Item -ItemType Directory -Path $targetFolder | Out-Null }
if (!(Test-Path -LiteralPath $targetFolder -PathType Container)) { throw 'The destination is not a folder.' }
$names = @('276bc683-b90e-4fa7-ac54-aeb585357d25.webm','5c5e3dd2-1093-4efb-b7f1-7bee359d0226.webm')
$items = foreach ($name in $names) {
    $source = [IO.Path]::GetFullPath((Join-Path $sourceFolder $name))
    $destination = [IO.Path]::GetFullPath((Join-Path $targetFolder $name))
    if ([IO.Path]::GetDirectoryName($source) -ne $sourceFolder -or [IO.Path]::GetDirectoryName($destination) -ne $targetFolder) { throw 'Unsafe move path.' }
    if (!(Test-Path -LiteralPath $source -PathType Leaf)) { throw "Recording is missing: $name" }
    if (Test-Path -LiteralPath $destination) { throw "A file with the same name exists: $name. No overwrite permitted." }
    [pscustomobject]@{Name=$name;Source=$source;Destination=$destination;Hash=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash}
}
Copy-Item -LiteralPath $configPath -Destination (Join-Path $appFolder 'storage.before-move.json') -Force
$connections = Get-NetTCPConnection -LocalPort 4783 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
    $serviceProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($connection.OwningProcess)"
    if ($serviceProcess.Name -eq 'node.exe' -and $serviceProcess.CommandLine -match 'server\.mjs') { Stop-Process -Id $serviceProcess.ProcessId -Force }
}
try {
    foreach ($item in $items) {
        Move-Item -LiteralPath $item.Source -Destination $item.Destination
        if ((Get-FileHash -LiteralPath $item.Destination -Algorithm SHA256).Hash -ne $item.Hash) { throw "File verification failed: $($item.Name)" }
        $config.files | Add-Member -NotePropertyName $item.Name -NotePropertyValue $targetFolder -Force
        [IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 10), (New-Object Text.UTF8Encoding $false))
        Write-Host "Moved and verified: $($item.Name)"
    }
} finally {
    Start-Process -FilePath (Join-Path $appFolder 'runtime\node.exe') -ArgumentList ('"' + (Join-Path $appFolder 'server.mjs') + '"') -WorkingDirectory $appFolder -WindowStyle Hidden
}
Write-Host "Saved in: $targetFolder"
