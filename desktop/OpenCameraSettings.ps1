param([ValidateSet('browser','windows')][string]$Kind = 'browser')
$ErrorActionPreference = 'Stop'
if ($Kind -eq 'windows') { Start-Process 'ms-settings:privacy-webcam' -WindowStyle Normal; exit }
$paths = @(
 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
 'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
 'C:\Program Files\Google\Chrome\Application\chrome.exe',
 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
foreach ($browserPath in $paths) {
 if (Test-Path -LiteralPath $browserPath) {
  $url = if ($browserPath -like '*msedge.exe') { 'edge://settings/content/camera' } else { 'chrome://settings/content/camera' }
  Start-Process -FilePath $browserPath -ArgumentList $url -WindowStyle Normal
  exit
 }
}
throw 'Open your browser settings manually and search for camera permissions.'
