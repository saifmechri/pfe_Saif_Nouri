# Documentation des interfaces — Projet PFE

Ce document répertorie toutes les interfaces (pages) du projet, les fichiers frontend et backend associés, les tables/collections probables et les APIs utilisées. Il est généré automatiquement à partir des fichiers sources présents dans le dépôt.

## Tableau des besoins fonctionnels corrigé

| L’acteur | Rôle |
|---|---|
| Automobiliste | L’automobiliste a la possibilité de :<br>• S’authentifier<br>• Gérer son profil<br>• Ajouter / modifier / supprimer un véhicule<br>• Enregistrer les interventions et réparations<br>• Consulter l’historique d’entretien<br>• Recevoir des recommandations d’entretien automatiques<br>• Rechercher des pièces<br>• Comparer les prix entre vendeurs<br>• Contacter un vendeur via chat<br>• Rechercher des garages proches via géolocalisation<br>• Consulter les services et avis des garages<br>• Réserver un rendez-vous<br>• Consulter et gérer ses rendez-vous<br>• Recevoir des notifications (messages, alertes entretien, confirmation RDV) |
| Agent Garage | Le garage a la possibilité de :<br>• S’authentifier<br>• Gérer son profil<br>• Gérer ses services<br>• Recevoir des demandes de rendez-vous<br>• Valider ou refuser un rendez-vous<br>• Répondre aux messages des automobilistes<br>• Consulter les avis reçus<br>• Consulter son tableau de bord |
| Vendeur de pièces | Le vendeur a la possibilité de :<br>• S’authentifier<br>• Gérer son mot de passe depuis le profil<br>• Gérer son profil<br>• Ajouter / modifier / supprimer des pièces<br>• Gérer le stock<br>• Répondre via chat<br>• Consulter son tableau de bord |
| Administrateur | L’administrateur a la possibilité de :<br>• S’authentifier<br>• Consulter son tableau de bord<br>• Supprimer des comptes<br>• Gérer les signalements<br>• Consulter les statistiques de la plateforme<br>• Consulter les logs d’activité<br>• Superviser les réservations |

---

# Interface Home

## Frontend
* src/pages/Home.jsx
* Utilise : src/components/ChatModal.jsx, src/components/NotificationBell.jsx
* Services : src/services/publicStats.js

## Backend
* routes: /api/public (backend/routes/public.js)
* controllers: backend/controllers/publicController.js

## Base de données
* users
* garages
* pieces
* interventions

## APIs
* GET /api/public/stats (via `getPublicStats`)

## Description
Page d'accueil publique / landing page. Affiche statistiques publiques et liens vers inscription/connexion ou dashboard utilisateur.

---

# Interface Détail Rendez-vous

## Frontend
* src/pages/AppointmentDetail.jsx
* Uses: src/components/PlatformLayout.jsx, src/components/TopBar.jsx
* Services: src/services/appointments.js
* Utils: src/utils/appointmentConstants.js

## Backend
* routes: backend/routes/appointments.js (mounted under `/api/appointments`)
* controllers: backend/controllers/appointment.controller.js
* services/middlewares: backend/services/ (appointment-related services), auth middleware (backend/middlewares)

## Base de données
* appointments
* users
* garages

## APIs
* GET /api/appointments/:id  (via `getAppointment`)
* GET /api/appointments (list) (via `listAppointments`)
* PUT /api/appointments/:id (update via `updateAppointment`)

## Description
Affiche et gère le détail d'un rendez-vous (lecture, messages, accept/reject, proposition de date). Actions appelant l'API rendez-vous.

---

# Interface Home / Unauthorized

## Frontend
* src/pages/Unauthorized.jsx

## Backend
* Pas d'appel API spécifique détecté (page statique)

## Base de données
* aucune

## APIs
* aucune

## Description
Page affichée lorsqu'un utilisateur tente d'accéder à une ressource non autorisée.

---

# Interface Profil utilisateur

## Frontend
* src/pages/profil/profil.jsx
* Uses: src/components/PlatformLayout.jsx
* Services: src/services/user.js

## Backend
* routes: backend/routes/auth.js (ou user/profile endpoints), backend/routes/index.js mount `/api/auth` et routes utilisateurs
* controllers: backend/controllers/profileController.js, backend/controllers/authController.js

## Base de données
* users

## APIs
* PUT /api/auth/profile (updateProfile)
* POST /api/auth/change-password (changePassword)
* DELETE /api/auth (deleteAccount) — ou endpoint user-delete

## Description
Gestion du profil utilisateur : modification des informations, changement de mot de passe et suppression de compte.

---

# Interface Connexion (Login)

## Frontend
* src/pages/auth/login.jsx
* Utilise: `AuthContext` pour `login` / `loginAdmin`

## Backend
* routes: backend/routes/auth.js (mounted `/api/auth`)
* controllers: backend/controllers/authController.js

## Base de données
* users

## APIs
* POST /api/auth/login
* POST /api/auth/login-admin (ou login with role detection)

## Description
Formulaire de connexion pour utilisateurs et logique de redirection selon rôle (admin vers /admin).

---

# Interface Inscription (Register)

## Frontend
* src/pages/auth/Register.jsx
* Services: uses `AuthContext.register` (frontend `src/services/api.js` + `src/services/user.js`)

## Backend
* routes: backend/routes/auth.js
* controllers: backend/controllers/authController.js

## Base de données
* users

## APIs
* POST /api/auth/register

## Description
Formulaire d'inscription avec validation locale (rôle, téléphone, mot de passe), enregistre l'utilisateur via l'API.

---

# Interface Admin Login

## Frontend
* src/pages/auth/AdminLogin.jsx
* Uses: `AuthContext.loginAdmin`

## Backend
* routes: backend/routes/admin.js (admin authentication may be handled in auth.js)
* controllers: backend/controllers/adminController.js, authController.js

## Base de données
* admin users (users)

## APIs
* POST /api/auth/login (admin)

## Description
Authentification dédiée aux administrateurs.

---

# Interface Messagerie (ChatCenter)

## Frontend
* src/pages/chat/ChatCenter.jsx
* Uses: src/components/PlatformLayout.jsx
* Services: src/services/chat.js
* Hooks: realtime subscribe logic (frontend -> supabase client)

## Backend
* routes: backend/routes/chat.routes.js (mounted `/api/chat`)
* controllers: backend/controllers/chat.controller.js, chatContacts.controller.js
* services: backend/services (chat-related)

## Base de données
* messages / conversations / chat_contacts

## APIs
* GET /api/chat/contacts
* GET /api/chat/conversations
* GET /api/chat/conversations/:id/messages
* POST /api/chat/conversations/:id/message
* Realtime subscription via Supabase (supabase client)

## Description
Interface de messagerie temps réel : conversations, envoi et réception de messages, abonnement realtime.

---

# Interface Garage Dashboard

## Frontend
* src/pages/garage/Dashboard.jsx
* Uses: src/components/dashboard/GarageDashboardAppointments.jsx, PlatformLayout
* Services: src/services/garage.js, src/services/user.js

## Backend
* routes: backend/routes/garage.routes.js, backend/routes/appointments.js
* controllers: backend/controllers/garage.controller.js, garageService.controller.js, garageReview.controller.js, appointment.controller.js

## Base de données
* garages
* garage_services
* reviews
* appointments

## APIs
* GET /api/garages/my (getMyGarage)
* GET /api/garages/:id/reviews
* GET/POST /api/garage/services
* POST /api/garages/photos

## Description
Espace métier garage : gestion profil garage, services, photos, planning et consultations de rendez-vous.

---

# Interface Garage Appointments

## Frontend
* src/pages/garage/Appointments.jsx
* Components: shared appointment components under src/components/appointments/
* Services: src/services/appointments.js

## Backend
* routes: backend/routes/appointments.js
* controllers: backend/controllers/appointment.controller.js

## Base de données
* appointments
* users

## APIs
* GET /api/appointments (list with filters)
* PUT /api/appointments/:id

## Description
Affiche la liste des rendez-vous pour le garage et permet d'agir (confirmer, annuler, proposer date).

---

# Interface Automobiliste Dashboard

## Frontend
* src/pages/automobiliste/Dashboard.jsx
* Uses: PlatformLayout, components for appointments, recommendations, garages
* Services: src/services/recommendation.js, src/services/appointments.js, src/services/garage.js

## Backend
* routes: backend/routes/recommendations.js, backend/routes/appointments.js, backend/routes/garages.js
* controllers: backend/controllers/recommendationController.js, appointment.controller.js, garage.controller.js

## Base de données
* users
* recommendations
* appointments

## APIs
* GET /api/recommendations
* GET /api/appointments
* GET /api/garages

## Description
Tableau de bord pour l'automobiliste : recommandations, accès rapide aux garages, rendez-vous et messages.

---

# Interface Automobiliste Appointments

## Frontend
* src/pages/automobiliste/Appointments.jsx
* Components: src/components/appointments/*
* Services: src/services/appointments.js

## Backend
* routes: backend/routes/appointments.js
* controllers: backend/controllers/appointment.controller.js

## Base de données
* appointments
* users

## APIs
* GET /api/appointments?userId=...
* POST /api/appointments

## Description
Gestion et consultation des rendez-vous côté automobiliste, prise de rendez-vous et suivi.

---

# Interface Automobiliste Garages

## Frontend
* src/pages/automobiliste/Garages.jsx
* Components: src/components/GoogleMapGarages.jsx, Garage list components
* Services: src/services/garage.js

## Backend
* routes: backend/routes/garages.js, backend/routes/garage.routes.js
* controllers: backend/controllers/garage.controller.js, garageMatchingController.js

## Base de données
* garages
* garage_locations

## APIs
* GET /api/garages (liste + filtres)
* GET /api/garages/:id

## Description
Rechercher et afficher garages, carte et détails, filtres de proximité et services.

---

# Interface Automobiliste Alerts (Maintenance)

## Frontend
* src/pages/automobiliste/AlertsPage.jsx
* src/pages/automobiliste/maintenance/MaintenancePage.jsx
* Components: AlertCard, MaintenanceCalendar
* Services: src/services/maintenance.js, src/services/maintenanceAlerts.js

## Backend
* routes: backend/routes/maintenance.routes.js, backend/routes/maintenanceAlerts.js
* controllers: backend/controllers/maintenance.controller.js, maintenanceAlert.controller.js

## Base de données
* maintenance_alerts
* maintenance
* vehicles

## APIs
* GET /api/maintenance-alerts
* GET /api/maintenance

## Description
Affiche alertes de maintenance, calendrier et suggestions d'interventions et garages recommandés.

---

# Interface Intervention Detail

## Frontend
* src/pages/automobiliste/InterventionDetail.jsx
* Services: src/services/interventions.js

## Backend
* routes: backend/routes/interventions.js
* controllers: backend/controllers/interventionController.js (ou intervention.controller.js)

## Base de données
* interventions
* vehicles

## APIs
* GET /api/vehicules/:vehicleId/interventions/:id
* PUT /api/vehicules/:vehicleId/interventions/:id

## Description
Détail d'une intervention (historique d'entretien), pièces associées et états.

---

# Interface Vehicle History

## Frontend
* src/pages/automobiliste/VehicleHistory.jsx
* Services: src/services/vehicule.js, src/services/interventions.js

## Backend
* routes: backend/routes/vehicules.js
* controllers: backend/controllers/vehiculeController.js
* controllers: interventionController.js

## Base de données
* vehicules
* interventions

## APIs
* GET /api/vehicules/:vehicleId/interventions

## Description
Historique des interventions et réparations pour un véhicule donné.

---

# Interface Automobiliste Recommendations

## Frontend
* src/pages/automobiliste/Recommendations.jsx
* src/pages/automobiliste/RecommendationsAssistant.jsx
* Services: src/services/recommendation.js

## Backend
* routes: backend/routes/recommendations.js
* controllers: backend/controllers/recommendationController.js

## Base de données
* recommendations
* users
* vehicles

## APIs
* GET /api/recommendations
* POST /api/recommendations/feedback

## Description
Affiche recommandations d'entretien et maintenance adaptées à l'utilisateur et à son véhicule.

---

# Interface Vendeur Catalogue Pieces

## Frontend
* src/pages/vendeur/CataloguePieces.jsx
* Services: src/services/pieces.js, src/services/chat.js, src/services/user.js
* Components: PlatformLayout, map and piece card components

## Backend
* routes: backend/routes/piece.routes.js, backend/routes/pieces.js
* controllers: backend/controllers/piece.controller.js
* services: backend/services/pieceService.js

## Base de données
* pieces
* vendors / vendeurs

## APIs
* GET /api/pieces
* GET /api/pieces/:id
* POST /api/pieces
* PUT /api/pieces/:id

## Description
Catalogue marchand de pièces, gestion CRUD pour vendeurs, comparaison et contact vendeur via chat.

---

# Interface Vendeur Comparaison Prix

## Frontend
* src/pages/vendeur/ComparaisonPrix.jsx
* Services: src/services/pieces.js, src/services/chat.js

## Backend
* routes: backend/routes/pieces.js or piece.routes.js
* controllers: backend/controllers/piece.controller.js

## Base de données
* pieces
* offers / vendor_offers

## APIs
* POST /api/pieces/compare (ou GET /api/pieces?name=...)

## Description
Comparaison multi-vendeurs pour une référence/nom de pièce ; redirection vers chat pour contacter vendeur.

---

# Interface Admin Dashboard

## Frontend
* src/pages/admin/Dashboard.jsx
* Services: src/services/admin.js (dashboard and admin endpoints)

## Backend
* routes: backend/routes/admin.js
* controllers: backend/controllers/adminController.js
* routes: backend/routes/reports.js, backend/routes/appointments.js

## Base de données
* users
* garages
* pieces
* reports
* appointments

## APIs
* GET /api/admin/dashboard-stats
* GET /api/admin/audit-logs
* GET /api/garages
* GET /api/pieces
* POST /api/admin/approve

## Description
Tableau de bord administrateur : statistiques, gestion garages/pièces, audit et gestion des signalements.

---

# Interface Admin Audit Logs

## Frontend
* src/pages/admin/AuditLogs.jsx
* Uses axios to call admin APIs (API_BASE_URL env)

## Backend
* routes: backend/routes/admin.js
* controllers: backend/controllers/adminController.js

## Base de données
* audit_logs

## APIs
* GET /api/admin/audit-logs?page=...&limit=...

## Description
Consultation, filtrage et export CSV des logs d'audit administrateur.

---

# Remarques générales

- Les correspondances frontend→backend ci-dessus sont inférées automatiquement à partir des imports de services côté frontend (ex: `src/services/appointments.js` ↔ `backend/routes/appointments.js` + `backend/controllers/appointment.controller.js`).
- Probables tables/collections trouvées dans le backend :
  - users, appointments, garages, pieces, interventions, maintenance, recommendations, messages/conversations, reports, audit_logs, notifications
- Les routes principales montées par le backend sont listées dans `backend/routes/index.js` :
  - `/api/auth`, `/api/vehicules`, `/api/pieces`, `/api/public`, `/api/recommendations`, `/api/garages`, `/api/chat`, `/api/notifications`, `/api/appointments`, `/api/maintenance-alerts`, `/api/reports`, `/api/admin`, `/api/maintenance`

---

# Utilisation et vérification

- Pour vérifier une interface spécifique, ouvrez le fichier frontal correspondant sous `frontend/src/pages/...` et repérez les appels aux fonctions de `src/services/*` — ils indiquent les endpoints backend utilisés.
- Les contrôleurs backend se trouvent dans `backend/controllers/` et les routes dans `backend/routes/`. Le routeur central est dans `backend/routes/index.js`.

---

_Fin de la documentation générée automatiquement._
