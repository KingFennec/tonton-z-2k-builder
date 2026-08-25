$ErrorActionPreference = "Stop"

Write-Host "=== Tonton-Z 2K Builder — validation locale ===" -ForegroundColor Cyan

Write-Host "Node:" -ForegroundColor Yellow
node --version
Write-Host "npm:" -ForegroundColor Yellow
npm --version

Write-Host "`n[1/3] Installation propre..." -ForegroundColor Cyan
npm ci

Write-Host "`n[2/3] Vérification des données APK..." -ForegroundColor Cyan
npm run verify:apk

Write-Host "`n[3/3] Build de production..." -ForegroundColor Cyan
npm run build

Write-Host "`nOK : le build local est valide." -ForegroundColor Green
Write-Host "Pour tester le build : npm run preview" -ForegroundColor Green
