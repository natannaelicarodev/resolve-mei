# Mede o custo de frame de um fluxo de navegacao, sem depender de gesto humano.
#
# O toque manual variava a ponto de tres leituras do mesmo binario devolverem
# 90o percentil entre 42ms e 117ms - ruido maior que qualquer ganho que se
# queira comprovar. Aqui o estimulo e sempre identico: mesmas coordenadas,
# mesmo intervalo, mesma contagem.
#
# Uso:
#   .\scripts\measure-nav.ps1 -Label "antes"
#   .\scripts\measure-nav.ps1 -Label "depois" -Cycles 10

param(
  [string]$Label = 'run',
  [int]$Cycles = 10,
  [int]$SettleMs = 1200,
  [string]$Package = 'com.anonymous.resolvemei',
  [ValidateSet('Clients','Agenda','Quotes','Services','Expenses','Result','Onboarding')]
  [string]$Target = 'Clients',
  [ValidateSet('keep','light','dark')][string]$Theme = 'keep'
)

$ErrorActionPreference = 'Stop'
$adb = 'C:\Users\useradmin\AppData\Local\Android\Sdk\platform-tools\adb.exe'

# Coordenadas conferidas contra captura de tela real neste aparelho (1080x2340).
$homeTab    = @(136, 2142)
$clients = @(743, 2142)
$agenda = @(338, 2142)
$quotes = @(202, 1396)
$services = @(540, 1396)
$expenses = @(878, 1396)
$result = @(777, 1681)

function Tap($point) {
  & $adb shell input tap $point[0] $point[1] | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

function ResetHome {
  & $adb shell am start -a android.intent.action.VIEW -d 'resolvemei://home' |
    Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

function OpenTarget {
  switch ($Target) {
    'Clients' { Tap $clients }
    'Agenda' { Tap $agenda }
    'Quotes' { Tap $quotes }
    'Services' { Tap $services }
    'Expenses' { Tap $expenses }
    'Result' {
      Tap $expenses
      Tap $result
    }
    'Onboarding' {
      & $adb shell am start -a android.intent.action.VIEW -d 'resolvemei://onboarding' |
        Out-Null
      Start-Sleep -Milliseconds $SettleMs
    }
  }
}

function ReturnHome {
  if ($Target -eq 'Agenda' -or $Target -eq 'Clients') {
    Tap $homeTab
    return
  }

  & $adb shell input keyevent KEYCODE_BACK | Out-Null
  Start-Sleep -Milliseconds $SettleMs
  if ($Target -eq 'Result') {
    & $adb shell input keyevent KEYCODE_BACK | Out-Null
    Start-Sleep -Milliseconds $SettleMs
  }
}

# Sombra e paleta mudam entre os temas, entao o custo de frame pode mudar junto.
if ($Theme -ne 'keep') {
  & $adb shell "cmd uimode night $(if ($Theme -eq 'dark') { 'yes' } else { 'no' })" | Out-Null
  Start-Sleep -Seconds 3
}

# Parte da Home e garante que a tela assentou antes de zerar os contadores.
ResetHome
Start-Sleep -Milliseconds 600
& $adb shell dumpsys gfxinfo $Package reset | Out-Null

for ($i = 1; $i -le $Cycles; $i++) {
  OpenTarget
  ReturnHome
}

# Deixa o ultimo frame terminar antes de ler.
Start-Sleep -Milliseconds 800

$raw = & $adb shell dumpsys gfxinfo $Package
$wanted = 'Total frames rendered', 'Janky frames', 'percentile',
          'Number Missed Vsync', 'Number Slow UI thread',
          'Number Slow bitmap uploads', 'Total attached Views'

Write-Output "=== $Label ($Cycles ciclos Home <-> $Target) ==="
$raw | Select-String -Pattern ($wanted -join '|') | ForEach-Object {
  Write-Output $_.Line.Trim()
}

# Uma execucao em que os toques erraram o alvo rende poucos frames e percentis
# altissimos - parece regressao sem ser. Marcar aqui evita comparar contra ela.
$frames = ($raw | Select-String -Pattern 'Total frames rendered: (\d+)').Matches.Groups[1].Value
if ([int]$frames -lt ($Cycles * 100)) {
  Write-Output ''
  Write-Output "AVISO: apenas $frames frames para $Cycles ciclos. Amostra curta demais - repita antes de comparar."
}
