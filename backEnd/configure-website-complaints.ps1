$ErrorActionPreference = 'Stop'
$crmEnv = Join-Path $PSScriptRoot '.env'
$cametEnv = 'C:\Users\hp\Desktop\camet_official_web\backend\.env'
function Read-Setting($file, $name) {
  foreach ($line in [IO.File]::ReadAllLines($file)) {
    if ($line -match ('^\s*' + [regex]::Escape($name) + '\s*=\s*(.*?)\s*$')) { return $Matches[1].Trim('"', "'") }
  }
  return ''
}
function Add-Setting($file, $name, $value) {
  if (-not (Read-Setting $file $name)) {
    $content = [IO.File]::ReadAllText($file)
    $pattern = '(?m)^\s*' + [regex]::Escape($name) + '\s*=.*$'
    if ([regex]::IsMatch($content, $pattern)) { $content = [regex]::Replace($content, $pattern, "$name=$value") }
    else { $content = $content.TrimEnd() + "`r`n$name=$value`r`n" }
    [IO.File]::WriteAllText($file, $content, [Text.UTF8Encoding]::new($false))
  }
}
$crmKey = Read-Setting $crmEnv 'CAMET_COMPLAINT_API_KEY'
$cametKey = Read-Setting $cametEnv 'CAMET_COMPLAINT_API_KEY'
if ($crmKey -and $cametKey -and $crmKey -cne $cametKey) { throw 'The configured complaint keys differ.' }
$key = if ($crmKey) { $crmKey } elseif ($cametKey) { $cametKey } else {
  $bytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}
if ($key.Length -lt 32) { throw 'The complaint API key must contain at least 32 characters.' }
$crmPort = Read-Setting $crmEnv 'PORT'
if ($crmPort -notmatch '^\d{2,5}$') { throw 'CRM PORT is missing or invalid.' }
Add-Setting $crmEnv 'CAMET_COMPLAINT_API_KEY' $key
Add-Setting $cametEnv 'CAMET_COMPLAINT_API_KEY' $key
Add-Setting $cametEnv 'CRM_COMPLAINT_API_URL' "http://127.0.0.1:$crmPort/api/website-complaints"
Add-Setting $crmEnv 'COMPLAINT_BRANCH_NAME' 'CAMET'
$recipient = Read-Setting $cametEnv 'CONTACT_EMAIL_TO'
if (-not $recipient) { $recipient = 'Admin@camet.in' }
Add-Setting $crmEnv 'COMPLAINT_NOTIFY_EMAIL' $recipient
Write-Output 'Configured matching private complaint credentials and the local CRM connection. Restart both backends to load the settings.'
