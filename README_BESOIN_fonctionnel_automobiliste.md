# Besoins fonctionnels de l'acteur Automobiliste

Ce document explique, pour chaque besoin fonctionnel de l'automobiliste, le fonctionnement reel selon une architecture 3-tier :

- Couche presentation : pages React, composants et services frontend.
- Couche logique : routes Express, controllers, services et middlewares backend.
- Couche donnees : tables PostgreSQL, modeles utilises et requetes SQL.

## 1. S'authentifier

### Couche presentation
- `frontend/src/pages/auth/login.jsx`
- `frontend/src/pages/auth/Register.jsx`
- `frontend/src/pages/auth/AdminLogin.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/api.js`
- `frontend/src/components/ProtectedRoute.jsx`

Fonctionnement : l'utilisateur saisit son email et son mot de passe, la page appelle `login()`, `register()` ou `loginAdmin()` via `AuthContext`, puis le token JWT est stocke dans `localStorage`. L'intercepteur Axios ajoute ensuite automatiquement `Authorization: Bearer <token>` sur chaque requete.

### Couche logique
- `backend/routes/auth.js`
- `backend/controllers/authController.js`
- `backend/middlewares/authMiddleware.js`
- `backend/routes/admin.js`
- `backend/controllers/adminController.js`
- `backend/middlewares/adminAuthMiddleware.js`
- `backend/models/user.model.js`

Requetes principales :
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `POST /api/admin/login`

Le controller `authController.js` verifie les champs, cherche l'utilisateur avec `findUserByEmail()`, compare le mot de passe avec bcrypt, puis genere un JWT avec `jwt.sign(...)`. Le middleware `verifyToken` verifie ensuite le JWT et charge l'utilisateur courant dans `req.user`.

### Couche donnees
- Tables : `users`, `roles`
- Modele : `backend/models/user.model.js`
- Requetes SQL : `INSERT INTO users`, `SELECT ... FROM users JOIN roles`, `SELECT 1 FROM users WHERE email = $1`

Flux complet : frontend -> `AuthContext` -> route backend -> controller -> modele utilisateur -> PostgreSQL -> retour JWT + profil.

## 2. Gérer son profil

### Couche presentation
- `frontend/src/pages/profil/profil.jsx`
- `frontend/src/services/user.js`
- `frontend/src/context/AuthContext.jsx`

La page profil permet de modifier les informations personnelles, changer le mot de passe et supprimer le compte. Elle appelle `updateProfile()`, `changePassword()` et `deleteAccount()`.

### Couche logique
- `backend/routes/auth.js`
- `backend/controllers/profileController.js`
- `backend/middlewares/authMiddleware.js`

Requetes principales :
- `PUT /api/auth/profile`
- `PUT /api/auth/profile/password`
- `DELETE /api/auth/profile`
- `GET /api/auth/profile-complet`
- `GET /api/auth/profile-complet/:id`

Le middleware JWT authentifie l'utilisateur, puis `profileController.js` met a jour `name`, `email`, `phone`, `store_name`, `store_address`, `store_description`, `store_hours`, `store_specialties`, `store_services` et, si besoin, le mot de passe hashé.

### Couche donnees
- Table : `users`
- Table secondaire : `roles`
- Modele : pas de modele dedie, la logique passe par `profileController.js`
- Requetes SQL : `SELECT * FROM users WHERE id = $1`, `UPDATE users SET ...`, `DELETE FROM users WHERE id = $1`, `SELECT ... FROM users JOIN roles`

## 3. Gérer un vehicule

### Couche presentation
- `frontend/src/pages/automobiliste/Dashboard.jsx`
- `frontend/src/services/vehicule.js`
- `frontend/src/components/PlatformLayout.jsx`

La page Tableau de bord Automobiliste contient l'onglet `Mes vehicules`. Elle charge la liste des vehicules, ouvre le formulaire d'ajout/modification, puis envoie les donnees au backend.

### Couche logique
- `backend/routes/vehicules.js`
- `backend/controllers/vehiculeController.js`
- `backend/middlewares/authMiddleware.js`

Requetes principales :
- `GET /api/vehicules`
- `POST /api/vehicules`
- `PUT /api/vehicules/:id`
- `DELETE /api/vehicules/:id`

Le controller verifie que le vehicule appartient bien a l'utilisateur connecte via `req.user.id`. L'insertion met toujours `user_id = req.user.id`.

### Couche donnees
- Table : `vehicules`
- Modele : pas de modele dedie, SQL direct dans `vehiculeController.js`
- Requetes SQL : `INSERT INTO vehicules`, `SELECT ... FROM vehicules WHERE user_id = $1`, `UPDATE vehicules SET ... WHERE id = $6 AND user_id = $7`, `DELETE FROM vehicules WHERE id = $1 AND user_id = $2`

## 4. Enregistrer les interventions et reparations

### Couche presentation
- `frontend/src/pages/automobiliste/Dashboard.jsx`
- `frontend/src/services/interventions.js`
- `frontend/src/pages/automobiliste/InterventionDetail.jsx`
- `frontend/src/components/appointments/QuickAppointmentModal.jsx` (pour le rendez-vous, pas pour l'intervention)

Dans le dashboard, le formulaire d'intervention permet d'enregistrer une maintenance avec date, type, garage, kilometrage, cout et pieces libres. La fiche intervention permet aussi d'ajouter ou de supprimer des pieces.

### Couche logique
- `backend/routes/interventions.js`
- `backend/controllers/interventionController.js`
- `backend/services/maintenanceService.js`
- `backend/middlewares/authMiddleware.js`

Requetes principales :
- `GET /api/vehicules/:vehicleId/interventions`
- `POST /api/vehicules/:vehicleId/interventions`
- `GET /api/vehicules/:vehicleId/interventions/:id`
- `PATCH /api/vehicules/:vehicleId/interventions/:id`
- `DELETE /api/vehicules/:vehicleId/interventions/:id`
- `POST /api/vehicules/:vehicleId/interventions/:id/pieces`
- `DELETE /api/vehicules/:vehicleId/interventions/:id/pieces/:pieceId`

Le controller cree l'intervention, lie les pieces via `intervention_pieces`, recalcule le cout total, puis appelle `maintenanceService.syncMaintenanceState(vehicleId)` pour actualiser l'etat de maintenance.

### Couche donnees
- Tables : `interventions`, `intervention_pieces`, `pieces`, `vehicules`, `maintenance_schedule`
- Modele : SQL direct dans `interventionController.js`
- Requetes SQL : `INSERT INTO interventions`, `INSERT INTO intervention_pieces`, `SELECT ... FROM intervention_pieces JOIN pieces`, `DELETE FROM intervention_pieces`, `UPDATE interventions SET cout_total = ...`

## 5. Consulter l'historique d'entretien

### Couche presentation
- `frontend/src/pages/automobiliste/VehicleHistory.jsx`
- `frontend/src/services/interventions.js`
- `frontend/src/pages/automobiliste/InterventionDetail.jsx`

La page historique charge toutes les interventions du vehicule et affiche les pieces associees. Chaque ligne permet d'ouvrir la fiche detaillee.

### Couche logique
- `backend/routes/interventions.js`
- `backend/controllers/interventionController.js`

Requete principale :
- `GET /api/vehicules/:vehicleId/interventions`

### Couche donnees
- Tables : `interventions`, `intervention_pieces`, `pieces`
- Modele : SQL direct dans `interventionController.js`
- Requetes SQL : `SELECT ... FROM interventions WHERE vehicle_id = $1`, `SELECT ... FROM intervention_pieces JOIN pieces`

## 6. Consulter le catalogue de pieces

### Couche presentation
- `frontend/src/pages/vendeur/CataloguePieces.jsx`
- `frontend/src/services/pieces.js`

La route de l'automobiliste vers le catalogue est declaree dans `frontend/src/routes/AppRouter.jsx` sur `/automobiliste/catalogue`. La meme page catalogue est reutilisee pour plusieurs roles.

### Couche logique
- `backend/routes/piece.routes.js`
- `backend/controllers/piece.controller.js`
- `backend/services/pieceService.js`
- `backend/middlewares/authMiddleware.js`

Requetes principales :
- `GET /api/pieces`
- `GET /api/pieces/me`
- `GET /api/pieces/:id`

### Couche donnees
- Tables : `pieces`, `users`
- Modele : pas de modele `piece.model.js` dedie, SQL dans `pieceService.js` et `pieceController.js`
- Requetes SQL : `SELECT ... FROM pieces`, `SELECT ... FROM pieces LEFT JOIN users`, `SELECT ... WHERE deleted_at IS NULL`

## 7. Rechercher des pieces

### Couche presentation
- `frontend/src/pages/vendeur/CataloguePieces.jsx`
- `frontend/src/services/pieces.js`

La recherche de pieces passe par les parametres de requete (`search`, `sortBy`, `sortOrder`) envoyes au backend. La page affiche les resultats filtres et pagines.

### Couche logique
- `backend/routes/piece.routes.js`
- `backend/controllers/piece.controller.js`
- `backend/services/pieceService.js`

Requete principale :
- `GET /api/pieces?search=...`

### Couche donnees
- Table : `pieces`
- Modele : `pieceService.js`
- Requetes SQL : `nom ILIKE`, `reference ILIKE`, tri par `created_at`, `updated_at`, `prix_unitaire`, `nom`, `reference`

## 8. Comparer les prix entre vendeurs

### Couche presentation
- `frontend/src/pages/vendeur/ComparaisonPrix.jsx`
- `frontend/src/pages/vendeur/CataloguePieces.jsx`
- `frontend/src/services/pieces.js`

La comparaison est declenchee depuis l'interface catalogue ou depuis la page comparaison. L'utilisateur recherche une piece, puis le front appelle le service de comparaison.

### Couche logique
- `backend/routes/piece.routes.js`
- `backend/controllers/piece.controller.js`
- `backend/services/pieceService.js`

Requete principale :
- `GET /api/pieces/compare/vendors?pieceId=...`

### Couche donnees
- Tables : `pieces`, `users`
- Modele : `pieceService.js`
- Requetes SQL : `SELECT ... FROM pieces p LEFT JOIN users u ON u.id = p.user_id`, tri par `p.prix_unitaire ASC`

Le service retourne l'offre la moins chere, le prix min/max et le nombre de vendeurs.

## 9. Contacter un vendeur et un agent de garage via chat

### Couche presentation
- `frontend/src/pages/chat/ChatCenter.jsx`
- `frontend/src/components/ChatModal.jsx`
- `frontend/src/services/chat.js`
- `frontend/src/hooks/useConversationRealtime.js`

Le front liste les contacts, ouvre ou cree une conversation, charge les messages et envoie un nouveau message. La partie realtime utilise Supabase Realtime via `subscribeToConversationMessages()` sur `chat_messages`.

### Couche logique
- `backend/routes/chat.routes.js`
- `backend/controllers/chat.controller.js`
- `backend/services/chatService.js`
- `backend/models/chat.model.js`
- `backend/controllers/chatContacts.controller.js`
- `backend/middlewares/authMiddleware.js`

Requetes principales :
- `GET /api/chat/contacts`
- `GET /api/chat/conversations`
- `GET /api/chat/conversations/:conversationId`
- `POST /api/chat/conversations/start`
- `GET /api/chat/conversations/:conversationId/messages`
- `POST /api/chat/conversations/:conversationId/messages`

### Couche donnees
- Tables : `chat_conversations`, `chat_messages`, `users`, `roles`, `garages`
- Modele : `backend/models/chat.model.js`
- Requetes SQL : `INSERT INTO chat_conversations`, `INSERT INTO chat_messages`, `SELECT ... FROM chat_conversations`, `SELECT ... FROM chat_messages`, `UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP`

Le flux realtime repose sur les insertions dans `chat_messages`, que le front recupere sans rafraichissement manuel.

## 10. Rechercher des garages proches via geolocalisation

### Couche presentation
- `frontend/src/pages/automobiliste/Garages.jsx`
- `frontend/src/components/GoogleMapGarages.jsx`
- `frontend/src/services/garage.js`
- `frontend/src/utils/distanceCalculator.js`

La page garages recupere la position utilisateur, affiche la carte, filtre les garages et montre la distance, la note et les specialites.

### Couche logique
- `backend/routes/garage.routes.js`
- `backend/controllers/garage.controller.js`
- `backend/controllers/garageMatchingController.js`
- `backend/services/garageMatchingService.js`
- `backend/models/garageMatching.model.js`

Requetes principales :
- `GET /api/garages`
- `GET /api/garages/filter-options`
- `GET /api/garages/match/:vehicleId?maxDistance=...`

Le matching utilise la distance Haversine, la localisation du vehicule/utilisateur, les services du garage, la note et la disponibilite.

### Couche donnees
- Tables : `garages`, `garage_services`, `vehicules`, `users`, `interventions`
- Modele : `backend/models/garageMatching.model.js`, `backend/models/garage.model.js`
- Requetes SQL : `SELECT ... FROM garages`, `LEFT JOIN garage_services`, `JOIN vehicules`, `JOIN users`, `SELECT type, description FROM interventions ORDER BY date_intervention DESC LIMIT 1`

## 11. Consulter les services et avis des garages

### Couche presentation
- `frontend/src/pages/automobiliste/Garages.jsx`
- `frontend/src/services/garage.js`

La page affiche les services d'un garage et ses avis clients. L'utilisateur peut ouvrir un garage, voir les services et lire les notes publiees.

### Couche logique
- `backend/routes/garage.routes.js`
- `backend/controllers/garageService.controller.js`
- `backend/controllers/garageReview.controller.js`
- `backend/controllers/garage.controller.js`

Requetes principales :
- `GET /api/garages/:id/services`
- `GET /api/garages/:id/reviews`
- `GET /api/garages/me/services`
- `GET /api/garages/me/reviews`

### Couche donnees
- Tables : `garages`, `garage_services` ou `garages_services` selon le schema legacy, `garage_reviews`, `users`
- Modeles : `backend/models/garage.model.js` et SQL direct dans les controllers de services/avis
- Requetes SQL : `SELECT ... FROM garage_services`, `SELECT ... FROM garage_reviews LEFT JOIN users`, `AVG(rating)`, `COUNT(*) OVER()`

## 12. Reserver un rendez-vous

### Couche presentation
- `frontend/src/components/appointments/QuickAppointmentModal.jsx`
- `frontend/src/pages/automobiliste/Garages.jsx`
- `frontend/src/services/appointments.js`
- `frontend/src/services/garage.js`

Le modal de reservation rapide permet de choisir un garage, une date, une heure, une description et des notes. Il recupere aussi les services disponibles du garage.

### Couche logique
- `backend/routes/appointments.js`
- `backend/controllers/appointment.controller.js`
- `backend/services/appointmentService.js`
- `backend/models/appointment.model.js`
- `backend/services/notificationService.js`

Requete principale :
- `POST /api/appointments`

### Couche donnees
- Tables : `appointments`, `garages`, `users`, `notifications`
- Modele : `backend/models/appointment.model.js`
- Requetes SQL : `INSERT INTO appointments`, `SELECT * FROM appointments`, `SELECT ... FROM garages`, `INSERT INTO notifications`

Apres creation du rendez-vous, le backend envoie une notification au garage proprietaire.

## 13. Consulter et gerer ses rendez-vous

### Couche presentation
- `frontend/src/pages/automobiliste/Appointments.jsx`
- `frontend/src/components/appointments/QuickAppointmentModal.jsx`
- `frontend/src/services/appointments.js`

Cette page liste les rendez-vous de l'automobiliste, permet de consulter un rendez-vous, de le modifier ou de le supprimer selon les droits.

### Couche logique
- `backend/routes/appointments.js`
- `backend/controllers/appointment.controller.js`
- `backend/services/appointmentService.js`
- `backend/models/appointment.model.js`

Requetes principales :
- `GET /api/appointments`
- `GET /api/appointments/:id`
- `PATCH /api/appointments/:id`
- `DELETE /api/appointments/:id`

### Couche donnees
- Table : `appointments`
- Modeles : `backend/models/appointment.model.js`
- Requetes SQL : `SELECT * FROM appointments WHERE automobiliste_user_id = $1`, `UPDATE appointments SET ...`, `DELETE FROM appointments WHERE id = $1`

## 14. Consulter les alertes d'entretien

### Couche presentation
- `frontend/src/pages/automobiliste/maintenance/MaintenancePage.jsx`
- `frontend/src/pages/automobiliste/maintenance/AlertCard.jsx`
- `frontend/src/pages/automobiliste/maintenance/MaintenanceCalendar.jsx`
- `frontend/src/services/maintenance.js`

La page ne lit pas directement `maintenance_alerts`. Elle consomme un tableau de bord calcule dynamiquement a partir du kilometrage et de l'historique des interventions.

### Couche logique
- `backend/routes/maintenance.routes.js`
- `backend/controllers/maintenance.controller.js`
- `backend/services/maintenanceService.js`

Requetes principales :
- `GET /api/maintenance?vehicleId=...`
- `GET /api/maintenance/:vehicleId/next-revision`

### Couche donnees
- Tables : `vehicules`, `interventions`, `maintenance_schedule`
- Modele : pas de modele dedie; logique calculee dans `maintenanceService.js`
- Requetes SQL : `SELECT ... FROM vehicules`, `SELECT ... FROM interventions WHERE vehicle_id = $1`, `DELETE FROM maintenance_schedule WHERE vehicle_id = $1`, `INSERT INTO maintenance_schedule (...)`

Note importante : la table `maintenance_alerts` existe cote backend CRUD (`backend/models/maintenanceAlert.model.js`), mais la page d'alertes de l'automobiliste repose surtout sur le calcul dynamique de `maintenanceService.js` et non sur un `SELECT` direct dans `maintenance_alerts`.

## 15. Recevoir des notifications

### Couche presentation
- `frontend/src/components/NotificationBell.jsx`
- `frontend/src/hooks/useNotifications.js`
- `frontend/src/services/notifications.js`
- `frontend/src/context/AuthContext.jsx`

La cloche de notifications charge les notifications, les marque comme lues, les supprime et rafraichit automatiquement le compteur non lu.

### Couche logique
- `backend/routes/notifications.js`
- `backend/controllers/notification.controller.js`
- `backend/services/notificationService.js`
- `backend/models/notification.model.js`

Requetes principales :
- `GET /api/notifications`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Couche donnees
- Table : `notifications`
- Modele : `backend/models/notification.model.js`
- Requetes SQL : `INSERT INTO notifications`, `SELECT * FROM notifications WHERE user_id = $1`, `UPDATE notifications SET is_read = true`, `DELETE FROM notifications WHERE id = $1`

Les notifications sont aussi creees automatiquement apres certains evenements metier, par exemple la reservation d'un rendez-vous ou l'envoi d'un message.

## Flux complet global

1. L'utilisateur agit depuis une page React du frontend.
2. La page appelle un service frontend dans `frontend/src/services/*.js`.
3. L'intercepteur Axios ajoute le token JWT si l'utilisateur est connecte.
4. La requete arrive sur une route Express dans `backend/routes/*.js`.
5. Le middleware `verifyToken` ou `verifyAdminToken` valide l'acces.
6. Le controller applique la regle metier et appelle le service ou execute le SQL.
7. Le modele ou la requete directe lit/ecrit dans PostgreSQL.
8. La reponse remonte jusqu'au frontend qui met a jour l'interface.

## Fichiers centraux a retenir

- Authentification : `frontend/src/context/AuthContext.jsx`, `backend/controllers/authController.js`, `backend/middlewares/authMiddleware.js`
- Vehicules : `frontend/src/pages/automobiliste/Dashboard.jsx`, `backend/controllers/vehiculeController.js`
- Interventions : `frontend/src/services/interventions.js`, `backend/controllers/interventionController.js`
- Pieces : `frontend/src/pages/vendeur/CataloguePieces.jsx`, `backend/controllers/piece.controller.js`, `backend/services/pieceService.js`
- Chat : `frontend/src/pages/chat/ChatCenter.jsx`, `backend/controllers/chat.controller.js`, `backend/services/chatService.js`
- Garages : `frontend/src/pages/automobiliste/Garages.jsx`, `backend/controllers/garage.controller.js`, `backend/controllers/garageMatchingController.js`
- Rendez-vous : `frontend/src/components/appointments/QuickAppointmentModal.jsx`, `backend/controllers/appointment.controller.js`
- Maintenance : `frontend/src/pages/automobiliste/maintenance/MaintenancePage.jsx`, `backend/controllers/maintenance.controller.js`, `backend/services/maintenanceService.js`
- Notifications : `frontend/src/components/NotificationBell.jsx`, `backend/controllers/notification.controller.js`, `backend/services/notificationService.js`
