$backend = Join-Path $PSScriptRoot '..\..\NODE-API-BLOG' | Resolve-Path -ErrorAction Stop

docker compose -f "$backend\docker-compose.yml" up -d db db-test mailpit
if ($LASTEXITCODE -ne 0) {
  throw 'Não foi possível iniciar os serviços do backend. Verifique se o Docker Desktop está aberto e tente novamente.'
}

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; npm run dev"

Set-Location (Join-Path $PSScriptRoot '..')
npm run dev
