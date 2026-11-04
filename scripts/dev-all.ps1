$backend = Join-Path $PSScriptRoot '..\..\NODE-API-BLOG' | Resolve-Path -ErrorAction Stop

docker compose -f "$backend\docker-compose.yml" up -d db db-test mailpit
if ($LASTEXITCODE -ne 0) {
  throw 'Não foi possível iniciar os serviços do backend. Verifique se o Docker Desktop está aberto e tente novamente.'
}

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; npm run dev"

$healthUrl = if ($env:BACKEND_URL) { "$($env:BACKEND_URL.TrimEnd('/'))/health" } else { 'http://localhost:3000/health' }
Write-Host "Aguardando a API em $healthUrl ..."
$ready = $false
for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
  try {
    $ready = (Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200
  } catch {
    Start-Sleep -Seconds 1
  }
}
if (-not $ready) {
  Write-Warning 'A API não respondeu em 60s; iniciando o frontend mesmo assim.'
}

Set-Location (Join-Path $PSScriptRoot '..')
npm run dev
