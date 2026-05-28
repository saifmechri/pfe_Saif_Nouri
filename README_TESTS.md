# README TESTS API - Postman

Ce document explique comment tester les API du projet avec Postman, module par module, avec une méthode simple à reproduire.

## 1. Objectif

L’objectif est de vérifier que toutes les routes backend répondent correctement dans Postman:

- authentification et profil utilisateur
- véhicules et interventions
- garages, services et avis
- pièces et stock
- rendez-vous
- maintenance et alertes
- chat et notifications
- rapports et administration
- statistiques publiques et recommandations

## 2. Prérequis

Avant de lancer les tests:

- Node.js installé
- PostgreSQL actif et base de données configurée
- backend démarré correctement
- Postman installé
- un compte utilisateur de test par rôle si possible:
  - automobiliste
  - garage
  - vendeur
  - admin

## 3. URL de base

Selon le serveur lancé dans ce projet:

- backend principal: `http://localhost:3000/api`
- si un autre port est configuré, remplacez `3000` par la valeur de `PORT`

Dans Postman, créez un environnement avec par exemple:

- `baseUrl` = `http://localhost:3000/api`
- `token` = vide au départ
- `vehicleId` = vide
- `garageId` = vide
- `pieceId` = vide
- `appointmentId` = vide
- `conversationId` = vide
- `reportId` = vide
- `adminToken` = vide

## 4. Organisation recommandée dans Postman

Créez une collection nommée:

- `PFE Saif Nouri - API Tests`

Puis créez des dossiers:

- Auth
- Profil
- Véhicules
- Interventions
- Garages
- Pieces
- Appointments
- Maintenance
- Alerts
- Chat
- Notifications
- Reports
- Admin
- Public
- Recommendations

## 5. Règles générales de test

Pour chaque requête protégée:

- onglet `Authorization`
- type `Bearer Token`
- valeur: `{{token}}`

Pour les endpoints admin:

- utiliser un token d’admin dans `{{adminToken}}`

Pour les endpoints avec identifiant:

- récupérer l’ID depuis la réponse de la requête précédente
- le stocker dans une variable d’environnement ou le copier temporairement

Bon réflexe:

- commencer par les routes publiques et l’authentification
- ensuite tester les routes protégées
- finir par les routes CRUD plus complexes

## 6. Ordre conseillé des tests

1. Public
2. Auth
3. Profil
4. Véhicules
5. Interventions
6. Maintenance
7. Garages
8. Pieces
9. Appointments
10. Alerts
11. Notifications
12. Chat
13. Reports
14. Admin
15. Recommendations

## 7. Authentification

### 7.1 Inscription

Méthode:

- `POST`

URL:

- `{{baseUrl}}/auth/register`

Exemple de body JSON:

```json
{
  "name": "Test Automobiliste",
  "email": "auto.test@example.com",
  "password": "Password123!",
  "role": "automobiliste"
}
```

Vérifier:

- code HTTP attendu: `200` ou `201`
- présence d’un utilisateur créé
- éventuel token renvoyé par l’API

### 7.2 Connexion

Méthode:

- `POST`

URL:

- `{{baseUrl}}/auth/login`

Exemple de body JSON:

```json
{
  "email": "auto.test@example.com",
  "password": "Password123!"
}
```

Après la réponse:

- copier le token JWT
- le stocker dans `{{token}}`
- si l’API renvoie le rôle, vérifier qu’il correspond au compte

### 7.3 Profil connecté

Méthode:

- `GET`

URL:

- `{{baseUrl}}/auth/profile`

Headers:

- `Authorization: Bearer {{token}}`

Vérifier:

- code `200`
- données du compte connecté

### 7.4 Mise à jour du profil

Méthode:

- `PUT`

URL:

- `{{baseUrl}}/auth/profile`

Body JSON exemple:

```json
{
  "name": "Nom Modifié",
  "phone": "0600000000"
}
```

### 7.5 Changement de mot de passe

Méthode:

- `PUT`

URL:

- `{{baseUrl}}/auth/profile/password`

Body JSON exemple:

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

## 8. Profil complet

### 8.1 Profil complet du compte connecté

Méthode:

- `GET`

URL:

- `{{baseUrl}}/auth/profile-complet`

Headers:

- `Authorization: Bearer {{token}}`

Vérifier:

- informations détaillées de l’utilisateur
- champ `role`
- données métier si présentes

### 8.2 Profil complet d’un utilisateur par ID

Méthode:

- `GET`

URL:

- `{{baseUrl}}/auth/profile-complet/1`

Headers:

- `Authorization: Bearer {{token}}`

## 9. Véhicules

### 9.1 Lister les véhicules

Méthode:

- `GET`

URL:

- `{{baseUrl}}/vehicules`

Headers:

- `Authorization: Bearer {{token}}`

Vérifier:

- la liste des véhicules
- récupérer un `vehicleId` pour les autres tests

### 9.2 Créer un véhicule

Méthode:

- `POST`

URL:

- `{{baseUrl}}/vehicules`

Type de body:

- `form-data` si vous envoyez une photo
- `raw` JSON si aucune photo n’est jointe

Exemple JSON:

```json
{
  "modele_voiture": "Renault Clio",
  "matricule_voiture": "123-TN-456",
  "kilometrage_voiture": 85000
}
```

### 9.3 Modifier un véhicule

Méthode:

- `PUT`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}`

### 9.4 Supprimer un véhicule

Méthode:

- `DELETE`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}`

## 10. Interventions

Base route:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions`

### 10.1 Lister les interventions d’un véhicule

Méthode:

- `GET`

Vérifier:

- tableau des interventions
- ID de l’intervention pour les tests suivants

### 10.2 Créer une intervention

Méthode:

- `POST`

Body JSON exemple:

```json
{
  "date_intervention": "2026-05-27",
  "type": "vidange",
  "description": "Vidange moteur",
  "garage_nom": "Garage Test",
  "garage_adresse": "Centre-ville",
  "kilometrage": 86000,
  "cout_total": 120
}
```

### 10.3 Consulter une intervention

Méthode:

- `GET`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions/{{interventionId}}`

### 10.4 Modifier une intervention

Méthode:

- `PATCH`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions/{{interventionId}}`

### 10.5 Supprimer une intervention

Méthode:

- `DELETE`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions/{{interventionId}}`

### 10.6 Ajouter une pièce à une intervention

Méthode:

- `POST`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions/{{interventionId}}/pieces`

Body JSON exemple:

```json
{
  "pieceId": 3,
  "quantity": 2
}
```

### 10.7 Retirer une pièce d’une intervention

Méthode:

- `DELETE`

URL:

- `{{baseUrl}}/vehicules/{{vehicleId}}/interventions/{{interventionId}}/pieces/{{pieceId}}`

## 11. Maintenance

### 11.1 Tableau de bord maintenance

Méthode:

- `GET`

URL:

- `{{baseUrl}}/maintenance?vehicleId={{vehicleId}}`

### 11.2 Prochaine révision

Méthode:

- `GET`

URL:

- `{{baseUrl}}/maintenance/{{vehicleId}}/next-revision`

Vérifier:

- kilomètres actuels
- prochaine révision
- date prochaine révision
- niveau d’urgence

## 12. Alertes de maintenance

### 12.1 Lister les alertes

Méthode:

- `GET`

URL:

- `{{baseUrl}}/maintenance-alerts`

### 12.2 Créer une alerte

Méthode:

- `POST`

Body JSON exemple:

```json
{
  "vehicleId": 1,
  "type": "revision",
  "message": "Révision à planifier"
}
```

### 12.3 Vérifier les alertes dues

Méthode:

- `POST`

URL:

- `{{baseUrl}}/maintenance-alerts/check-due`

### 12.4 Modifier une alerte

Méthode:

- `PATCH`

URL:

- `{{baseUrl}}/maintenance-alerts/{{alertId}}`

### 12.5 Supprimer une alerte

Méthode:

- `DELETE`

URL:

- `{{baseUrl}}/maintenance-alerts/{{alertId}}`

## 13. Garages

### 13.1 Liste des garages

Méthode:

- `GET`

URL:

- `{{baseUrl}}/garages`

### 13.2 Détails d’un garage

Méthode:

- `GET`

URL:

- `{{baseUrl}}/garages/{{garageId}}`

### 13.3 Disponibilité d’un garage

Méthode:

- `GET`

URL:

- `{{baseUrl}}/garages/{{garageId}}/availability`

### 13.4 Services d’un garage

Méthode:

- `GET`

URL:

- `{{baseUrl}}/garages/{{garageId}}/services`

### 13.5 Avis d’un garage

Méthode:

- `GET`

URL:

- `{{baseUrl}}/garages/{{garageId}}/reviews`

### 13.6 Création d’un garage

Méthode:

- `POST`

Permissions:

- garage ou admin

### 13.7 Ajouter un service au garage

Méthode:

- `POST`

URL:

- `{{baseUrl}}/garages/{{garageId}}/services`

### 13.8 Ajouter un avis

Méthode:

- `POST`

URL:

- `{{baseUrl}}/garages/{{garageId}}/reviews`

Body exemple:

```json
{
  "rating": 5,
  "comment": "Très bon service"
}
```

### 13.9 Mettre à jour ou supprimer

Utiliser:

- `PUT /garages/{{garageId}}`
- `DELETE /garages/{{garageId}}`

## 14. Pièces

### 14.1 Lister les pièces

Méthode:

- `GET`

URL:

- `{{baseUrl}}/pieces`

### 14.2 Mes pièces

Méthode:

- `GET`

URL:

- `{{baseUrl}}/pieces/me`

ou

- `{{baseUrl}}/pieces/mine`

### 14.3 Comparer les pièces par vendeurs

Méthode:

- `GET`

URL:

- `{{baseUrl}}/pieces/compare/vendors`

### 14.4 Localisation des vendeurs de pièces

Méthode:

- `GET`

URL:

- `{{baseUrl}}/pieces/seller-locations`

### 14.5 Détail d’une pièce

Méthode:

- `GET`

URL:

- `{{baseUrl}}/pieces/{{pieceId}}`

### 14.6 Création / modification / suppression

Utiliser:

- `POST /pieces`
- `PUT /pieces/{{pieceId}}`
- `DELETE /pieces/{{pieceId}}`

### 14.7 Gestion du stock

Utiliser:

- `GET /pieces/{{pieceId}}/stock/movements`
- `POST /pieces/{{pieceId}}/stock/adjust`
- `PUT /pieces/{{pieceId}}/stock`

## 15. Rendez-vous

### 15.1 Lister les rendez-vous

Méthode:

- `GET`

URL:

- `{{baseUrl}}/appointments`

### 15.2 Détail d’un rendez-vous

Méthode:

- `GET`

URL:

- `{{baseUrl}}/appointments/{{appointmentId}}`

### 15.3 Créer un rendez-vous

Méthode:

- `POST`

Body JSON exemple:

```json
{
  "garageId": 1,
  "vehicleId": 1,
  "date": "2026-05-30",
  "time": "10:00",
  "reason": "Révision périodique"
}
```

### 15.4 Modifier et supprimer

Utiliser:

- `PATCH /appointments/{{appointmentId}}`
- `DELETE /appointments/{{appointmentId}}`

## 16. Chat

### 16.1 Contacts

Méthode:

- `GET`

URL:

- `{{baseUrl}}/chat/contacts`

### 16.2 Conversations

Méthode:

- `GET`

URL:

- `{{baseUrl}}/chat/conversations`

### 16.3 Démarrer une conversation

Méthode:

- `POST`

URL:

- `{{baseUrl}}/chat/conversations/start`

### 16.4 Messages d’une conversation

Méthode:

- `GET`

URL:

- `{{baseUrl}}/chat/conversations/{{conversationId}}/messages`

### 16.5 Envoyer un message

Méthode:

- `POST`

URL:

- `{{baseUrl}}/chat/conversations/{{conversationId}}/messages`

Body JSON exemple:

```json
{
  "content": "Bonjour, je souhaite un rendez-vous."
}
```

## 17. Notifications

### 17.1 Lister les notifications

Méthode:

- `GET`

URL:

- `{{baseUrl}}/notifications`

### 17.2 Créer une notification

Méthode:

- `POST`

### 17.3 Marquer comme lue

Méthode:

- `PATCH`

URL:

- `{{baseUrl}}/notifications/{{notificationId}}/read`

### 17.4 Tout marquer comme lu

Méthode:

- `PATCH`

URL:

- `{{baseUrl}}/notifications/read-all`

### 17.5 Supprimer une notification

Méthode:

- `DELETE`

URL:

- `{{baseUrl}}/notifications/{{notificationId}}`

## 18. Rapports

### 18.1 Créer un rapport

Méthode:

- `POST`

URL:

- `{{baseUrl}}/reports`

Body JSON exemple:

```json
{
  "subject": "Garage suspect",
  "description": "Le garage n’a pas respecté le devis"
}
```

### 18.2 Administration des rapports

Côté admin:

- `GET /admin/reports/pending`
- `GET /admin/reports/stats`
- `GET /admin/reports/{{reportId}}`
- `POST /admin/reports/{{reportId}}/resolve`
- `POST /admin/reports/{{reportId}}/dismiss`

## 19. Administration

### 19.1 Connexion admin

Méthode:

- `POST`

URL:

- `{{baseUrl}}/admin/login`

Stocker ensuite le token dans `{{adminToken}}`.

### 19.2 Statistiques admin

Méthode:

- `GET`

URL:

- `{{baseUrl}}/admin/stats`

### 19.3 Utilisateurs en attente

Méthode:

- `GET`

URL:

- `{{baseUrl}}/admin/users/pending`

### 19.4 Modération utilisateurs

Utiliser:

- `GET /admin/users/moderation`
- `POST /admin/users/{{id}}/approve`
- `POST /admin/users/{{id}}/reject`
- `POST /admin/users/{{id}}/toggle-block`

### 19.5 Garages côté admin

Utiliser:

- `GET /admin/garages`
- `POST /admin/garages/{{id}}/approve`
- `POST /admin/garages/{{id}}/reject`
- `POST /admin/garages/{{id}}/deactivate`
- `POST /admin/garages/{{id}}/toggle-block`
- `DELETE /admin/garages/{{id}}`

### 19.6 Pièces côté admin

Utiliser:

- `GET /admin/pieces`
- `POST /admin/pieces/{{id}}/approve`
- `POST /admin/pieces/{{id}}/reject`
- `DELETE /admin/pieces/{{id}}`

## 20. Public

### 20.1 Statistiques publiques

Méthode:

- `GET`

URL:

- `{{baseUrl}}/public/stats`

Aucun token requis.

## 21. Recommendations

Le serveur principal expose aussi un module de recommandations.
Selon la version lancée du backend, vérifiez l’existence de:

- `{{baseUrl}}/recommendations`

Si ce module répond dans votre environnement, testez:

- `GET` pour lister les recommandations
- `GET` avec paramètres si le module l’exige

Si la route n’est pas disponible, vérifiez que le fichier backend correspondant existe et que le serveur lancé charge bien ce module.

## 22. Exemple de scripts Postman utiles

### Pré-request script pour stocker le token

Si la réponse de login contient `token`, utilisez:

```javascript
const json = pm.response.json();
if (json.token) {
  pm.environment.set('token', json.token);
}
```

### Test simple sur le statut HTTP

```javascript
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});
```

### Extraire un ID de réponse

```javascript
const json = pm.response.json();
if (json?.data?.id) {
  pm.environment.set('vehicleId', json.data.id);
}
```

## 23. Conseils de validation

Quand une requête échoue:

- vérifier l’URL exacte
- vérifier le token JWT
- vérifier le rôle du compte
- vérifier le format du body
- vérifier le code HTTP retourné
- lire la réponse JSON complète dans Postman

## 24. Résumé pratique

Le flux le plus simple à tester est:

1. `POST /auth/register`
2. `POST /auth/login`
3. stocker `token`
4. `GET /auth/profile`
5. `GET /vehicules`
6. récupérer `vehicleId`
7. `GET /maintenance?vehicleId=...`
8. `GET /maintenance/{vehicleId}/next-revision`
9. `GET /garages`
10. `GET /pieces`
11. `GET /appointments`
12. tester les routes admin avec `adminToken`

---

Si vous voulez, je peux aussi vous préparer une collection Postman prête à importer avec les requêtes déjà organisées.
