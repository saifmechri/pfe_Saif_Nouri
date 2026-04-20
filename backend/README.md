# Backend - Architecture et maintenance

Ce document decrit l organisation du backend, les responsabilites de chaque composant et la methode recommandee pour faire evoluer le projet sans casser l existant.

## Objectif

- Preserver le fonctionnement actuel de l API.
- Clarifier la structure (routes, controleurs, services, middlewares, utilitaires).
- Faciliter la maintenance et l ajout de nouvelles fonctionnalites.

## Stack technique

- Runtime: Node.js
- Framework HTTP: Express
- Base de donnees: PostgreSQL (via `pg`)
- Authentification: JWT
- Validation requetes: express-validator
- Upload fichiers: multer

## Vue d ensemble de la structure

```text
backend/
  app.js                      # Composition de l application Express (middlewares + routes)
  server.js                   # Bootstrap technique (env, DB, lancement HTTP)
  db.js                       # Connexion Pool PG + initialisation schema compatible
  controllers/                # Couche HTTP (req/res), orchestration
  services/                   # Logique metier et acces SQL principal
  routes/                     # Definition des endpoints et validations
  middlewares/                # Middlewares transverses (erreurs, validation, async)
  middlwares/                 # Dossier legacy conserve pour compatibilite
  utils/                      # Helpers partages (logger, AppError, reponse API, algorithmes)
  uploads/                    # Fichiers uploades (pieces/vehicules)
  TEST_API.md                 # Scenarios de test API
  README_SUPABASE.md          # Notes migration Supabase/PostgreSQL
```

## Separation des responsabilites

### 1) `server.js` (bootstrap)

Responsabilites:
- Charger la configuration (`dotenv`).
- Demarrer la connexion DB (`testConnection`).
- Executer l initialisation schema (`initDatabase`).
- Lancer le serveur HTTP sur le port configure.

Important:
- Aucune logique metier ici.
- Aucun SQL metier ici.

### 2) `app.js` (composition Express)

Responsabilites:
- Construire l instance Express.
- Brancher les middlewares globaux (`cors`, `express.json`, static uploads).
- Exposer la route racine `/`.
- Enregistrer les routes via `routes/index.js`.
- Brancher le middleware d erreur global (`errorHandler`).

Important:
- Pas de connexion DB.
- Pas de logique metier.

### 3) `routes/` (contrat HTTP)

Responsabilites:
- Declarer les endpoints (URL + methode HTTP).
- Appliquer les validations d entree (`express-validator`).
- Appliquer auth/roles si necessaire.
- Transferer au bon controleur.

Fichier de structure:
- `routes/index.js`: point central d enregistrement des routes.

### 4) `controllers/` (adaptation HTTP)

Responsabilites:
- Lire et normaliser les donnees HTTP (`params`, `query`, `body`).
- Appeler les services.
- Formater la reponse API.
- Transformer les erreurs metier en erreurs HTTP coherentes.

Important:
- Pas de SQL complexe dans les controleurs.
- Les regles metier doivent vivre en service.

### 5) `services/` (logique metier)

Responsabilites:
- Implémenter les regles metier.
- Executer les requetes SQL.
- Gérer les transactions quand necessaire.
- Retourner des objets metier clairs aux controleurs.

Exemple actuel:
- `services/pieceService.js` centralise CRUD, stock, historique et comparaison multi-vendeurs.

### 6) `middlewares/` et `middlwares/`

- `middlewares/`: dossier principal standardise.
  - `asyncHandler.js`
  - `errorHandler.js`
  - `validateRequest.js`
- `middlwares/`: dossier legacy (typo historique) conserve pour compatibilite.
  - `authMiddleware.js`
  - `roleMiddleware.js`
  - upload middlewares historiques

Recommandation:
- Ne pas supprimer `middlwares/` tant que les imports legacy existent.
- Migrer progressivement vers `middlewares/` avec une passe dediee et tests.

### 7) `utils/`

Responsabilites:
- Fonctions transverses reutilisables.
- Objets standard de gestion erreur/reponse.

Principaux utilitaires:
- `appError.js`: erreurs metier standardisees.
- `apiResponse.js`: format de reponse unifie.
- `logger.js`: logs applicatifs.
- `algorithms.js`: fonctions de scoring/recommandations.

## Flux d execution d une requete

1. Le client appelle un endpoint (ex: `GET /api/pieces/compare/vendors`).
2. La route valide les entrees puis appelle le controleur.
3. Le controleur appelle un service avec des donnees deja normalisees.
4. Le service execute les regles metier + SQL.
5. Le controleur renvoie une reponse via `sendApiResponse`.
6. Toute erreur remonte vers `errorHandler`.

## Comparaison intelligente multi-vendeurs

Cette fonctionnalite permet d identifier automatiquement le prix minimum pour une meme piece proposee par plusieurs vendeurs.

### But fonctionnel

- Recuperer toutes les offres disponibles pour une piece donnee.
- Ignorer les vendeurs en rupture de stock lorsque la comparaison standard est utilisee.
- Extraire les prix disponibles.
- Calculer le prix minimum.
- Identifier le vendeur associe au prix minimum.

### Comment le backend procede

1. Le client envoie `pieceId` ou `name`.
2. Le service recupere les offres correspondantes chez les vendeurs.
3. Les offres sont filtrees si besoin pour exclure les stocks a zero.
4. Les offres sont triees par `prix_unitaire ASC`, puis `stock DESC`.
5. La premiere offre devient l offre gagnante.

### Endpoint utilise

- `GET /api/pieces/compare/vendors?pieceId=ID`
- `GET /api/pieces/compare/vendors?name=TERM`

### Champs retournes par la reponse

- `summary.prix_min`: le plus bas prix trouve.
- `summary.prix_max`: le plus haut prix trouve.
- `summary.economie_max`: l ecart entre les deux.
- `best_offer.prix_minimum`: copie explicite du prix minimum.
- `best_offer.meilleur_vendeur`: informations du vendeur gagneant.
- `available_prices`: liste ordonnee des prix disponibles.
- `offres`: detail complet de chaque offre comparee.

### Lecture du resultat

Le frontend n a plus besoin de recalculer le meilleur prix.
Il peut afficher directement:

- l offre la plus avantageuse;
- le vendeur correspondant;
- les autres offres pour comparaison visuelle.

Cette organisation evite de dupliquer le calcul du minimum entre le frontend et le backend.

## Convention d evolution (sans regression)

Pour ajouter une fonctionnalite backend:

1. Route
- Ajouter endpoint + validation dans `routes/...`.

2. Controleur
- Ajouter une methode mince dans `controllers/...`.

3. Service
- Ajouter la logique metier + SQL dans `services/...`.

4. Documentation
- Mettre a jour ce README et `TEST_API.md`.

5. Verification
- Tester cas nominal + cas erreurs + auth/role.

## Regles de maintenance recommandees

- Garder les controlleurs minces (orchestration HTTP seulement).
- Garder la logique metier dans les services.
- Eviter SQL duplique entre controleurs.
- Centraliser les reponses API et les erreurs.
- Favoriser des fonctions pures pour les normalisations/transforms.

## Dossiers de reference

- Notes migration DB: `README_SUPABASE.md`
- Scenarios de test API: `TEST_API.md`

## Ce qui a ete structure ici

- Ajout de `app.js` pour separer composition Express et bootstrap serveur.
- Ajout de `routes/index.js` comme registre central des routes.
- Conservation de la logique existante (endpoints et comportement inchanges).

