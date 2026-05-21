# Tableau des besoins fonctionnels par fonction

Ce fichier reprend le besoin fonctionnel corrigé du projet et l’aligne avec les écrans, routes, contrôleurs et tables réellement présents dans le dépôt.

Remarques de cadrage :
- Les fonctions marquées comme "couvertes" existent déjà sous forme de pages, routes ou services.
- Les fonctions marquées comme "non autonome" sont intégrées dans un écran existant plutôt que dans un module séparé.
- La supervision des transactions n’est pas exposée comme module métier autonome dans le code actuel ; la supervision des réservations est bien présente.

## 1. Automobiliste

| Fonction | Frontend | Backend | Tables | Statut / remarque |
|---|---|---|---|---|
| S’authentifier | [src/pages/auth/login.jsx](src/pages/auth/login.jsx), [src/pages/auth/Register.jsx](src/pages/auth/Register.jsx) | [backend/routes/auth.js](backend/routes/auth.js), [backend/controllers/authController.js](backend/controllers/authController.js) | `users`, `roles` | Couvert |
| Gérer son profil | [src/pages/profil/profil.jsx](src/pages/profil/profil.jsx) | [backend/controllers/profileController.js](backend/controllers/profileController.js), [backend/routes/auth.js](backend/routes/auth.js) | `users` | Couvert |
| Ajouter / modifier / supprimer un véhicule | [src/pages/automobiliste/Dashboard.jsx](src/pages/automobiliste/Dashboard.jsx) | [backend/routes/vehicules.js](backend/routes/vehicules.js), [backend/controllers/vehiculeController.js](backend/controllers/vehiculeController.js) | `vehicules` | Couvert |
| Enregistrer les interventions et réparations | [src/pages/automobiliste/Dashboard.jsx](src/pages/automobiliste/Dashboard.jsx), [src/pages/automobiliste/InterventionDetail.jsx](src/pages/automobiliste/InterventionDetail.jsx) | [backend/routes/interventions.js](backend/routes/interventions.js), [backend/controllers/interventionController.js](backend/controllers/interventionController.js) | `interventions`, `intervention_pieces`, `maintenance_schedule` | Couvert |
| Consulter l’historique d’entretien | [src/pages/automobiliste/VehicleHistory.jsx](src/pages/automobiliste/VehicleHistory.jsx) | [backend/routes/interventions.js](backend/routes/interventions.js), [backend/routes/vehicules.js](backend/routes/vehicules.js) | `interventions`, `maintenance_schedule` | Couvert |
| Recevoir des recommandations d’entretien automatiques | [src/pages/automobiliste/Recommendations.jsx](src/pages/automobiliste/Recommendations.jsx), [src/pages/automobiliste/RecommendationsAssistant.jsx](src/pages/automobiliste/RecommendationsAssistant.jsx) | [backend/routes/recommendations.js](backend/routes/recommendations.js), [backend/controllers/recommendationController.js](backend/controllers/recommendationController.js) | `vehicules`, `interventions`, `maintenance_schedule` | Couvert |
| Rechercher des pièces | [src/pages/vendeur/CataloguePieces.jsx](src/pages/vendeur/CataloguePieces.jsx) | [backend/routes/piece.routes.js](backend/routes/piece.routes.js), [backend/routes/pieces.js](backend/routes/pieces.js) | `pieces`, `piece_stock_movements` | Couvert |
| Comparer les prix entre vendeurs | [src/pages/vendeur/ComparaisonPrix.jsx](src/pages/vendeur/ComparaisonPrix.jsx) | [backend/routes/pieces.js](backend/routes/pieces.js), [backend/services/pieceService.js](backend/services/pieceService.js) | `pieces` | Couvert |
| Contacter un vendeur via chat | [src/components/ChatModal.jsx](src/components/ChatModal.jsx), [src/pages/chat/ChatCenter.jsx](src/pages/chat/ChatCenter.jsx) | [backend/routes/chat.routes.js](backend/routes/chat.routes.js), [backend/controllers/chat.controller.js](backend/controllers/chat.controller.js), [backend/services/chatService.js](backend/services/chatService.js) | `chat_conversations`, `chat_messages` | Couvert |
| Rechercher des garages proches via géolocalisation | [src/pages/automobiliste/Garages.jsx](src/pages/automobiliste/Garages.jsx) | [backend/routes/garages.js](backend/routes/garages.js), [backend/routes/garage.routes.js](backend/routes/garage.routes.js) | `garages` | Couvert |
| Consulter les services et avis des garages | [src/pages/automobiliste/Garages.jsx](src/pages/automobiliste/Garages.jsx), [src/pages/garage/Dashboard.jsx](src/pages/garage/Dashboard.jsx) | [backend/routes/garage.routes.js](backend/routes/garage.routes.js), [backend/controllers/garageService.controller.js](backend/controllers/garageService.controller.js), [backend/controllers/garageReview.controller.js](backend/controllers/garageReview.controller.js) | `garages`, `garage_services`, `reviews` | Couvert |
| Réserver un rendez-vous | [src/components/appointments/QuickAppointmentModal.jsx](src/components/appointments/QuickAppointmentModal.jsx), [src/pages/automobiliste/Appointments.jsx](src/pages/automobiliste/Appointments.jsx) | [backend/routes/appointments.js](backend/routes/appointments.js), [backend/controllers/appointment.controller.js](backend/controllers/appointment.controller.js) | `appointments` | Couvert |
| Consulter et gérer ses rendez-vous | [src/pages/automobiliste/Appointments.jsx](src/pages/automobiliste/Appointments.jsx), [src/pages/AppointmentDetail.jsx](src/pages/AppointmentDetail.jsx) | [backend/routes/appointments.js](backend/routes/appointments.js), [backend/controllers/appointment.controller.js](backend/controllers/appointment.controller.js) | `appointments` | Couvert |
| Recevoir des notifications (messages, alertes entretien, confirmation RDV) | [src/components/NotificationBell.jsx](src/components/NotificationBell.jsx), [src/pages/chat/ChatCenter.jsx](src/pages/chat/ChatCenter.jsx) | [backend/routes/notifications.js](backend/routes/notifications.js), [backend/routes/maintenanceAlerts.js](backend/routes/maintenanceAlerts.js), [backend/services/notificationService.js](backend/services/notificationService.js) | `notifications` (via service), `maintenance_alerts` si présent, `appointments` | Couvert / service interne |

## 2. Agent Garage

| Fonction | Frontend | Backend | Tables | Statut / remarque |
|---|---|---|---|---|
| S’authentifier | [src/pages/auth/login.jsx](src/pages/auth/login.jsx) | [backend/routes/auth.js](backend/routes/auth.js), [backend/controllers/authController.js](backend/controllers/authController.js) | `users`, `roles` | Couvert |
| Gérer son profil | [src/pages/garage/Dashboard.jsx](src/pages/garage/Dashboard.jsx) | [backend/routes/garage.routes.js](backend/routes/garage.routes.js), [backend/controllers/garageController.js](backend/controllers/garageController.js) | `users`, `garages` | Couvert |
| Gérer ses services | [src/pages/garage/Dashboard.jsx](src/pages/garage/Dashboard.jsx) | [backend/routes/garage.routes.js](backend/routes/garage.routes.js), [backend/controllers/garageService.controller.js](backend/controllers/garageService.controller.js) | `garage_services` | Couvert |
| Recevoir des demandes de rendez-vous | [src/pages/garage/Appointments.jsx](src/pages/garage/Appointments.jsx), [src/pages/AppointmentDetail.jsx](src/pages/AppointmentDetail.jsx) | [backend/routes/appointments.js](backend/routes/appointments.js), [backend/controllers/appointment.controller.js](backend/controllers/appointment.controller.js) | `appointments` | Couvert |
| Valider ou refuser un rendez-vous | [src/pages/garage/Appointments.jsx](src/pages/garage/Appointments.jsx), [src/pages/AppointmentDetail.jsx](src/pages/AppointmentDetail.jsx) | [backend/routes/appointments.js](backend/routes/appointments.js), [backend/controllers/appointment.controller.js](backend/controllers/appointment.controller.js) | `appointments` | Couvert |
| Répondre aux messages des automobilistes | [src/pages/chat/ChatCenter.jsx](src/pages/chat/ChatCenter.jsx) | [backend/routes/chat.routes.js](backend/routes/chat.routes.js), [backend/controllers/chat.controller.js](backend/controllers/chat.controller.js) | `chat_conversations`, `chat_messages` | Couvert |
| Consulter les avis reçus | [src/pages/garage/Dashboard.jsx](src/pages/garage/Dashboard.jsx) | [backend/routes/garage.routes.js](backend/routes/garage.routes.js), [backend/controllers/garageReview.controller.js](backend/controllers/garageReview.controller.js) | `reviews` | Couvert |
| Consulter son tableau de bord | [src/pages/garage/Dashboard.jsx](src/pages/garage/Dashboard.jsx) | [backend/routes/garage.routes.js](backend/routes/garage.routes.js) | `users`, `garages`, `garage_services`, `appointments`, `reviews` | Couvert |

## 3. Vendeur de pièces

| Fonction | Frontend | Backend | Tables | Statut / remarque |
|---|---|---|---|---|
| S’authentifier | [src/pages/auth/login.jsx](src/pages/auth/login.jsx) | [backend/routes/auth.js](backend/routes/auth.js), [backend/controllers/authController.js](backend/controllers/authController.js) | `users`, `roles` | Couvert |
| Gérer son mot de passe | [src/pages/profil/profil.jsx](src/pages/profil/profil.jsx) | [backend/controllers/profileController.js](backend/controllers/profileController.js) | `users` | Couvert via le profil, pas comme module séparé |
| Gérer son profil | [src/pages/vendeur/Dashboard.jsx](src/pages/vendeur/Dashboard.jsx), [src/pages/profil/profil.jsx](src/pages/profil/profil.jsx) | [backend/controllers/profileController.js](backend/controllers/profileController.js), [backend/routes/auth.js](backend/routes/auth.js) | `users` | Couvert |
| Ajouter / modifier / supprimer des pièces | [src/pages/vendeur/CataloguePieces.jsx](src/pages/vendeur/CataloguePieces.jsx) | [backend/routes/piece.routes.js](backend/routes/piece.routes.js), [backend/routes/pieces.js](backend/routes/pieces.js), [backend/controllers/pieceController.js](backend/controllers/pieceController.js) | `pieces` | Couvert |
| Gérer le stock | [src/pages/vendeur/CataloguePieces.jsx](src/pages/vendeur/CataloguePieces.jsx) | [backend/routes/piece.routes.js](backend/routes/piece.routes.js), [backend/services/pieceService.js](backend/services/pieceService.js) | `pieces`, `piece_stock_movements` | Couvert |
| Répondre via chat | [src/pages/chat/ChatCenter.jsx](src/pages/chat/ChatCenter.jsx) | [backend/routes/chat.routes.js](backend/routes/chat.routes.js), [backend/controllers/chat.controller.js](backend/controllers/chat.controller.js) | `chat_conversations`, `chat_messages` | Couvert |
| Consulter son tableau de bord | [src/pages/vendeur/Dashboard.jsx](src/pages/vendeur/Dashboard.jsx) | [backend/routes/pieces.js](backend/routes/pieces.js), [backend/routes/chat.routes.js](backend/routes/chat.routes.js) | `pieces`, `chat_conversations`, `chat_messages` | Couvert |

## 4. Administrateur

| Fonction | Frontend | Backend | Tables | Statut / remarque |
|---|---|---|---|---|
| S’authentifier | [src/pages/auth/AdminLogin.jsx](src/pages/auth/AdminLogin.jsx) | [backend/routes/auth.js](backend/routes/auth.js), [backend/controllers/authController.js](backend/controllers/authController.js) | `users`, `roles` | Couvert |
| Consulter son tableau de bord | [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx) | [backend/routes/admin.js](backend/routes/admin.js), [backend/controllers/adminController.js](backend/controllers/adminController.js) | `users`, `garages`, `pieces`, `appointments`, `audit_logs`, `reports` | Couvert |
| Supprimer des comptes | [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx) | [backend/routes/admin.js](backend/routes/admin.js), [backend/controllers/adminController.js](backend/controllers/adminController.js) | `users` | Couvert |
| Gérer les signalements | [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx) | [backend/routes/reports.js](backend/routes/reports.js), [backend/controllers/adminController.js](backend/controllers/adminController.js) | `reports` | Couvert |
| Consulter les statistiques de la plateforme | [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx) | [backend/routes/admin.js](backend/routes/admin.js), [backend/controllers/adminController.js](backend/controllers/adminController.js) | `users`, `garages`, `pieces`, `appointments`, `reports` | Couvert |
| Consulter les logs d’activité | [src/pages/admin/AuditLogs.jsx](src/pages/admin/AuditLogs.jsx), [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx) | [backend/routes/admin.js](backend/routes/admin.js), [backend/controllers/adminController.js](backend/controllers/adminController.js), [backend/services/auditService.js](backend/services/auditService.js) | `audit_logs` | Couvert |
| Superviser les réservations | [src/pages/admin/Dashboard.jsx](src/pages/admin/Dashboard.jsx), [src/pages/AppointmentDetail.jsx](src/pages/AppointmentDetail.jsx) | [backend/routes/appointments.js](backend/routes/appointments.js), [backend/controllers/appointment.controller.js](backend/controllers/appointment.controller.js) | `appointments` | Couvert |

## 5. Fonctions non autonomes ou à reformuler dans le cahier des charges

| Élément du besoin initial | Observation projet | Proposition de formulation |
|---|---|---|
| Réinitialiser son mot de passe côté vendeur | Pas de module dédié. Le changement de mot de passe passe par le profil utilisateur. | “Gérer son mot de passe depuis le profil” |
| Superviser les transactions | Aucun module métier autonome de paiement/transaction n’est exposé dans le dépôt actuel. | “Superviser les réservations et le suivi des opérations liées à l’activité” |
| Logs d’activité | Fonction bien présente, mais uniquement pour l’administrateur. | Conserver comme besoin admin |
| Notifications | Fonction réelle, mais répartie entre messages, alertes entretien et confirmations de rendez-vous. | Garder comme besoin transverse |

---

Si vous voulez, je peux maintenant générer une version plus académique de ce fichier, prête à être collée dans le rapport PFE, avec un ton plus formel et moins technique.