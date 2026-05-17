Set-Location "$PSScriptRoot"

$map = [ordered]@{
  'âœ“'='✅'; 'âœ•'='❌'; 'â³'='⏳'; 'â€”'='—'; 'Â·'='·'
  'â€¹'='‹'; 'â€º'='›'; 'â†’'='→'
  'ðŸª'='🏪'; 'ðŸ’¸'='💸'; 'ðŸŸ§'='🟧'; 'ðŸ’¬'='💬'
  'ðŸ”'='🔍'; 'ðŸ”§'='🔧'; 'ðŸ“¦'='📦'; 'ðŸ“ž'='📞'; 'ðŸ“…'='📅'
  'ðŸš—'='🚗'; 'ðŸš˜'='🚘'; 'ðŸš™'='🚙'; 'ðŸš©'='🚩'
  'ðŸ› '='🛠'; 'ðŸ›‘'='🛑'; 'ðŸª‘'='🪑'; 'ðŸ§©'='🧩'; 'ðŸ§°'='🧰'; 'ðŸ§´'='🧴'
  'ðŸ”‹'='🔋'; 'âš™'='⚙'; 'âš '='⚠'; 'â„'='❄'; 'â­'='⭐'; 'â­•'='⭕'; 'â“˜'='ⓘ'; 'ðŸ·'='🏷'
  'Ã '='à'; 'Ã¢'='â'; 'Ã¤'='ä'; 'Ã§'='ç'; 'Ã©'='é'; 'Ã¨'='è'; 'Ãª'='ê'; 'Ã«'='ë'
  'Ã®'='î'; 'Ã¯'='ï'; 'Ã´'='ô'; 'Ã¶'='ö'; 'Ã¹'='ù'; 'Ã»'='û'; 'Ã¼'='ü'; 'Ã±'='ñ'
  'prÃªt'='prêt'; 'PrÃªt'='Prêt'; 'dÃ©jÃ '='déjà'; 'Ãªtre'='être'; 'Ã '='à'
}

$roots = @('frontend\src', 'backend')
$includes = @('*.js','*.jsx','*.ts','*.tsx','*.json','*.md')
$changed = 0

$files = foreach ($root in $roots) {
  Get-ChildItem $root -Recurse -File -Include $includes | Where-Object {
    $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\uploads\\' -and
    $_.Name -notlike '*.bak'
  }
}

foreach ($file in $files) {
  $text = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  $newText = $text

  foreach ($k in $map.Keys) {
    $newText = $newText -replace [regex]::Escape($k), $map[$k]
  }

  if ($newText -ne $text) {
    Set-Content -Path $file.FullName -Value $newText -Encoding UTF8
    $changed++
    Write-Output "Fixed: $($file.FullName)"
  }
}

Write-Output "Total changed: $changed"
