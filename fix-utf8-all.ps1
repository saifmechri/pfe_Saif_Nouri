# Script de correction complète des encodages UTF-8
# Cible tous les fichiers .js et .jsx du projet

$ProjectRoot = "c:\Users\ASUS\Desktop\pfe nouri-saif\pfe_Saif_Nouri"
$ExcludePatterns = @("node_modules", "dist", "build", ".git", ".vscode")

# Récupérer tous les fichiers .js et .jsx
$files = @()
Get-ChildItem -Path $ProjectRoot -Include "*.js", "*.jsx" -Recurse | ForEach-Object {
    $shouldExclude = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($_.FullName -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    if (-not $shouldExclude) {
        $files += $_
    }
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Nombre de fichiers à traiter: $($files.Count)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Dictionnaire des remplacements (mojibake UTF-8 -> caractères corrects)
$replacements = @{
    "Ã©" = "é"
    "Ã " = "à"
    "Ã¨" = "è"
    "Ã¢" = "â"
    "Ê" = "ê"
    "Ã¬" = "ì"
    "Ã¯" = "ï"
    "Ã´" = "ô"
    "Ã¹" = "ù"
    "Ã»" = "û"
    "Ã§" = "ç"
    "Ã " = "à"
    "É" = "É"
    "È" = "È"
    "Ê" = "Ê"
    "vÃ©hicules" = "véhicules"
    "vÃ©hicule" = "véhicule"
    "VÃ©hicule" = "Véhicule"
    "VÃ©hicules" = "Véhicules"
    "Ã©tats" = "états"
    "Ã‰tats" = "États"
    "crÃ©ation" = "création"
    "rÃ©cupÃ¨re" = "récupère"
    "rÃ©cupÃ©rer" = "récupérer"
    "rÃ©cupÃ©ration" = "récupération"
    "modifiÃ©" = "modifié"
    "modifÃ©e" = "modifiée"
    "ajoutÃ©" = "ajouté"
    "ajoutÃ©e" = "ajoutée"
    "succÃ¨s" = "succès"
    "supprimÃ©" = "supprimé"
    "supprimÃ©e" = "supprimée"
    "sÃ»r" = "sûr"
    "crÃ©er" = "créer"
    "CrÃ©er" = "Créer"
    "CrÃ©ation" = "Création"
    "dÃ©finir" = "définir"
    "dÃ©finie" = "définie"
    "dÃ©finies" = "définies"
    "piÃ¨ce" = "pièce"
    "piÃ¨ces" = "pièces"
    "PiÃ¨ce" = "Pièce"
    "PiÃ¨ces" = "Pièces"
    "RÃ©vision" = "Révision"
    "rÃ©vision" = "révision"
    "RÃ©paration" = "Réparation"
    "rÃ©paration" = "réparation"
    "KilomÃ©trage" = "Kilométrage"
    "kilomÃ©trage" = "kilométrage"
    "parallÃ©lisme" = "parallélisme"
    "Ã©quilibrage" = "équilibrage"
    "gÃ©omÃ©trie" = "géométrie"
    "dÃ©fauts" = "défauts"
    "dÃ©marreur" = "démarreur"
    "tÃ´lerie" = "tôlerie"
    "dÃ©bosselage" = "débosselage"
    "crÃ©maillÃ¨re" = "crémaillère"
    "boÃ®te" = "boîte"
    "Ã©chappement" = "échappement"
    "catalyseur" = "catalyseur"
    "pollution" = "pollution"
    "Ã©lectricitÃ©" = "électricité"
    "Ã©lectrique" = "électrique"
    "cÃ¢blage" = "câblage"
    "fusible" = "fusible"
    "gÃ©nÃ©rales" = "générales"
    "gÃ©nÃ©ral" = "général"
    "GÃ©nÃ©ral" = "Général"
    "gÃ©ographique" = "géographique"
    "gÃ©ographiques" = "géographiques"
    "zone gÃ©ographique" = "zone géographique"
    "DÃ©tails" = "Détails"
    "dÃ©tails" = "détails"
    "DÃ©tail" = "Détail"
    "dÃ©tail" = "détail"
    "affichÃ©" = "affiché"
    "affichÃ©e" = "affichée"
    "affichÃ©es" = "affichées"
    "affichÃ©s" = "affichés"
    "RÃ©initialiser" = "Réinitialiser"
    "rÃ©initialiser" = "réinitialiser"
    "RÃ©fÃ©rence" = "Référence"
    "rÃ©fÃ©rence" = "référence"
    "RÃ©fÃ©rences" = "Références"
    "rÃ©fÃ©rences" = "références"
    "modÃ¨le" = "modèle"
    "ModÃ¨le" = "Modèle"
    "modÃ¨les" = "modèles"
    "CatÃ©gorie" = "Catégorie"
    "catÃ©gorie" = "catégorie"
    "CatÃ©gories" = "Catégories"
    "catÃ©gories" = "catégories"
    "IntÃ©rieur" = "Intérieur"
    "intÃ©rieur" = "intérieur"
    "latÃ©rale" = "latérale"
    "latÃ©ral" = "latéral"
    "TerminÃ©" = "Terminé"
    "terminÃ©" = "terminé"
    "TerminÃ©e" = "Terminée"
    "terminÃ©e" = "terminée"
    "prÃ©cisÃ©es" = "précisées"
    "prÃ©cisÃ©e" = "précisée"
    "prÃ©cisÃ©" = "précisé"
    "TÃ©lÃ©phone" = "Téléphone"
    "tÃ©lÃ©phone" = "téléphone"
    "RÃ©sultats" = "Résultats"
    "rÃ©sultats" = "résultats"
    "RÃ©sultat" = "Résultat"
    "rÃ©sultat" = "résultat"
    "EntitÃ©" = "Entité"
    "entitÃ©" = "entité"
    "EntitÃ©s" = "Entités"
    "entitÃ©s" = "entités"
    "compatibilitÃ©s" = "compatibilités"
    "compatibilitÃ©" = "compatibilité"
    "VÃ©hicules Compatibles" = "Véhicules Compatibles"
    "Ãªtre" = "être"
    "accÃ¨s" = "accès"
    "AccÃ¨s" = "Accès"
    "RÃ©ponse" = "Réponse"
    "rÃ©ponse" = "réponse"
    "RÃ©ponses" = "Réponses"
    "rÃ©ponses" = "réponses"
    "sÃ©lectionnÃ©" = "sélectionné"
    "sÃ©lectionnÃ©e" = "sélectionnée"
    "proposÃ©" = "proposé"
    "proposÃ©e" = "proposée"
    "ProposÃ©e" = "Proposée"
    "ProposÃ©" = "Proposé"
    "utilisÃ©" = "utilisé"
    "utilisÃ©e" = "utilisée"
    "utilisÃ©es" = "utilisées"
    "trouvÃ©" = "trouvé"
    "trouvÃ©e" = "trouvée"
    "trouvÃ©es" = "trouvées"
    "enregistrÃ©" = "enregistré"
    "enregistrÃ©e" = "enregistrée"
    "enregistrÃ©es" = "enregistrées"
    "confirmÃ©" = "confirmé"
    "confirmÃ©e" = "confirmée"
    "ConfirmÃ©" = "Confirmé"
    "ConfirmÃ©e" = "Confirmée"
    "annulÃ©" = "annulé"
    "annulÃ©e" = "annulée"
    "AnnulÃ©" = "Annulé"
    "AnnulÃ©e" = "Annulée"
    "refusÃ©" = "refusé"
    "refusÃ©e" = "refusée"
    "RefusÃ©" = "Refusé"
    "RefusÃ©e" = "Refusée"
}

$filesProcessed = 0
$totalReplacements = 0

foreach ($file in $files) {
    try {
        # Lire le contenu du fichier en UTF-8
        $content = Get-Content -Path $file.FullName -Encoding UTF8 -Raw
        $originalContent = $content
        
        # Appliquer tous les remplacements
        foreach ($pattern in $replacements.GetEnumerator()) {
            if ($content -contains $pattern.Name -or $content -like "*$($pattern.Name)*") {
                $oldLength = $content.Length
                $content = $content -replace [regex]::Escape($pattern.Name), $pattern.Value
                if ($oldLength -ne $content.Length) {
                    $totalReplacements++
                }
            }
        }
        
        # Écrire le fichier si des changements ont été faits
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $filesProcessed++
            Write-Host "✓ Corrigé: $($file.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ Erreur avec $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Fichiers corrigés: $filesProcessed" -ForegroundColor Green
Write-Host "Remplacements effectués: $totalReplacements" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
