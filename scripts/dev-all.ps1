$backend = Join-Path $PSScriptRoot '..\..\NODE-API-BLOG' | Resolve-Path

docker compose -f "$backend\docker-compose.yml" up -d db db-test

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; npm run dev"

Set-Location (Join-Path $PSScriptRoot '..')
npm run dev
