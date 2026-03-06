# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# AutoBot Frontend

Frontend officiel du projet PFE – Plateforme intelligente de gestion automobile
Technologies : **React.js + Vite + Tailwind CSS**

---

#  1. Présentation du Projet

AutoPlatform est une plateforme web intelligente permettant :

* 👤 Automobiliste : gestion véhicule, réservation, suivi entretien
* 🔧 Garage : gestion services et planning
* 🏪 Vendeur : gestion pièces et stock
* 👑 Administrateur : supervision système

Ce dépôt contient uniquement **le frontend (interface utilisateur)**.

---

# 🏗 Architecture Générale du Projet

```
autoplatform-frontend/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── routes/
│   ├── services/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── store/
│   ├── config/
│   ├── constants/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

# 📂 2. Explication Détaillée des Dossiers

---

## 📁 public/

Contient les fichiers publics accessibles directement :

* favicon
* images statiques
* fichiers SEO

---

## 📁 src/

Contient tout le code source de l’application.

---

## 📁 src/assets/

Contient :

* Images
* Logos
* Icônes
* SVG

Rôle : centraliser toutes les ressources graphiques.

## 📁 src/components/

Contient les composants réutilisables globaux :

Exemples :

* Navbar
* Footer
* Sidebar
* Button
* Input
* Modal
* Card
* Loader
* ProtectedRoute
* ChatBox
* MapComponent

Rôle :

* Réutilisabilité
* Séparation UI / logique
* Composants indépendants

---

## 📁 src/pages/

Chaque fichier représente une page correspondant à une route.

### 🔐 auth/

* Login.jsx → Page de connexion
* Register.jsx → Page d'inscription

### 👤 automobiliste/

* DashboardAuto.jsx → Tableau de bord automobiliste
* MesVehicules.jsx → Liste des véhicules
* AjouterVehicule.jsx → Ajout véhicule
* CarnetEntretien.jsx → Historique intelligent

### 🔧 garage/

* DashboardGarage.jsx → Tableau de bord garage
* ServicesGarage.jsx → Gestion services
* Planning.jsx → Gestion planning

### 🏪 vendeur/

* DashboardVendeur.jsx → Tableau de bord vendeur
* GestionStock.jsx → Gestion pièces & stock

### 👑 admin/

* DashboardAdmin.jsx → Supervision globale
* GestionUsers.jsx → Gestion utilisateurs

### 🛒 marketplace/

* CataloguePieces.jsx → Liste des pièces
* DetailsPiece.jsx → Détail pièce

### 📅 reservation/

* PrendreRendezVous.jsx → Réservation service

### 💬 chat/

* Messagerie.jsx → Communication temps réel

Rôle global du dossier pages :
Contenir les interfaces métier correspondant aux fonctionnalités du système.

---

## 📁 src/layouts/

Contient les structures globales :

* MainLayout → Layout public (Navbar + Footer)
* DashboardLayout → Layout privé utilisateur connecté
* AuthLayout → Layout minimal pour login/register

Rôle :
Uniformiser la structure des pages.

---

## 📁 src/routes/

Gestion de la navigation :

* AppRouter.jsx → Définition des routes
* PrivateRoute.jsx → Protection des routes authentifiées
* RoleRoute.jsx → Protection par rôle

Rôle :
Sécuriser et organiser la navigation.

---

## 📁 src/services/

Gestion des appels API :

* api.js → Configuration Axios
* authService.js → Authentification
* userService.js → Gestion utilisateurs
* vehicleService.js → Gestion véhicules
* pieceService.js → Gestion pièces
* garageService.js → Gestion garages
* reservationService.js → Gestion rendez-vous
* chatService.js → Messagerie

Rôle :
Centraliser toute la communication avec le backend.

---

## 📁 src/context/

Gestion de l’état global :

* AuthContext → Utilisateur connecté & JWT
* SocketContext → Connexion WebSocket
* NotificationContext → Gestion notifications

Rôle :
Partager les données globales dans toute l’application.

---

## 📁 src/hooks/

Hooks personnalisés :

* useAuth → Gestion authentification
* useFetch → Appels API génériques
* useSocket → Connexion temps réel
* useRole → Vérification rôle utilisateur

Rôle :
Réutiliser la logique métier.

---

## 📁 src/utils/

Fonctions utilitaires :

* formatDate.js
* jwtDecode.js
* validators.js
* calculateMileage.js

Rôle :
Fonctions techniques indépendantes.

---

## 📁 src/store/

Optionnel (si Redux ou autre gestionnaire d’état global avancé).

---

## 📁 src/config/

Fichiers de configuration :

* apiConfig.js → URL API
* socketConfig.js → Configuration WebSocket
* roles.js → Définition des rôles

Rôle :
Centraliser la configuration système.

---

## 📁 src/constants/

Constantes globales :

* routes.js → Liste des routes
* permissions.js → Règles d’accès

Rôle :
Éviter les valeurs codées en dur.

---

## 📁 src/styles/

Contient :

* index.css (Tailwind)
* animations.css

Rôle :
Gestion globale des styles.

---

# 📄 3. Fichiers Principaux

---

## main.jsx

Point d’entrée de l’application.
Monte l’application React dans le DOM.

---

## App.jsx

Contient la structure principale et le Router.

---

## .env

Variables d’environnement :

* VITE_API_URL
* VITE_SOCKET_URL
* VITE_GOOGLE_MAPS_KEY

---

## package.json

Liste des dépendances et scripts :

* npm run dev

---

## tailwind.config.js

Configuration du framework CSS Tailwind.

---

## vite.config.js

Configuration du bundler Vite.

---

# 🔐 4. Gestion des Rôles

Le système gère 4 rôles :

* automobiliste
* garage
* vendeur
* administrateur

Les routes sont protégées par rôle via RoleRoute.

---

# 🔄 5. Correspondance avec les Sprints

Sprint 2 → Authentification
Sprint 3 → Gestion véhicules
Sprint 4 → Marketplace
Sprint 5 → Garages
Sprint 6 → Réservation
Sprint 7 → Messagerie
Sprint 8 → Module intelligent
Sprint 9 → Dashboard Admin
Sprint 10 → Tests & déploiement

---

# 🎯 Conclusion

Ce frontend est :

* Modulaire
* Sécurisé
* Basé sur rôles
* Évolutif
* Prêt pour production
* Conforme aux exigences académiques PFE

---

# 👨‍💻 Auteur

Projet réalisé dans le cadre d’un Projet de Fin d’Études (PFE).

---
