# Models Layer

Ce dossier centralise l'acces aux donnees (SQL/DB) pour garder des controleurs plus lisibles.

Objectif:
- Ne pas changer la logique metier existante.
- Isoler progressivement les requetes SQL dans des modules reutilisables.

Modules actuels:
- `user.model.js`: utilisateurs et roles (auth / role checks)
- `garage.model.js`: identifiants garage et ownership

Note:
- Migration douce: on deplace les acces data petit a petit sans casser les routes existantes.
