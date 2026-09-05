# Captura seis traces Perfetto: Home -> Agenda e Agenda -> Home, com tres
# processos novos por direcao. Requer APK release/profileable ja instalado.
param(
  [string]$Package = 'com.anonymous.resolvemei',
  [string]$MacroDroidPackage = 'com.arlosoft.macrodroid',
  [string]$OutputDirectory = 'artifacts/perfetto/agenda',
  [int]$SettleMs = 1500,
  [int]$TraceSeconds = 8
)

$ErrorActionPreference = 'Stop'

function Resolve-Adb {
  $command = Get-Command adb -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $candidates = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe",
    "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe"
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }
  throw 'adb nao encontrado. Instale/configure o Android SDK antes da captura.'
}

$adb = Resolve-Adb
$devices = & $adb devices
$connected = @($devices | Select-String "\tdevice$")
if ($connected.Count -ne 1) {
  throw "Esperado exatamente 1 dispositivo adb conectado; encontrados $($connected.Count)."
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

# Evita que automacoes contaminem scheduling e input durante toda a bateria.
& $adb shell am force-stop $MacroDroidPackage | Out-Null

$homePoint = @(136, 2142)
$agenda = @(338, 2142)

function Start-FreshHome {
  & $adb shell am force-stop $Package | Out-Null
  Start-Sleep -Milliseconds 500
  & $adb shell am start -W -a android.intent.action.VIEW -d 'resolvemei://home' $Package | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

function Tap([int[]]$Point) {
  & $adb shell input tap $Point[0] $Point[1] | Out-Null
}

function Capture-One([string]$Direction, [int]$Round) {
  Start-FreshHome
  if ($Direction -eq 'agenda-home') {
    Tap $agenda
    Start-Sleep -Milliseconds $SettleMs
  }

  $remote = "/data/misc/perfetto-traces/tavi-$Direction-$Round.perfetto-trace"
  $arguments = @(
    'shell', 'perfetto', '-o', $remote, '-t', "${TraceSeconds}s", '-b', '64mb',
    'sched', 'freq', 'idle', 'am', 'wm', 'gfx', 'view', 'binder_driver', 'hal', 'dalvik'
  )
  $capture = Start-Process -FilePath $adb -ArgumentList $arguments -PassThru -WindowStyle Hidden
  Start-Sleep -Milliseconds 1200

  if ($Direction -eq 'home-agenda') { Tap $agenda } else { Tap $homePoint }
  Start-Sleep -Milliseconds $SettleMs
  $capture.WaitForExit()
  if ($capture.ExitCode -ne 0) {
    throw "Perfetto falhou em $Direction, rodada $Round (exit $($capture.ExitCode))."
  }

  $local = Join-Path $OutputDirectory "tavi-$Direction-$Round.perfetto-trace"
  & $adb pull $remote $local | Out-Null
  & $adb shell rm $remote | Out-Null
  Write-Output $local
}

foreach ($round in 1..3) {
  Capture-One 'home-agenda' $round
  Capture-One 'agenda-home' $round
}

Write-Output 'Captura concluida. Abra os seis arquivos no Perfetto UI ou Android Studio System Trace.'
