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
  models/                     # Acces donnees reutilisable (migration douce depuis SQL inline)
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

### 5-bis) `models/` (acces donnees)

Responsabilites:
- Centraliser les requetes SQL reutilisees dans plusieurs couches.
- Eviter la duplication de requetes identiques entre controleurs/middlewares.
- Permettre une migration progressive sans casser l API existante.

Modules introduits:
- `models/user.model.js`: auth user lookup, verification role, creation user.
- `models/garage.model.js`: resolution identite garage (par id / par user_id).

Note:
- Cette couche est volontairement legere et non intrusive.
- La logique metier reste inchangée (meme validations, memes routes, memes reponses).

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

## Calcul de distance (Haversine) - Garages + Vendeurs de pieces

Le backend calcule maintenant la distance entre la position utilisateur et:

- les garages (`GET /api/garages`)
- les vendeurs de pieces (`GET /api/pieces/compare/vendors`)

Le calcul utilise la formule Haversine dans `utils/algorithms.js`.

### Architecture backend de cette fonctionnalite

Cette fonctionnalite suit la separation standard du projet:

1. Route
- Valide les query params (`userLat`, `userLon`, `radiusKm`, `minRating`, `maxRating`, `serviceIds`, `services`, `serviceMatch`, `sortBy`, `sortOrder`).
- Rejette les formats invalides avant d arriver au controller/service.

2. Controller (garages)
- Lit et normalise les query params.
- Applique les contraintes de coherence (ex: `userLat` et `userLon` ensemble).
- Orchestre la pagination et renvoie la reponse API standard.

3. Service (pieces compare vendors)
- Construit la requete SQL metier.
- Calcule `distance_km` pour chaque offre vendeur.
- Applique tri/filtrage geographique.

4. Utility
- `utils/algorithms.js` expose `haversine(lat1, lon1, lat2, lon2)`.

### Formule Haversine utilisee

Distance sur sphère terrestre:

$$
a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)
$$

$$
c = 2\operatorname{atan2}(\sqrt{a}, \sqrt{1-a}), \quad d = R \cdot c
$$

Avec:
- $R = 6371$ km (rayon terrestre moyen)
- $d$ en kilometres

## Detail implementation backend

### A) Garages - endpoint GET /api/garages

Fichier principal:
- `controllers/garage.controller.js`

Validation route:
- `routes/garage.routes.js`

Pipeline interne:

1. Validation d entree
- `userLat` dans [-90, 90]
- `userLon` dans [-180, 180]
- `radiusKm > 0`
- `minRating` et `maxRating` dans [0, 5]
- `serviceIds` en CSV numerique (ex: `1,5,9`)
- `services` en CSV de noms (ex: `vidange,diagnostic`)
- `serviceMatch` parmi `any|all`
- `sortBy` parmi `distance|created_at`
- `sortOrder` parmi `asc|desc`

2. Regles de coherence
- Si `userLat` est fourni, `userLon` doit exister aussi (et inversement).
- Si `sortBy=distance` ou `radiusKm` est fourni, coords utilisateur obligatoires.
- Si `minRating` et `maxRating` existent, `minRating <= maxRating`.

3. Strategie SQL/pagination
- Sans geo: pagination SQL classique (`LIMIT/OFFSET`) pour performance.
- Avec geo: chargement du set filtre SQL, puis post-traitement Node.js:
  - calcul `distance_km`
  - filtre `radiusKm`
  - tri distance
  - pagination finale en memoire

4. Filtre services/rating
- Le rating est filtre directement sur `garages.rating`.
- Le filtre services s appuie sur `garage_services`.
- `serviceMatch=any`: le garage doit matcher au moins un service demande.
- `serviceMatch=all`: le garage doit matcher tous les services demandes.
- Par defaut, le backend ne considere que les services actifs (`is_active = true`).
- `includeInactiveServices=true` inclut aussi les services inactifs.

5. Sortie JSON
- Chaque garage contient `distance_km` (ou `null` si coords indisponibles).
- Bloc `filters` retourne les parametres geo appliques.

Exemple reponse simplifiee:

```json
{
  "message": "Liste des garages recuperee avec succes",
  "data": {
    "items": [
      {
        "id": 7,
        "name": "Garage Nord",
        "latitude": 36.85,
        "longitude": 10.24,
        "distance_km": 8.42
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    },
    "filters": {
      "userLat": 36.8065,
      "userLon": 10.1815,
      "radiusKm": 10,
      "minRating": 4,
      "maxRating": 5,
      "serviceIds": [1, 3],
      "services": ["vidange", "diagnostic"],
      "serviceMatch": "any",
      "includeInactiveServices": false,
      "sortBy": "distance",
      "sortOrder": "asc"
    }
  }
}
```

Exemples requetes backend combinees:

```bash
# Distance + rating + services (match any)
GET /api/garages?userLat=36.8065&userLon=10.1815&radiusKm=15&minRating=4&services=vidange,diagnostic&serviceMatch=any&sortBy=distance&sortOrder=asc

# Rating intervalle + services par IDs (match all)
GET /api/garages?minRating=3.5&maxRating=5&serviceIds=1,5,9&serviceMatch=all
```

### B) Vendeurs de pieces - endpoint GET /api/pieces/compare/vendors

Fichiers principaux:
- `controllers/piece.controller.js`
- `services/pieceService.js`

Validation route:
- `routes/piece.routes.js`

Pipeline interne:

1. Recherche metier
- Entree obligatoire: `pieceId` ou `name`.
- Requete SQL des offres vendeurs actives.

2. Calcul distance
- Pour chaque offre: si coords utilisateur + vendeur existent
  - calcul `distance_km` via Haversine
  - sinon `distance_km = null`

3. Filtrage et tri
- `radiusKm`: garde uniquement les offres dans le rayon.
- `sortBy=distance`: tri par distance (nulls a la fin).
- `sortBy=price`: tri par prix.

4. Regle metier importante
- `best_offer` reste toujours l offre au meilleur prix.
- Meme si l affichage principal est trie par distance.

Exemple reponse simplifiee:

```json
{
  "message": "Comparaison multi-vendeurs recuperee avec succes",
  "data": {
    "searched_with": {
      "pieceId": 12,
      "userLat": 36.8065,
      "userLon": 10.1815,
      "radiusKm": 20
    },
    "summary": {
      "vendeurs_count": 3,
      "prix_min": 95,
      "prix_max": 125,
      "economie_max": 30
    },
    "sorting": {
      "sortBy": "distance",
      "sortOrder": "asc"
    },
    "best_offer": {
      "prix_minimum": 95
    },
    "offres": [
      {
        "piece_id": 99,
        "prix_unitaire": 100,
        "distance_km": 2.8
      }
    ]
  }
}
```

### C) Erreurs backend gerees (cas principaux)

Garages:
- `MISSING_COORDINATE_PAIR` (400): un seul des 2 champs `userLat/userLon` envoye.
- `COORDINATES_REQUIRED` (400): tri distance/rayon sans coords utilisateur.
- `INVALID_RATING_FILTER` (400): `minRating` ou `maxRating` hors [0, 5].
- `INVALID_RATING_RANGE` (400): `minRating > maxRating`.
- `INVALID_LIST_FILTER` (400): liste services invalide (`serviceIds`/`services`).

Vendeurs:
- `MISSING_SEARCH_CRITERIA` (400): ni `pieceId` ni `name`.
- `MISSING_COORDINATE_PAIR` (400): coords incompletes.
- `COORDINATES_REQUIRED` (400): tri/rayon sans coords.
- `NO_VENDOR_OFFERS_FOUND` (404): aucune offre apres filtres.

### D) Pourquoi ce design backend

- Zero dependance PostGIS pour rester simple sur Supabase PostgreSQL standard.
- Validation forte des params pour eviter les resultats incoherents.
- `distance_km` exposee directement pour simplifier le frontend.
- Separation claire route/controller/service pour maintenance.

### Parametres API ajoutes

1. Endpoint garages: `GET /api/garages`
- `userLat` (float, optionnel)
- `userLon` (float, optionnel)
- `radiusKm` (float > 0, optionnel)
- `sortBy` (`distance` ou `created_at`, optionnel)
- `sortOrder` (`asc` ou `desc`, optionnel)

Comportement:
- Si `userLat`/`userLon` sont fournis, chaque garage retourne `distance_km`.
- Si `radiusKm` est fourni, seuls les garages dans le rayon sont retournes.
- Si `sortBy=distance`, tri par distance.

2. Endpoint comparaison vendeurs: `GET /api/pieces/compare/vendors`
- `pieceId` ou `name` (deja existant, obligatoire au moins un)
- `includeOutOfStock` (deja existant)
- `userLat` (float, optionnel)
- `userLon` (float, optionnel)
- `radiusKm` (float > 0, optionnel)
- `sortBy` (`price` ou `distance`, optionnel)
- `sortOrder` (`asc` ou `desc`, optionnel)

Comportement:
- Chaque offre vendeur retourne `distance_km` si coordonnees utilisateur + vendeur disponibles.
- Filtrage par rayon avec `radiusKm`.
- Tri par prix ou par distance selon `sortBy`.
- `best_offer` reste base sur le meilleur prix (pas sur la distance), meme si tri distance.

### Exemples d appels

```bash
# Garages proches de l utilisateur (rayon 10 km)
GET /api/garages?userLat=36.8065&userLon=10.1815&radiusKm=10&sortBy=distance&sortOrder=asc

# Comparer des vendeurs pour une piece, tries par distance
GET /api/pieces/compare/vendors?pieceId=12&userLat=36.8065&userLon=10.1815&sortBy=distance&sortOrder=asc
```

## Supabase / PostgreSQL - Preparation base de donnees

Le calcul Haversine est fait dans le backend Node.js, mais la base doit stocker des coordonnees GPS valides.

### 1) Colonnes GPS necessaires

Executer ces scripts SQL dans Supabase SQL Editor:

```sql
-- Utilisateurs (vendeurs de pieces)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Garages
ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Contraintes de validation GPS
ALTER TABLE public.users
  ADD CONSTRAINT users_latitude_range_check
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE public.users
  ADD CONSTRAINT users_longitude_range_check
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

ALTER TABLE public.garages
  ADD CONSTRAINT garages_latitude_range_check
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE public.garages
  ADD CONSTRAINT garages_longitude_range_check
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
```

Si des contraintes existent deja, ignorer l erreur ou renommer les contraintes.

### 2) Index recommandes

```sql
CREATE INDEX IF NOT EXISTS idx_users_lat_lon ON public.users (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_garages_lat_lon ON public.garages (latitude, longitude);
```

Ces index aident surtout le pre-filtrage SQL futur. Le calcul actuel est deja operationnel sans extension PostGIS.

### 3) Donnees minimales a renseigner

- Pour un garage: `garages.latitude`, `garages.longitude`
- Pour un vendeur piece: `users.latitude`, `users.longitude`

Sans ces champs, l API retourne `distance_km: null` pour la ligne concernee.

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

