const pkgPath = 'frontend/package.json';
$pkg = Get-Content -Raw $pkgPath | ConvertFrom-Json
$pkg | ConvertTo-Json -Depth 30 | Set-Content -Encoding utf8 $pkgPath
