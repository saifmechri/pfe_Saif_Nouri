# Script pour corriger TOUS les encodages UTF-8 dans le projet entier

$projectRoot = 'C:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri'
Set-Location $projectRoot

$correctedCount = 0

# Patterns de correction
$patterns = @(
    @{old = "vÃ©hicules"; new = "véhicules"},
    @{old = "vÃ©hicule"; new = "véhicule"},
    @{old = "enregistrÃ©es"; new = "enregistrées"},
    @{old = "enregistrÃ©e"; new = "enregistrée"},
    @{old = "enregistrÃ©"; new = "enregistré"},
    @{old = "modifiÃ©"; new = "modifié"},
    @{old = "modifiÃ©e"; new = "modifiée"},
    @{old = "ajoutÃ©"; new = "ajouté"},
    @{old = "ajoutÃ©e"; new = "ajoutée"},
    @{old = "supprimÃ©"; new = "supprimé"},
    @{old = "supprimÃ©e"; new = "supprimée"},
    @{old = "trouvÃ©es"; new = "trouvées"},
    @{old = "trouvÃ©e"; new = "trouvée"},
    @{old = "trouvÃ©"; new = "trouvé"},
    @{old = "rÃ©cupÃ¨re"; new = "récupère"},
    @{old = "piÃ¨ces"; new = "pièces"},
    @{old = "piÃ¨ce"; new = "pièce"},
    @{old = "ÃŠtes"; new = "Êtes"},
    @{old = "sÃ»r"; new = "sûr"},
    @{old = "RÃ©fÃ©rence"; new = "Référence"},
    @{old = "conservÃ©e"; new = "conservée"},
    @{old = "renseignÃ©"; new = "renseigné"},
    @{old = "renseignÃ©e"; new = "renseignée"},
    @{old = "succÃ¨s"; new = "succès"},
    @{old = "AccÃ¨s"; new = "Accès"},
    @{old = "rÃ©servÃ©"; new = "réservé"},
    @{old = "rÃ©servÃ©e"; new = "réservée"},
    @{old = "PrÃ©sentation"; new = "Présentation"},
    @{old = "VÃ©hicules"; new = "Véhicules"},
    @{old = "VÃ©hicule"; new = "Véhicule"},
    @{old = "Ã "; new = "à"},
    @{old = "VÃ©rifiez"; new = "Vérifiez"},
    @{old = "rÃ©visÃ©es"; new = "révisées"},
    @{old = "rÃ©visÃ©"; new = "révisé"},
    @{old = "aprÃ¨s"; new = "après"},
    @{old = "mÃ©caniques"; new = "mécaniques"},
    @{old = "mÃ©canique"; new = "mécanique"},
    @{old = "critÃ¨res"; new = "critères"},
    @{old = "personnalisÃ©es"; new = "personnalisées"},
    @{old = "personnalisÃ©e"; new = "personnalisée"},
    @{old = "urgente"; new = "urgente"},
    @{old = "rÃ©vision"; new = "révision"},
    @{old = "Ã©"; new = "é"},
    @{old = "Ã©e"; new = "ée"},
    @{old = "onsultez"; new = "onsultez"},
    @{old = "gÃ©rez"; new = "gérez"},
    @{old = "RÃ©server"; new = "Réserver"},
    @{old = "rÃ©server"; new = "réserver"},
    @{old = "Ã©tats"; new = "états"},
    @{old = "SÃ©lectionner"; new = "Sélectionner"},
    @{old = "sÃ©lectionner"; new = "sélectionner"},
    @{old = "prÃ©fÃ©rÃ©"; new = "préféré"},
    @{old = "prÃ©fÃ©rÃ©e"; new = "préférée"},
    @{old = "Garantie"; new = "Garantie"},
    @{old = "occasionÂ"; new = "occasion"},
    @{old = "occasions"; new = "occasions"},
    @{old = "inaccessible"; new = "inaccessible"},
    @{old = "rÃ©"; new = "ré"}
)

# Trouve tous les fichiers JS et JSX
$allFiles = Get-ChildItem -Recurse -Filter "*.js" -File | Where-Object {
    $_.FullName -notmatch 'node_modules|\\dist\\|\\build\\'
}
$allFiles += Get-ChildItem -Recurse -Filter "*.jsx" -File | Where-Object {
    $_.FullName -notmatch 'node_modules|\\dist\\|\\build\\'
}

Write-Host "Correction des encodages UTF-8 dans $($allFiles.Count) fichiers"
Write-Host "================================================`n"

foreach ($file in $allFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction Stop
        $originalContent = $content
        
        # Applique toutes les corrections
        foreach ($pattern in $patterns) {
            $content = $content -replace [regex]::Escape($pattern.old), $pattern.new
        }
        
        # Si du contenu a changé, sauvegarde le fichier
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -ErrorAction Stop
            $correctedCount++
            Write-Host "✅ Corrigé: $($file.Name)"
        }
    }
    catch {
        Write-Host "⚠️  Erreur: $($file.Name)"
    }
}

Write-Host "`n================================================"
Write-Host "✅ Fichiers corrigés: $correctedCount"
Write-Host "✅ Tâche terminée!"
