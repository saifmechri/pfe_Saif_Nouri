# Défaut projet / Présentation du projet

Ce document présente le projet de manière simple: son but, ses fonctionnalités, son architecture, les langages utilisés et son mode de fonctionnement.

## 1. But du projet

Le but du projet est de créer une plateforme web de gestion automobile qui permet à plusieurs profils d’utilisateurs de travailler dans un même système:

- l’automobiliste qui gère son véhicule et son entretien
- le garage qui gère ses services et ses rendez-vous
- le vendeur de pièces qui gère son catalogue et son stock
- l’administrateur qui supervise la plateforme

L’objectif principal est de centraliser tout ce qui concerne l’entretien automobile, les réparations, les pièces, les garages, les rendez-vous et les échanges entre utilisateurs.

## 2. Fonctionnalités principales

### Pour l’automobiliste

- création de compte et connexion
- gestion du profil
- ajout, modification et suppression d’un véhicule
- suivi de l’historique des interventions
- consultation des alertes de maintenance
- consultation des garages recommandés
- recherche de garages
- prise et gestion de rendez-vous
- échange de messages via le chat
- consultation des notifications
- recherche et comparaison de pièces

### Pour le garage

- connexion à son espace
- gestion du profil garage
- gestion des services proposés
- consultation des rendez-vous
- réponse aux messages
- consultation des avis
- gestion des photos et informations du garage

### Pour le vendeur de pièces

- gestion du profil
- ajout, modification et suppression des pièces
- gestion du stock
- consultation du catalogue
- réponse aux messages des clients
- comparaison des pièces selon les vendeurs

### Pour l’administrateur

- supervision des utilisateurs
- approbation ou rejet de comptes
- gestion des garages
- gestion des pièces signalées
- consultation des statistiques
- consultation des rapports
- consultation des journaux d’activité

### Fonctions transversales

- authentification JWT
- contrôle d’accès par rôle
- notifications
- statistiques publiques
- recommandations intelligentes de garages selon le véhicule et la maintenance

## 3. Langages et technologies utilisés

### Frontend

- **JavaScript** avec **React**
- **Vite** comme outil de build et de développement
- **React Router** pour la navigation
- **Tailwind CSS** pour le style
- **Lucide React** pour les icônes
- **Axios** pour les appels API
- **Leaflet** et **React Leaflet** pour la carte et la géolocalisation
- **Supabase** pour certaines fonctionnalités temps réel
- **Day.js** pour la gestion des dates

### Backend

- **JavaScript** avec **Node.js**
- **Express.js** pour le serveur API
- **PostgreSQL** pour la base de données
- **JWT** pour l’authentification
- **bcrypt** pour le chiffrement des mots de passe
- **Multer** pour l’upload de fichiers et photos
- **express-validator** pour la validation des données
- **dotenv** pour la configuration des variables d’environnement

## 4. Architecture du projet

Le projet est organisé en deux grandes parties:

### 4.1 Frontend

Le frontend est situé dans le dossier `frontend/`.

Rôle:

- afficher l’interface utilisateur
- gérer la navigation entre les pages
- appeler l’API backend
- afficher les données récupérées
- gérer les formulaires et les états locaux

Structure principale:

- `src/pages/` : pages principales de l’application
- `src/components/` : composants réutilisables
- `src/services/` : appels API vers le backend
- `src/routes/` : configuration du routage
- `src/context/` : contexte d’authentification et de session
- `src/hooks/` : hooks personnalisés
- `src/utils/` : fonctions utilitaires

### 4.2 Backend

Le backend est situé dans le dossier `backend/`.

Rôle:

- exposer les API REST
- contrôler les accès par rôle
- gérer la logique métier
- interagir avec la base de données PostgreSQL
- traiter les uploads de fichiers
- gérer les notifications, le chat et les recommandations

Structure principale:

- `routes/` : définition des endpoints API
- `controllers/` : logique des requêtes HTTP
- `services/` : logique métier plus avancée
- `middlewares/` : vérification des tokens, rôles, erreurs et uploads
- `models/` : modèles et accès aux données
- `migrations/` : modifications de schéma de base de données
- `uploads/` : fichiers envoyés par les utilisateurs

### 4.3 Architecture technique détaillée

Le projet suit une architecture en couches. Chaque couche a un rôle précis et communique avec la couche suivante.

#### Front : route

- gère la navigation entre les pages
- définit les chemins de l’application avec React Router
- protège certaines pages selon le rôle utilisateur

Exemples:

- `/login`
- `/dashboard`
- `/vehicules`
- `/garages`
- `/appointments`

#### Front : component

- affiche l’interface visuelle
- gère les formulaires, boutons, tableaux, cartes et modales
- reçoit les données des pages ou des services

Exemples:

- carte véhicule
- formulaire d’ajout véhicule
- tableau des rendez-vous
- modal de confirmation

#### Front : services

- centralise les appels API vers le backend
- évite de répéter les requêtes dans plusieurs composants
- transforme parfois les données avant de les envoyer ou de les afficher

Exemples:

- `src/services/vehicule.js`
- `src/services/appointments.js`
- `src/services/garage.js`

#### Front : pages

- représente les écrans principaux de l’application
- assemble plusieurs composants
- appelle les services au chargement ou lors d’une action utilisateur

Exemples:

- page dashboard automobiliste
- page garages
- page historique des interventions
- page chat

#### Front : requête

- envoie les données au backend via HTTP
- utilise généralement `GET`, `POST`, `PUT` et `DELETE`
- ajoute le token JWT quand la route est protégée

Exemple:

- `POST /api/vehicules` pour ajouter un véhicule

#### Backend : route

- reçoit la requête HTTP venant du frontend
- applique les middlewares de sécurité
- redirige la requête vers le controller approprié

Exemples:

- `backend/routes/vehicules.js`
- `backend/routes/auth.js`
- `backend/routes/appointments.js`

#### Backend : controller

- contient la logique de traitement de la requête
- valide les données reçues
- appelle la base de données ou un service métier
- renvoie la réponse JSON au frontend

Exemples:

- `backend/controllers/vehiculeController.js`
- `backend/controllers/authController.js`
- `backend/controllers/appointment.controller.js`

#### Backend : modele

- représente les entités métier de la base
- organise l’accès aux données
- peut être utilisé pour lire, créer, modifier ou supprimer les enregistrements

Exemples:

- `backend/models/user.model.js`
- `backend/models/garage.model.js`
- `backend/models/appointment.model.js`

#### Backend : Migration

- modifie la structure de la base de données
- ajoute, supprime ou change des colonnes et des tables
- permet d’évoluer sans casser tout le système

Exemple:

- ajout de champs pour les rendez-vous ou les véhicules

#### Bd

- stocke toutes les données de l’application
- conserve les utilisateurs, véhicules, garages, rendez-vous, pièces, messages et notifications
- PostgreSQL est utilisé comme base principale

#### Exemple de communication complète : ajout d’un véhicule

1. L’utilisateur ouvre la page véhicule dans le frontend.
2. Il remplit le formulaire dans un composant React.
3. Le composant appelle le service frontend `createVehicule()`.
4. Le service envoie une requête `POST /api/vehicules`.
5. La route backend `backend/routes/vehicules.js` reçoit la requête.
6. Le middleware vérifie le token JWT et autorise l’accès.
7. Le controller `createVehicule` valide les champs reçus.
8. Le controller enregistre le véhicule dans la base PostgreSQL.
9. La réponse JSON revient au frontend.
10. Le composant met à jour la liste des véhicules à l’écran.

## 5. Comment fonctionne le projet

Le fonctionnement global suit ce principe:

1. l’utilisateur ouvre l’application frontend
2. il se connecte ou crée un compte
3. le frontend envoie des requêtes HTTP au backend
4. le backend vérifie le token JWT si la route est protégée
5. le backend exécute la logique métier
6. le backend interroge la base PostgreSQL
7. le backend renvoie une réponse JSON
8. le frontend affiche ou met à jour les données à l’écran

### Exemple de cycle d’utilisation

- l’automobiliste ajoute un véhicule
- il enregistre une intervention ou une réparation
- le système calcule ou affiche les alertes de maintenance
- des garages recommandés sont proposés selon les besoins du véhicule
- l’utilisateur peut prendre rendez-vous ou contacter un garage

## 6. Organisation logique des modules

### Module Auth

Gère:

- inscription
- connexion
- profil
- changement de mot de passe

### Module Véhicules

Gère:

- liste des véhicules
- création et modification
- suppression
- récupération de l’historique lié au véhicule

### Ajout d’un véhicule : architecture étape par étape

Voici comment la fonctionnalité d’ajout d’un véhicule circule dans l’application:

1. L’automobiliste ouvre son tableau de bord dans le frontend, dans la page qui gère ses véhicules.
2. Il remplit le formulaire avec les données du véhicule: modèle, matricule, type, kilométrage et éventuellement une photo.
3. Le composant frontend prépare les données et appelle `createVehicule()` depuis `frontend/src/services/vehicule.js`.
4. Ce service envoie une requête `POST /api/vehicules` vers le backend.
5. La route `backend/routes/vehicules.js` reçoit la requête, vérifie le token JWT avec `verifyToken`, puis traite l’upload éventuel de la photo avec `uploadVehiculePhoto.single("photo")`.
6. La route transmet ensuite le traitement au controller `createVehicule` dans `backend/controllers/vehiculeController.js`.
7. Le controller valide les champs obligatoires et contrôle que le matricule et le kilométrage sont cohérents.
8. Si la validation est correcte, le controller insère le véhicule dans la table PostgreSQL `vehicules` avec l’identifiant de l’utilisateur connecté.
9. Si une photo a été envoyée, son chemin est enregistré avec le véhicule pour pouvoir l’afficher ensuite dans l’interface.
10. Le backend renvoie une réponse JSON avec le véhicule créé et un message de succès.
11. Le frontend met alors à jour l’affichage pour montrer le nouveau véhicule dans la liste.

### Explication simple du rôle de chaque couche

- Le frontend sert à afficher le formulaire et à lancer l’action de création.
- Le service frontend centralise l’appel HTTP pour éviter de dupliquer la logique réseau.
- La route backend protège l’accès et distribue la requête vers la bonne logique.
- Le controller applique les règles métier du véhicule et prépare l’écriture en base.
- La base de données conserve définitivement le véhicule de l’utilisateur.

### Pourquoi cette architecture est utile

- Elle sépare l’interface, la logique métier et les données.
- Elle rend le code plus facile à maintenir et à tester.
- Elle permet de réutiliser la même logique pour l’ajout, la modification, la suppression et la consultation des véhicules.

### Module Interventions et Maintenance

Gère:

- interventions enregistrées
- historique d’entretien
- prochain entretien
- alertes de révision
- recommandations de garages

### Module Garages

Gère:

- liste des garages
- détails du garage
- services
- avis
- disponibilité
- recherche et matching avec véhicule

### Module Pièces

Gère:

- catalogue des pièces
- stock
- comparaison entre vendeurs
- localisation des vendeurs

### Module Rendez-vous

Gère:

- création de rendez-vous
- consultation
- modification
- validation ou refus selon le rôle

### Module Chat et Notifications

Gère:

- conversations
- messages en temps réel
- notifications système

### Module Administration

Gère:

- validation des utilisateurs
- supervision des garages et pièces
- rapports
- statistiques
- audit

## 6.1 Architecture par fonctionnalité

Chaque fonctionnalité suit le même schéma général:

1. l’utilisateur agit depuis une page React dans `frontend/src/pages/`
2. la page appelle un service API dans `frontend/src/services/`
3. la requête arrive sur une route Express dans `backend/routes/`
4. la route délègue à un controller dans `backend/controllers/`
5. le controller s’appuie sur un service métier dans `backend/services/` si la logique est plus complexe
6. le service ou le controller interagit avec les modèles dans `backend/models/` et la base PostgreSQL
7. la réponse JSON est renvoyée au frontend et affichée à l’écran

### Authentification et compte utilisateur

Fonctionnalités:

- inscription
- connexion utilisateur et admin
- gestion du profil
- changement de mot de passe
- suppression de compte

Chaîne technique:

- frontend: `src/pages/auth/*`, `src/pages/profil/profil.jsx`
- services: `src/services/user.js`, `src/services/api.js`
- backend: `backend/routes/auth.js`, `backend/controllers/authController.js`, `backend/controllers/profileController.js`
- sécurité: JWT, middlewares d’authentification et de rôle
- base de données: `users`

### Véhicules

Fonctionnalités:

- ajout d’un véhicule
- modification et suppression
- consultation de la liste
- récupération du véhicule courant pour les autres modules

Chaîne technique:

- frontend: pages véhicule et tableaux de bord automobiliste
- services: `src/services/vehicule.js`
- backend: `backend/routes/vehicules.js`, `backend/controllers/vehiculeController.js`
- base de données: `vehicules`

Le module véhicule sert souvent de point d’entrée pour les autres fonctionnalités, car les interventions, les alertes et les recommandations sont rattachées à un véhicule précis.

### Interventions et maintenance

Fonctionnalités:

- enregistrement des interventions
- historique d’entretien
- alertes de maintenance
- calcul des prochains entretiens
- recommandations de garages

Chaîne technique:

- frontend: `src/pages/automobiliste/VehicleHistory.jsx`, `src/pages/automobiliste/maintenance/MaintenancePage.jsx`, `src/pages/automobiliste/AlertsPage.jsx`
- services: `src/services/interventions.js`, `src/services/maintenance.js`, `src/services/maintenanceAlerts.js`
- backend: `backend/routes/interventions.js`, `backend/routes/maintenance.routes.js`, `backend/routes/maintenanceAlerts.js`
- logique métier: `backend/services/interventionService.js`, `backend/services/maintenanceService.js`, `backend/services/maintenanceAlertService.js`
- base de données: `interventions`, `maintenance`, `maintenance_alerts`

Ce module fonctionne souvent en cascade: une intervention enregistrée peut mettre à jour l’état d’entretien, qui peut ensuite générer une alerte ou déclencher une recommandation.

### Garages

Fonctionnalités:

- recherche de garages
- affichage carte et proximité
- consultation du détail garage
- gestion du profil garage
- gestion des services, photos et avis
- disponibilité et réservation

Chaîne technique:

- frontend: `src/pages/automobiliste/Garages.jsx`, `src/pages/garage/Dashboard.jsx`, `src/pages/garage/Appointments.jsx`
- services: `src/services/garage.js`, `src/services/appointments.js`
- backend: `backend/routes/garages.js`, `backend/routes/garage.routes.js`, `backend/routes/appointments.js`
- controllers: `backend/controllers/garage.controller.js`, `backend/controllers/garageService.controller.js`, `backend/controllers/garageReview.controller.js`, `backend/controllers/appointment.controller.js`
- base de données: `garages`, `garage_services`, `reviews`, `appointments`

### Pièces

Fonctionnalités:

- catalogue des pièces
- ajout, modification et suppression
- gestion du stock
- comparaison entre vendeurs
- chat avec vendeur

Chaîne technique:

- frontend: `src/pages/vendeur/CataloguePieces.jsx`, pages de recherche côté automobiliste
- services: `src/services/pieces.js`, `src/services/chat.js`
- backend: `backend/routes/piece.routes.js`, `backend/routes/pieces.js`
- controller: `backend/controllers/piece.controller.js`
- service métier: `backend/services/pieceService.js`
- base de données: `pieces`, `piece_stock_movements`

Le module pièces s’appuie sur une logique métier dédiée pour le stock, l’historique des mouvements et la validation des pièces.

### Rendez-vous

Fonctionnalités:

- création d’un rendez-vous
- consultation côté automobiliste et garage
- validation, refus ou proposition de nouvelle date
- suivi du statut

Chaîne technique:

- frontend: composants et pages de rendez-vous dans `frontend/src/components/appointments/` et `frontend/src/pages/automobiliste/Appointments.jsx`, `frontend/src/pages/garage/Appointments.jsx`
- services: `src/services/appointments.js`
- backend: `backend/routes/appointments.js`
- controller: `backend/controllers/appointment.controller.js`
- base de données: `appointments`

### Chat et notifications

Fonctionnalités:

- conversations temps réel
- envoi et réception de messages
- notifications système

Chaîne technique:

- frontend: `src/pages/chat/ChatCenter.jsx`, composants de notification
- services: `src/services/chat.js`, `src/services/notifications.js`
- backend: `backend/routes/chat.routes.js`, `backend/routes/notifications.js`
- controllers: `backend/controllers/chat.controller.js`, `backend/controllers/chatContacts.controller.js`, `backend/controllers/notification.controller.js`
- base de données: conversations, messages, notifications

Le chat combine une API REST pour charger les données et un mécanisme temps réel pour recevoir les messages sans rechargement complet.

### Administration

Fonctionnalités:

- supervision de la plateforme
- suppression ou gestion des comptes
- gestion des signalements
- consultation des statistiques et logs
- suivi des réservations

Chaîne technique:

- frontend: pages et tableau de bord admin
- backend: `backend/routes/admin.js`, `backend/routes/reports.js`, `backend/routes/public.js`
- controllers: `backend/controllers/adminController.js`, `backend/controllers/report.controller.js`, `backend/controllers/publicController.js`
- base de données: `users`, `reports`, `appointments`, et autres tables métier selon les vues

### Résumé de circulation

La logique de circulation reste donc la même pour toutes les fonctionnalités:

- une page frontend déclenche l’action
- un service frontend centralise l’appel HTTP
- une route backend reçoit la requête
- un controller valide et orchestre la réponse
- un service métier exécute les règles complexes si nécessaire
- les modèles et la base de données fournissent les données
- le frontend affiche le résultat au composant concerné

## 7. Routes backend principales

Le backend expose plusieurs groupes d’API:

- `/api/auth`
- `/api/vehicules`
- `/api/vehicules/:vehicleId/interventions`
- `/api/pieces`
- `/api/garages`
- `/api/appointments`
- `/api/chat`
- `/api/notifications`
- `/api/maintenance`
- `/api/maintenance-alerts`
- `/api/reports`
- `/api/admin`
- `/api/public`

## 8. Base de données

Le projet utilise PostgreSQL.

Les principales entités visibles dans le code sont:

- users
- garages
- vehicules
- interventions
- appointments
- pieces
- notifications
- reports
- maintenance alerts
- chats / conversations / messages

## 9. Est-ce que le projet utilise RESTful ?

Oui, le projet utilise une architecture API de type RESTful pour la partie backend.

On le voit dans le code car:

- les ressources sont exposées par des routes claires comme `/api/auth`, `/api/vehicules`, `/api/garages`, `/api/pieces`, `/api/appointments`
- les verbes HTTP sont utilisés selon leur rôle:
	- `GET` pour lire des données
	- `POST` pour créer une ressource
	- `PUT` ou `PATCH` pour modifier une ressource
	- `DELETE` pour supprimer une ressource
- les réponses sont généralement renvoyées en JSON
- le backend reste stateless pour les accès protégés, avec un token JWT transmis dans le header `Authorization`

### Exemple concret

- `GET /api/vehicules` pour lire la liste des véhicules
- `POST /api/vehicules` pour créer un véhicule
- `PUT /api/vehicules/:id` pour modifier un véhicule
- `DELETE /api/vehicules/:id` pour supprimer un véhicule

### Comment faire dans ton projet

Pour rester RESTful, il faut respecter ces règles:

1. utiliser des noms de ressources dans l’URL, pas des actions longues
2. utiliser le bon verbe HTTP selon l’opération
3. renvoyer des réponses JSON cohérentes
4. utiliser les bons codes HTTP:
	 - `200` pour lecture ou modification réussie
	 - `201` pour création
	 - `400` pour erreur de validation
	 - `401` pour non connecté
	 - `403` pour accès interdit
	 - `404` pour ressource introuvable
	 - `500` pour erreur serveur
5. garder les routes simples et prévisibles

### Dans Postman

Pour tester une API RESTful:

- choisir la bonne méthode HTTP
- écrire l’URL de la ressource
- ajouter le token si la route est protégée
- envoyer le body JSON si nécessaire
- vérifier le code de réponse et la structure JSON

### Conclusion

Oui, ton projet est basé sur une logique RESTful pour ses API backend. Il n’est pas forcément REST parfait à 100 % sur chaque détail, mais la structure générale suit bien les principes REST: ressources, verbes HTTP, stateless authentication et échanges JSON.

## 10. Sécurité et contrôle d’accès

Le projet utilise:

- un token JWT pour authentifier les utilisateurs
- des middlewares pour vérifier les rôles
- des routes protégées selon le type d’utilisateur

Exemples de rôles:

- automobiliste
- garage
- vendeur
- admin

## 11. Résumé

Ce projet est une plateforme complète de gestion automobile orientée entretien, garages, pièces et rendez-vous. Son architecture est séparée en frontend et backend, ce qui rend le système plus facile à maintenir, à tester et à faire évoluer.

Le frontend React affiche l’expérience utilisateur, tandis que le backend Express gère la logique métier, l’authentification et la base de données PostgreSQL.
