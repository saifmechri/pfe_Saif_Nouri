#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
from pathlib import Path

# Répertoire racine
PROJECT_ROOT = r"c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri"
EXCLUDE_PATTERNS = ["node_modules", "dist", "build", ".git", "__pycache__"]

# Dictionnaire des remplacements UTF-8 (mojibake → correct)
REPLACEMENTS = {
    # Caractères de base
    "vÃ©hicules": "véhicules",
    "vÃ©hicule": "véhicule",
    "VÃ©hicule": "Véhicule",
    "VÃ©hicules": "Véhicules",
    "Ã©tats": "états",
    "Ã‰tats": "États",
    "crÃ©ation": "création",
    "rÃ©cupÃ¨re": "récupère",
    "rÃ©cupÃ©rer": "récupérer",
    "rÃ©cupÃ©ration": "récupération",
    "modifiÃ©": "modifié",
    "modifÃ©e": "modifiée",
    "ajoutÃ©": "ajouté",
    "ajoutÃ©e": "ajoutée",
    "succÃ¨s": "succès",
    "supprimÃ©": "supprimé",
    "supprimÃ©e": "supprimée",
    "sÃ»r": "sûr",
    "crÃ©er": "créer",
    "CrÃ©er": "Créer",
    "CrÃ©ation": "Création",
    "crÃ©Ã©e": "créée",
    "crÃ©Ã©": "créé",
    "CrÃ©Ã©": "Créé",
    "sÃ©lectionner": "sélectionner",
    "SÃ©lectionner": "Sélectionner",
    "sÃ©lectionnÃ©e": "sélectionnée",
    "sÃ©lectionnÃ©": "sélectionné",
    "SÃ©lectionnÃ©": "Sélectionné",
    "RÃ©vision": "Révision",
    "rÃ©vision": "révision",
    "RÃ©paration": "Réparation",
    "rÃ©paration": "réparation",
    "KilomÃ©trage": "Kilométrage",
    "kilomÃ©trage": "kilométrage",
    "piÃ¨ce": "pièce",
    "piÃ¨ces": "pièces",
    "PiÃ¨ce": "Pièce",
    "PiÃ¨ces": "Pièces",
    "utilisÃ©e": "utilisée",
    "utilisÃ©es": "utilisées",
    "enregistrÃ©e": "enregistrée",
    "enregistrÃ©es": "enregistrées",
    "enregistrÃ©": "enregistré",
    "trouvÃ©": "trouvé",
    "trouvÃ©e": "trouvée",
    "trouvÃ©es": "trouvées",
    "Ã€": "À",
    "Ã ": "à",
    "dÃ©finir": "définir",
    "dÃ©finie": "définie",
    "dÃ©finies": "définies",
    "ConfirmÃ©": "Confirmé",
    "ConfirmÃ©e": "Confirmée",
    "confirmÃ©": "confirmé",
    "confirmÃ©e": "confirmée",
    "AnnulÃ©": "Annulé",
    "AnnulÃ©e": "Annulée",
    "annulÃ©": "annulé",
    "annulÃ©e": "annulée",
    "RefusÃ©": "Refusé",
    "RefusÃ©e": "Refusée",
    "refusÃ©": "refusé",
    "refusÃ©e": "refusée",
    "DÃ©finir": "Définir",
    "DÃ©connexion": "Déconnexion",
    "RÃ©server": "Réserver",
    "rÃ©server": "réserver",
    "RÃ©servation": "Réservation",
    "rÃ©servation": "réservation",
    "RÃ©servÃ©": "Réservé",
    "rÃ©servÃ©": "réservé",
    "rÃ©servÃ©e": "réservée",
    "gÃ©rez": "gérez",
    "GÃ©rez": "Gérez",
    "gÃ©nÃ©rales": "générales",
    "gÃ©nÃ©ral": "général",
    "gÃ©ographique": "géographique",
    "gÃ©ographiques": "géographiques",
    "DÃ©tails": "Détails",
    "dÃ©tails": "détails",
    "DÃ©tail": "Détail",
    "dÃ©tail": "détail",
    "affichÃ©": "affiché",
    "affichÃ©e": "affichée",
    "affichÃ©es": "affichées",
    "RÃ©initialiser": "Réinitialiser",
    "rÃ©initialiser": "réinitialiser",
    "RÃ©fÃ©rence": "Référence",
    "rÃ©fÃ©rence": "référence",
    "RÃ©fÃ©rences": "Références",
    "rÃ©fÃ©rences": "références",
    "conservÃ©e": "conservée",
    "conservÃ©es": "conservées",
    "modÃ¨le": "modèle",
    "ModÃ¨le": "Modèle",
    "modÃ¨les": "modèles",
    "CatÃ©gorie": "Catégorie",
    "catÃ©gorie": "catégorie",
    "CatÃ©gories": "Catégories",
    "catÃ©gories": "catégories",
    "IntÃ©rieur": "Intérieur",
    "intÃ©rieur": "intérieur",
    "Carrosserie latÃ©rale": "Carrosserie latérale",
    "latÃ©rale": "latérale",
    "TerminÃ©": "Terminé",
    "terminÃ©": "terminé",
    "prÃ©cisÃ©es": "précisées",
    "prÃ©cisÃ©e": "précisée",
    "prÃ©cisÃ©": "précisé",
    "TÃ©lÃ©phone": "Téléphone",
    "tÃ©lÃ©phone": "téléphone",
    "TÃ©lÃ©charger": "Télécharger",
    "tÃ©lÃ©charger": "télécharger",
    "RÃ©sultats": "Résultats",
    "rÃ©sultats": "résultats",
    "RÃ©sultat": "Résultat",
    "rÃ©sultat": "résultat",
    "EntitÃ©": "Entité",
    "entitÃ©": "entité",
    "EntitÃ©s": "Entités",
    "entitÃ©s": "entités",
    "compatibilitÃ©s": "compatibilités",
    "compatibilitÃ©": "compatibilité",
    "VÃ©hicules Compatibles": "Véhicules Compatibles",
    "Ã©chapper": "échapper",
    "Ã©lectrique": "électrique",
    "Ã©quipe": "équipe",
    "Ã©videmment": "évidemment",
    "Ã©videntes": "évidentes",
    "Ã©vidence": "évidence",
    "Ãªtre": "être",
    "cohÃ©rent": "cohérent",
    "cohÃ©rente": "cohérente",
    "identitÃ©": "identité",
    "identitÃ©s": "identités",
    "VÃ©rifier": "Vérifier",
    "vÃ©rifier": "vérifier",
    "vÃ©rifiÃ©e": "vérifiée",
    "vÃ©rifiÃ©es": "vérifiées",
    "AccÃ¨s": "Accès",
    "accÃ¨s": "accès",
    "interdit": "interdit",
    "interdite": "interdite",
    "ProposÃ©e": "Proposée",
    "proposÃ©e": "proposée",
    "proposÃ©": "proposé",
    "rÃ©ponse": "réponse",
    "RÃ©ponse": "Réponse",
    "rÃ©ponses": "réponses",
}

def should_process(file_path):
    """Vérifie si un fichier doit être traité"""
    path_str = str(file_path).lower()
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return False
    return file_path.suffix in ['.js', '.jsx']

def process_file(file_path):
    """Traite un fichier et corrige les encodages UTF-8"""
    try:
        # Lire le fichier en UTF-8
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Appliquer tous les remplacements
        for mojibake, correct in REPLACEMENTS.items():
            content = content.replace(mojibake, correct)
        
        # Écrire le fichier si des changements ont été faits
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, file_path.name
    except Exception as e:
        return None, str(e)
    
    return False, None

# Parcourir tous les fichiers
files_to_process = []
for root, dirs, files in os.walk(PROJECT_ROOT):
    # Filtrer les répertoires à exclure
    dirs[:] = [d for d in dirs if d not in EXCLUDE_PATTERNS]
    
    for file in files:
        file_path = Path(root) / file
        if should_process(file_path):
            files_to_process.append(file_path)

print(f"Nombre de fichiers à traiter: {len(files_to_process)}")
print("=" * 50)

files_corrected = 0
for i, file_path in enumerate(files_to_process):
    result, info = process_file(file_path)
    if result is True:
        files_corrected += 1
        print(f"✓ Corrigé: {info}")
    elif result is None:
        print(f"✗ Erreur: {info}")

print("=" * 50)
print(f"✓ Fichiers corrigés: {files_corrected}")
print(f"✓ Tâche terminée!")
print("=" * 50)
