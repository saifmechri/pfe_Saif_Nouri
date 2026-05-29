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
