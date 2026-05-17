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
    "véhicules": "véhicules",
    "véhicule": "véhicule",
    "Véhicule": "Véhicule",
    "Véhicules": "Véhicules",
    "états": "états",
    "Ã‰tats": "États",
    "création": "création",
    "récupère": "récupère",
    "récupérer": "récupérer",
    "récupération": "récupération",
    "modifié": "modifié",
    "modifée": "modifiée",
    "ajouté": "ajouté",
    "ajoutée": "ajoutée",
    "succès": "succès",
    "supprimé": "supprimé",
    "supprimée": "supprimée",
    "sûr": "sûr",
    "créer": "créer",
    "Créer": "Créer",
    "Création": "Création",
    "créée": "créée",
    "créé": "créé",
    "Créé": "Créé",
    "sélectionner": "sélectionner",
    "Sélectionner": "Sélectionner",
    "sélectionnée": "sélectionnée",
    "sélectionné": "sélectionné",
    "Sélectionné": "Sélectionné",
    "Révision": "Révision",
    "révision": "révision",
    "Réparation": "Réparation",
    "réparation": "réparation",
    "Kilométrage": "Kilométrage",
    "kilométrage": "kilométrage",
    "pièce": "pièce",
    "pièces": "pièces",
    "Pièce": "Pièce",
    "Pièces": "Pièces",
    "utilisée": "utilisée",
    "utilisées": "utilisées",
    "enregistrée": "enregistrée",
    "enregistrées": "enregistrées",
    "enregistré": "enregistré",
    "trouvé": "trouvé",
    "trouvée": "trouvée",
    "trouvées": "trouvées",
    "Ã€": "À",
    "Ã ": "à",
    "définir": "définir",
    "définie": "définie",
    "définies": "définies",
    "Confirmé": "Confirmé",
    "Confirmée": "Confirmée",
    "confirmé": "confirmé",
    "confirmée": "confirmée",
    "Annulé": "Annulé",
    "Annulée": "Annulée",
    "annulé": "annulé",
    "annulée": "annulée",
    "Refusé": "Refusé",
    "Refusée": "Refusée",
    "refusé": "refusé",
    "refusée": "refusée",
    "Définir": "Définir",
    "Déconnexion": "Déconnexion",
    "Réserver": "Réserver",
    "réserver": "réserver",
    "Réservation": "Réservation",
    "réservation": "réservation",
    "Réservé": "Réservé",
    "réservé": "réservé",
    "réservée": "réservée",
    "gérez": "gérez",
    "Gérez": "Gérez",
    "générales": "générales",
    "général": "général",
    "géographique": "géographique",
    "géographiques": "géographiques",
    "Détails": "Détails",
    "détails": "détails",
    "Détail": "Détail",
    "détail": "détail",
    "affiché": "affiché",
    "affichée": "affichée",
    "affichées": "affichées",
    "Réinitialiser": "Réinitialiser",
    "réinitialiser": "réinitialiser",
    "Référence": "Référence",
    "référence": "référence",
    "Références": "Références",
    "références": "références",
    "conservée": "conservée",
    "conservées": "conservées",
    "modèle": "modèle",
    "Modèle": "Modèle",
    "modèles": "modèles",
    "Catégorie": "Catégorie",
    "catégorie": "catégorie",
    "Catégories": "Catégories",
    "catégories": "catégories",
    "Intérieur": "Intérieur",
    "intérieur": "intérieur",
    "Carrosserie latérale": "Carrosserie latérale",
    "latérale": "latérale",
    "Terminé": "Terminé",
    "terminé": "terminé",
    "précisées": "précisées",
    "précisée": "précisée",
    "précisé": "précisé",
    "Téléphone": "Téléphone",
    "téléphone": "téléphone",
    "Télécharger": "Télécharger",
    "télécharger": "télécharger",
    "Résultats": "Résultats",
    "résultats": "résultats",
    "Résultat": "Résultat",
    "résultat": "résultat",
    "Entité": "Entité",
    "entité": "entité",
    "Entités": "Entités",
    "entités": "entités",
    "compatibilités": "compatibilités",
    "compatibilité": "compatibilité",
    "Véhicules Compatibles": "Véhicules Compatibles",
    "échapper": "échapper",
    "électrique": "électrique",
    "équipe": "équipe",
    "évidemment": "évidemment",
    "évidentes": "évidentes",
    "évidence": "évidence",
    "être": "être",
    "cohérent": "cohérent",
    "cohérente": "cohérente",
    "identité": "identité",
    "identités": "identités",
    "Vérifier": "Vérifier",
    "vérifier": "vérifier",
    "vérifiée": "vérifiée",
    "vérifiées": "vérifiées",
    "Accès": "Accès",
    "accès": "accès",
    "interdit": "interdit",
    "interdite": "interdite",
    "Proposée": "Proposée",
    "proposée": "proposée",
    "proposé": "proposé",
    "réponse": "réponse",
    "Réponse": "Réponse",
    "réponses": "réponses",
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
