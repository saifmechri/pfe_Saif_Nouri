# Script de correction complète des encodages UTF-8
# Cible tous les fichiers .js et .jsx du projet

$ProjectRoot = "c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri"
$ExcludePatterns = @("node_modules", "dist", "build", ".git")

# Définir l'encodage UTF-8 sans BOM
[System.Text.Encoding]::UTF8 | Out-Null

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

Write-Host "Nombre de fichiers à traiter: $($files.Count)" -ForegroundColor Cyan

# Dictionnaire des remplacements (mojibake UTF-8 -> caractères corrects)
$replacements = @{
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
    "crÃ©Ã©e" = "créée"
    "crÃ©Ã©" = "créé"
    "crÃ©ÃŠ" = "créé"
    "CrÃ©Ã©" = "Créé"
    "sÃ©lectionner" = "sélectionner"
    "SÃ©lectionner" = "Sélectionner"
    "sÃ©lectionner" = "sélectionner"
    "SÃ©lectionnÃ©e" = "Sélectionnée"
    "sÃ©lectionnÃ©" = "sélectionné"
    "SÃ©lectionnÃ©" = "Sélectionné"
    "sÃ©lectionnÃ©es" = "sélectionnées"
    "sÃ©lectionnÃ©s" = "sélectionnés"
    "révisÃ©" = "révisé"
    "RÃ©vision" = "Révision"
    "rÃ©vision" = "révision"
    "RÃ©paration" = "Réparation"
    "rÃ©paration" = "réparation"
    "KilomÃ©trage" = "Kilométrage"
    "kilomÃ©trage" = "kilométrage"
    "piÃ¨ce" = "pièce"
    "piÃ¨ces" = "pièces"
    "PiÃ¨ce" = "Pièce"
    "PiÃ¨ces" = "Pièces"
    "utilisÃ©e" = "utilisée"
    "utilisÃ©es" = "utilisées"
    "enregistrÃ©e" = "enregistrée"
    "enregistrÃ©es" = "enregistrées"
    "enregistrÃ©" = "enregistré"
    "trouvÃ©" = "trouvé"
    "trouvÃ©e" = "trouvée"
    "trouvÃ©es" = "trouvées"
    "trouvÃ©s" = "trouvés"
    "Aucun" = "Aucun"
    "Ã€" = "À"
    "Ã " = "à"
    "dÃ©finir" = "définir"
    "dÃ©finie" = "définie"
    "dÃ©finies" = "définies"
    "ConfirmÃ©" = "Confirmé"
    "ConfirmÃ©e" = "Confirmée"
    "ConfirmÃ©es" = "Confirmées"
    "confirmÃ©" = "confirmé"
    "confirmÃ©e" = "confirmée"
    "confirmÃ©es" = "confirmées"
    "AnnulÃ©" = "Annulé"
    "AnnulÃ©e" = "Annulée"
    "AnnulÃ©es" = "Annulées"
    "annulÃ©" = "annulé"
    "annulÃ©e" = "annulée"
    "annulÃ©es" = "annulées"
    "RefusÃ©" = "Refusé"
    "RefusÃ©e" = "Refusée"
    "RefusÃ©es" = "Refusées"
    "refusÃ©" = "refusé"
    "refusÃ©e" = "refusée"
    "refusÃ©es" = "refusées"
    "DÃ©finir" = "Définir"
    "DÃ©connexion" = "Déconnexion"
    "RÃ©server" = "Réserver"
    "rÃ©server" = "réserver"
    "RÃ©servation" = "Réservation"
    "rÃ©servation" = "réservation"
    "RÃ©servÃ©" = "Réservé"
    "rÃ©servÃ©" = "réservé"
    "rÃ©servÃ©e" = "réservée"
    "RÃ©servÃ©e" = "Réservée"
    "gérez" = "gérez"
    "gÃ©rez" = "gérez"
    "GÃ©rez" = "Gérez"
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
    "conservÃ©e" = "conservée"
    "conservÃ©es" = "conservées"
    "modÃ¨le" = "modèle"
    "ModÃ¨le" = "Modèle"
    "modÃ¨les" = "modèles"
    "CatÃ©gorie" = "Catégorie"
    "catÃ©gorie" = "catégorie"
    "CatÃ©gories" = "Catégories"
    "catÃ©gories" = "catégories"
    "IntÃ©rieur" = "Intérieur"
    "intÃ©rieur" = "intérieur"
    "Carrosserie latÃ©rale" = "Carrosserie latérale"
    "latÃ©rale" = "latérale"
    "latÃ©ral" = "latéral"
    "TerminÃ©" = "Terminé"
    "terminÃ©" = "terminé"
    "TerminÃ©e" = "Terminée"
    "terminÃ©e" = "terminée"
    "prÃ©cisÃ©es" = "précisées"
    "prÃ©cisÃ©e" = "précisée"
    "prÃ©cisÃ©" = "précisé"
    "précisÃ©e" = "précisée"
    "PrÃ©c" = "Préc"
    "prÃ©c" = "préc"
    "TÃ©lÃ©phone" = "Téléphone"
    "tÃ©lÃ©phone" = "téléphone"
    "tÃ©lÃ©phones" = "téléphones"
    "TÃ©lÃ©charger" = "Télécharger"
    "tÃ©lÃ©charger" = "télécharger"
    "CSV" = "CSV"
    "RÃ©sultats" = "Résultats"
    "rÃ©sultats" = "résultats"
    "RÃ©sultat" = "Résultat"
    "rÃ©sultat" = "résultat"
    "EntitÃ©" = "Entité"
    "entitÃ©" = "entité"
    "EntitÃ©s" = "Entités"
    "entitÃ©s" = "entités"
    "comparaison" = "comparaison"
    "compatibilitÃ©s" = "compatibilités"
    "compatible" = "compatible"
    "compatibles" = "compatibles"
    "compatibilitÃ©" = "compatibilité"
    "Compatibles" = "Compatibles"
    "VÃ©hicules Compatibles" = "Véhicules Compatibles"
    "Ã©chapper" = "échapper"
    "Ã©lectrique" = "électrique"
    "Ã©quipe" = "équipe"
    "Ã©videment" = "évidemment"
    "Ã©videntes" = "évidentes"
    "Ã©vidence" = "évidence"
    "RÃ©initialiserÃ  la" = "Réinitialiser à la"
    "RÃ©initialiserÃ " = "Réinitialiser à"
    "Ã " = "à"
    "Ã " = "à"
    "Ã  " = "à "
    " Ã " = " à"
    "Ãªtre" = "être"
    "Ãªtre" = "être"
    "Est-ce" = "Est-ce"
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
    "Ä€" = "Ā"
    "compatibilitÃ©" = "compatibilité"
    "compatibilitÃ©s" = "compatibilités"
    "cohÃ©rent" = "cohérent"
    "cohÃ©rente" = "cohérente"
    "cohÃ©rentes" = "cohérentes"
    "identitÃ©" = "identité"
    "identitÃ©s" = "identités"
    "visuelle" = "visuelle"
    "visuelles" = "visuelles"
    "visuels" = "visuels"
    "plateforme" = "plateforme"
    "espace" = "espace"
    "filtres" = "filtres"
    "filtrÃ©es" = "filtrées"
    "filtrÃ©s" = "filtrés"
    "VÃ©rifier" = "Vérifier"
    "vÃ©rifier" = "vérifier"
    "vÃ©rifiÃ©e" = "vérifiée"
    "vÃ©rifiÃ©es" = "vérifiées"
    "AccÃ¨s" = "Accès"
    "accÃ¨s" = "accès"
    "interdire" = "interdire"
    "interdit" = "interdit"
    "interdite" = "interdite"
    "interdites" = "interdites"
    "AccÃ¨s interdit" = "Accès interdit"
    "accÃ¨s interdit" = "accès interdit"
    "InterventionController" = "InterventionController"
    "Intervention" = "Intervention"
    "intervention" = "intervention"
    "interventions" = "interventions"
    "interventionÂ" = "intervention"
    "rendez-vous" = "rendez-vous"
    "Rendez-vous" = "Rendez-vous"
    "RENDEZ-VOUS" = "RENDEZ-VOUS"
    "rendez-vous" = "rendez-vous"
    "Rendez-Vous" = "Rendez-vous"
    "successfully" = "successively"
    "Choisir â€¢" = "Choisir •"
    "Choisir â€¢ CatÃ©gories" = "Choisir • Catégories"
    "Choisir â€¢ Zone" = "Choisir • Zone"
    "zone gÃ©ographique" = "zone géographique"
    "sÃ©lectionnÃ©" = "sélectionné"
    "ProposÃ©e" = "Proposée"
    "proposÃ©e" = "proposée"
    "proposÃ©" = "proposé"
    "ProposÃ©" = "Proposé"
    "proposÃ©es" = "proposées"
    "proposÃ©s" = "proposés"
    "AutomobilistÂ" = "Automobiliste"
    "AutomobilistÂ" = "Automobiliste"
    "automobilistÂ" = "automobiliste"
    "automobilistÂe" = "automobiliste"
    "automobilistÂe" = "automobiliste"
    "automobilisteÂ" = "automobiliste"
    "rÃ©ponse" = "réponse"
    "RÃ©ponse" = "Réponse"
    "rÃ©ponses" = "réponses"
    "RÃ©ponses" = "Réponses"
    "raison" = "raison"
    "raisons" = "raisons"
}

$filesProcessed = 0
$replacementsCount = 0

foreach ($file in $files) {
    try {
        # Lire le contenu du fichier en UTF-8
        $content = Get-Content -Path $file.FullName -Encoding UTF8 -Raw
        $originalContent = $content
        
        # Appliquer tous les remplacements
        foreach ($pattern in $replacements.GetEnumerator()) {
            if ($content -like "*$($pattern.Name)*") {
                $content = $content -replace [regex]::Escape($pattern.Name), $pattern.Value
            }
        }
        
        # Écrire le fichier si des changements ont été faits
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $filesProcessed++
            $countDiff = ($originalContent.Length - $content.Length)
            Write-Host "✓ Corrigé: $($file.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ Erreur avec $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "✓ Fichiers corrigés: $filesProcessed" -ForegroundColor Green
Write-Host "✓ Tâche terminée!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
