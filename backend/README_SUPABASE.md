# Backend migration Supabase (sans Sequelize)

## Objectif
Migrer le backend pour utiliser PostgreSQL Supabase sans ORM Sequelize.

## Ce qui a ete modifie

1. Connexion base de donnees
- Fichier: db.js
- Sequelize supprime.
- Connexion unique via pg Pool avec DATABASE_URL Supabase.
- Ajout de:
  - testConnection(): verifie la connexion.
  - initDatabase(): cree/verifie les tables et colonnes necessaires.

2. Demarrage serveur
- Fichier: server.js
- Suppression de sequelize.authenticate() et sequelize.sync().
- Ajout du bootstrap SQL:
  - test de connexion PostgreSQL
  - initialisation du schema compatible
- Ajout de la route recommandations:
  - /api/recommendations

3. Controleurs migres en SQL (pg)
- Fichier: controllers/pieceController.js
  - CRUD pieces en SQL brut.
- Fichier: controllers/interventionController.js
  - CRUD interventions en SQL brut.
  - gestion des pieces d intervention en SQL brut.
  - recalcul cout_total via SQL.
- Fichier: controllers/recommendationController.js
  - calcul des recommandations a partir des donnees SQL (users, vehicules, interventions, garages).

4. Dependances backend
- Fichier: package.json
- Suppression de sequelize et sequelize-cli.
- Suppression de better-sqlite3 (non utilise en execution).
- Backend garde pg pour PostgreSQL Supabase.

5. Nettoyage des fichiers inutilises
- Suppression du dossier models/ (anciens modeles Sequelize non utilises).
- Suppression du fichier test-sequelize.js (test obsolete apres migration).
- Conservation des tests utiles test-auth.js, test-connection.js et test.js.

## Pourquoi cette approche
- Supabase est deja PostgreSQL: pg suffit pour interroger la base.
- Moins de complexite qu un ORM pour ce projet.
- Plus facile a controler en production (schema explicite et stable).

## Tables gerees automatiquement au demarrage
Le backend verifie/cree:
- roles
- users
- vehicules
- pieces
- interventions
- intervention_pieces
- garages

Le backend ajoute aussi certaines colonnes manquantes pour compatibilite legacy (ex: created_at, updated_at, vehicle_id, is_open).

## Variables .env attendues
Exemple minimal:

PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<password>@<host>:6543/postgres
JWT_SECRET=<secret-jwt>
DB_SSL=true

Notes:
- Avec Supabase, DATABASE_URL est la variable principale.
- Le port 6543 est courant avec le pooler Supabase.

## Installation et lancement
Depuis le dossier backend:

npm install
npm start

Pour developpement:

npm run dev

## Verification rapide
1. GET / => API en ligne
2. POST /api/auth/register
3. POST /api/auth/login
4. GET /api/vehicules (avec token)
5. GET /api/recommendations/classees (avec token)

## Lisibilite du code
- Des commentaires ont ete ajoutes dans les controleurs, routes et middlewares pour:
  - le role de chaque fonction
  - le flux principal de chaque tache (validation, autorisation, requetes SQL, reponse)
  - la responsabilite des helpers techniques

## Important
- Si vous aviez des donnees creees avec Sequelize, le bootstrap essaie de conserver la compatibilite (mapping de colonnes camelCase vers snake_case).
- Si une table est tres differente dans Supabase, adaptez db.js (fonction initDatabase) avec votre schema final.
