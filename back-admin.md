# Back Admin - Validation des comptes & modération

Ce fichier explique la partie backend de l'espace administrateur dédiée à la validation des comptes et à la modération des signalements.

## 1. Objectif

L'administrateur dispose d'un accès réservé, sans inscription publique. Il peut :

- se connecter avec un email et un mot de passe prédéfinis ;
- consulter les comptes en attente de validation ;
- approuver un compte pour lui donner accès à la plateforme ;
- rejeter un compte et le supprimer ;
- consulter les signalements en attente ;
- ouvrir un signalement ;
- marquer un signalement comme résolu ou ignoré.

## 2. Connexion administrateur

L'authentification admin est gérée par :

- `POST /api/admin/login`

Le backend compare les identifiants reçus avec les variables d'environnement :

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Un token JWT est ensuite généré avec le flag `admin: true`.

### Exemple

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin123@gmail.com","password":"Admin@admin0"}'
```

## 3. Validation des comptes

Les nouveaux comptes sont créés avec `is_validated = false`.

Endpoints disponibles :

- `GET /api/admin/users/pending` : liste des comptes en attente ;
- `POST /api/admin/users/:id/approve` : valide un compte ;
- `POST /api/admin/users/:id/reject` : rejette et supprime un compte.

## 4. Modération des signalements

La modération repose sur la table `reports`.

Chaque signalement contient :

- l'utilisateur qui a signalé ;
- le type d'élément signalé ;
- l'identifiant de l'élément signalé ;
- la raison ;
- les détails ;
- le statut (`pending`, `resolved`, `dismissed`).

Endpoints disponibles :

- `GET /api/admin/reports/pending` : liste des signalements en attente ;
- `GET /api/admin/reports/:id` : détail d'un signalement ;
- `POST /api/admin/reports/:id/resolve` : marque un signalement comme résolu ;
- `POST /api/admin/reports/:id/dismiss` : marque un signalement comme ignoré.

### Exemple

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/admin/reports/pending
```

## 5. Sécurité

Toutes les routes admin protégées utilisent `verifyAdminToken`.

Cette vérification contrôle :

- la présence du token JWT ;
- la validité du token ;
- le flag `admin: true` ;
- l'email admin attendu.

## 6. Fichiers backend concernés

- `backend/controllers/adminController.js`
- `backend/controllers/report.controller.js`
- `backend/models/report.model.js`
- `backend/middlewares/adminAuthMiddleware.js`
- `backend/routes/admin.js`
- `backend/db.js`

## 7. Test rapide

1. Démarrer le backend.
2. Se connecter via `/api/admin/login`.
3. Copier le token JWT.
4. Tester les routes de validation des comptes.
5. Tester les routes de modération des signalements.
