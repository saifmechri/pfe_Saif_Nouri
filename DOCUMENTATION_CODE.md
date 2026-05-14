# 📚 AUTO BOT - DOCUMENTATION COMPLÈTE DU CODE

## 🎯 Vue d'ensemble

AUTO BOT est une plateforme intelligente de gestion de maintenance automobile qui connecte les conducteurs (automobilistes) avec les garages de réparation.

**Trois rôles principaux:**
- **Automobiliste**: Propriétaire de véhicules cherchant des services de maintenance
- **Garage**: Atelier de réparation offrant des services
- **Admin**: Gestionnaire de plateforme

---

## 📋 ARCHITECTURE DU SYSTÈME

```
FRONTEND (React/Vite)          BACKEND (Node.js/Express)     DATABASE (PostgreSQL)
├── Pages                      ├── Controllers
├── Services (API calls)       ├── Routes
├── Components                 ├── Models
└── Context                    ├── Middleware
                               └── Services
```

---

## 🔐 AUTHENTIFICATION & COMPTES

### Comment ça marche?

1. **Inscription (`/api/auth/register`)**
   - Utilisateur remplit formulaire (nom, email, tél, mot de passe, rôle)
   - Mot de passe hashé avec bcrypt (10 rounds)
   - Compte créé en base de données

2. **Connexion (`/api/auth/login`)**
   - Validation email/mot de passe
   - Génération JWT token (valide 7 jours)
   - Token stocké côté client (localStorage)

3. **API Calls**
   - Chaque requête inclut token dans header: `Authorization: Bearer <token>`
   - Backend valide token avant de traiter requête
   - Token expiré? Utilisateur doit se reconnecter

### Services & Endpoints

**Frontend Service**: `src/services/user.js`
```javascript
getCompleteProfile()        // Récupérer profil complet
updateProfile(data)          // Modifier profil
changePassword(passwords)    // Changer mot de passe
deleteAccount(password)      // Supprimer compte
```

**Backend Controller**: `controllers/authController.js`

---

## 🚗 GESTION DES VÉHICULES

### Fonctionnement

Chaque automobiliste peut enregistrer **plusieurs véhicules**.

**Données d'un véhicule:**
- Marque (brand): Toyota, Renault, etc.
- Modèle: Corolla, Logan
- Année: 2020
- Type carburant: Essence, Diesel, Électrique
- Kilométrage actuel
- Numéro de plaque

### Comment utiliser?

**Ajouter un véhicule** (`Dashboard.jsx`):
```javascript
const handleAddVehicle = async (vehicleData) => {
  // vehicleData = { marque, modele, annee, type_carburant, km, matricule }
  await createVehicule(vehicleData);
  // Véhicule apparaît dans la liste
};
```

**API Endpoints**:
- `GET /api/vehicules` - Récupérer tous les véhicules de l'utilisateur
- `POST /api/vehicules` - Ajouter nouveau véhicule
- `PUT /api/vehicules/:id` - Modifier véhicule (surtout km)
- `DELETE /api/vehicules/:id` - Supprimer véhicule

**Service Frontend**: `src/services/vehicule.js`

---

## 🔧 INTERVENTIONS (HISTORIQUE DE MAINTENANCE)

### Qu'est-ce qu'une intervention?

Une **intervention** est un enregistrement de travail de maintenance effectué sur un véhicule.

**Types d'interventions:**
- **vidange**: Changement d'huile moteur
- **révision**: Inspection générale (freins, pneus, fluides)
- **réparation**: Réparation d'une pièce
- **changement pneus**: Remplacement des pneus
- **climatisation**: Entretien clim
- Etc.

### Données enregistrées

Chaque intervention contient:
- Date du travail
- Type de maintenance
- Nom du garage
- Adresse du garage
- Kilométrage au moment de l'intervention
- Description détaillée du travail
- **Pièces utilisées** (format libre): "Huile 5W30 x4L, Filtre x1, Plaquettes x4"

### Comment enregistrer une intervention?

**Dans Dashboard** (`pages/automobiliste/Dashboard.jsx`):

1. Utilisateur remplit le formulaire:
   - Sélectionne le véhicule
   - Choisit type d'intervention (vidange, révision, etc.)
   - Entre nom & adresse du garage
   - Entre kilométrage
   - Ajoute description et pièces utilisées

2. Click "Enregistrer"

3. Intervention enregistrée et apparaît dans l'historique du véhicule

**API Endpoints:**
- `GET /api/vehicules/:id/interventions` - Historique du véhicule
- `POST /api/vehicules/:id/interventions` - Ajouter intervention
- `PUT /api/vehicules/:id/interventions/:intId` - Modifier
- `DELETE /api/vehicules/:id/interventions/:intId` - Supprimer

**Service Frontend**: `src/services/interventions.js`

---

## 🧠 MOTEUR DE RECOMMANDATIONS INTELLIGENTES

### Le cœur d'AUTO BOT

C'est le **système AI** qui analyse les véhicules et recommande la meilleure maintenance au meilleur garage.

### Comment ça marche?

**1. Analyse du véhicule:**
```
- Kilométrage actuel
- Dernier entretien (date + km)
- Type de véhicule
- Historique de maintenance
```

**2. Calcul de la nécessité:**
```
Si km depuis vidange > 10,000
  → Urgence vidange = URGENT

Si km depuis révision > 20,000
  → Urgence révision = RECOMMANDÉ

Pas d'historique?
  → Urgence = FUTUR (préventif)
```

**3. Scoring des garages:**
```
Pour chaque garage on calcule un score 0-100:

- Distance: Plus proche = plus de points
- Ratings: Meilleure note clients = + points
- Specialités: Spécialisé dans le type de maintenance? = + points
- Disponibilité: Garage actif? = + points

Formule: Score = (distance × 0.2) + (rating × 0.3) + (specialty × 0.3) + (availability × 0.2)
```

**4. Affichage des résultats:**

Page "Recommandations" affiche:
- TOP 1: Meilleure recommandation avec meilleur garage
- Score de confiance (0-100)
- Niveau d'urgence (URGENT / RECOMMANDÉ / FUTUR)
- Top 3 garages avec scores

### Utilisation

**Frontend**: `pages/automobiliste/RecommendationsAssistant.jsx`

```
1. Page charge automatiquement
2. Récupère tous les véhicules de l'utilisateur
3. Pour chaque véhicule:
   - Appelle API de recommandations
   - Affiche résultat avec garages proposés
4. Utilisateur peut cliquer "Choisir ce garage"
```

**API Endpoint:**
```
GET /api/recommendations/classees
Query params:
- sortBy: urgence | score | distance | type
- order: asc | desc
- page: numéro de page
- limit: nombre de résultats
```

**Service Frontend**: `src/services/recommendation.js`

**Controller Backend**: `controllers/recommendationController.js`

### Scoring Expliqué

- **80-100**: Excellent - entretien urgent + garage de qualité
- **60-79**: Bon - entretien utile + garage solide
- **40-59**: Acceptable - maintenance future possible
- **<40**: Faible - pas d'urgence

---

## 📅 SYSTÈME DE RENDEZ-VOUS (APPOINTMENTS)

### Workflow complet

```
ÉTAPE 1: Automobiliste crée rendez-vous
  - Sélectionne garage de la recommandation
  - Propose dates préférées

ÉTAPE 2: Garage reçoit notification
  - Valide la demande
  - Propose ses créneaux disponibles

ÉTAPE 3: Automobiliste choisit créneau
  - Valide le créneau proposé
  - Rendez-vous confirmé

ÉTAPE 4: Rendez-vous effectué
  - Garage marque comme complété
```

### Statuts possibles

- **PENDING**: Initial (en attente de réaction garage)
- **PROPOSED**: Garage a proposé créneau
- **CONFIRMED**: Utilisateur a validé
- **COMPLETED**: Rendez-vous effectué
- **CANCELLED**: Annulé

### API Endpoints

```
GET /api/appointments                    - Lister rendez-vous utilisateur
POST /api/appointments                   - Créer rendez-vous
GET /api/appointments/:id                - Détails rendez-vous
PATCH /api/appointments/:id              - Mettre à jour (proposer créneau, valider, etc.)
DELETE /api/appointments/:id             - Annuler
```

**Service Frontend**: `src/services/appointments.js`

---

## 💬 SYSTÈME DE CHAT

### Fonctionnalités

- **Conversations**: Automobiliste ↔ Garage en 1-to-1
- **Messages en temps réel**: Via Supabase (WebSocket)
- **Historique**: Tous les messages conservés
- **Notifications**: Alerte nouvelle message

### Comment ça marche?

```
1. Automobiliste crée rendez-vous
   → Chat auto-créé avec garage

2. Automobiliste clique "Discuter"
   → Ouvre conversation existante

3. Les deux parties échangent messages
   → Mis à jour en temps réel (Supabase)

4. Historique visible à chaque ouverture
```

### API Endpoints

```
GET /api/chat/contacts                           - Lister contacts
GET /api/chat/conversations                      - Lister conversations
POST /api/chat/conversations/start                - Démarrer conversation
GET /api/chat/conversations/:id/messages         - Historique messages
POST /api/chat/conversations/:id/messages        - Envoyer message
```

**Service Frontend**: `src/services/chat.js`

---

## 🏪 GESTION DES GARAGES

### Profil garage

Chaque garage a un profil avec:
- Nom et adresse
- Numéro téléphone
- Email
- GPS (latitude, longitude) - pour calcul distance
- Horaires travail
- Spécialités (Toyota, freins, climatisation, etc.)
- Catalogues services disponibles
- Photos
- Ratings clients

### API Endpoints

```
GET /api/garages                     - Lister tous garages
GET /api/garages/:id                 - Détails garage
GET /api/garages/:id/services        - Services offerts
POST /api/garages/:id/reviews        - Laisser avis
PUT /api/garages/:id                 - Modifier garage (propriétaire only)
```

**Controller Backend**: `controllers/garage.controller.js`

---

## 📊 STATISTIQUES PUBLIQUES

### Affichage homepage

**Page Home** affiche statistiques en direct:
- Nombre d'utilisateurs actifs
- Nombre de garages partenaires
- Nombre de pièces en catalogue
- Nombre d'interventions tracées

### Comment c'est mis à jour?

**AVANT (ancien code):**
```javascript
// Valeurs hardcodées
<p>120+</p>  // Utilisateurs
<p>15</p>    // Garages
```

**MAINTENANT (nouveau code):**
```javascript
// Récupère en temps réel
GET /api/public/stats
→ {users: 45, garages: 12, pieces: 2340, interventions: 3421}

// Affiche vraies valeurs
<p>{stats.users}</p>  // 45
<p>{stats.garages}</p> // 12
```

### Endpoint Public

```
GET /api/public/stats

NO AUTHENTICATION REQUIRED
(Accessible par n'importe qui)

Response:
{
  success: true,
  data: {
    users: 45,
    garages: 12,
    pieces: 2340,
    interventions: 3421
  }
}
```

**Service Frontend**: `src/services/publicStats.js`
**Controller Backend**: `controllers/publicController.js`

---

## 🛠️ MAINTENANCE ALERTS

Système d'alertes pour rappeler l'utilisateur quand maintenance est due.

```
- Alerte vidange si km > dernier + 10,000
- Alerte révision si km > dernier + 20,000
- Notifications push/email

Déclenché quand?
- Lors de la consultation des recommandations
- À une date périodique (cron job)
```

---

## 📈 DASHBOARD ADMIN

Accès réservé à role=admin.

Affiche:
- Statistiques utilisateurs (total, nouveaux, validés, en attente)
- Pipeline de rendez-vous (par statut)
- Garages les plus actifs
- Pièces/garages en attente de validation

**Controller**: `controllers/adminController.js`

---

## 🔗 ARCHITECTURE API

```
Base URL: http://localhost:5000/api

Public Routes (/public)
├── GET /stats                                    → getPublicStats

Auth Routes (/auth)
├── POST /register                                → Inscription
├── POST /login                                   → Connexion
├── GET /profile-complet                          → Mon profil
├── PUT /profile                                  → Modifier profil
├── PUT /profile/password                         → Changer mot de passe

Vehicle Routes (/vehicules)
├── GET /:id/interventions                        → Historique
├── POST /:id/interventions                       → Ajouter intervention

Recommendations Routes (/recommendations)
├── GET /classees                                 → Recommandations classées

Garages Routes (/garages)
├── GET /                                         → Lister tous
├── GET /:id/services                             → Services d'un garage

Appointments Routes (/appointments)
├── GET /                                         → Mes rendez-vous
├── POST /                                        → Créer rendez-vous
├── PATCH /:id                                    → Proposer/valider

Chat Routes (/chat)
├── GET /conversations                            → Mes conversations
├── POST /conversations/start                     → Démarrer chat
├── POST /conversations/:id/messages              → Envoyer message

Admin Routes (/admin)
├── GET /stats                                    → Dashboard stats
```

---

## 📱 PAGES PRINCIPALES

### Automobiliste

| Page | URL | Fonction |
|------|-----|----------|
| Dashboard | `/` | Gestion véhicules + interventions |
| Recommandations | `/recommendations` | Voir recommandations AI |
| Rendez-vous | `/appointments` | Gérer rendez-vous |
| Chat | `/chat` | Messagerie |
| Profil | `/profile` | Paramètres compte |

### Garage

| Page | URL | Fonction |
|------|-----|----------|
| Dashboard | `/garage/dashboard` | Rendez-vous reçus |
| Profil | `/garage/profile` | Infos garage |
| Services | `/garage/services` | Catalogues |
| Avis | `/garage/reviews` | Retours clients |

### Admin

| Page | URL | Fonction |
|------|-----|----------|
| Dashboard | `/admin/dashboard` | Statistiques |
| Utilisateurs | `/admin/users` | Gestion users |
| Garages | `/admin/garages` | Validation garages |
| Pièces | `/admin/pieces` | Validation pièces |

---

## 🚀 DÉPLOIEMENT & HÉBERGEMENT

### Préparation pour hébergement

Le système est prêt pour deployment:

1. **Backend (Node.js/Express)**
   - Configuré pour production
   - Variables d'environnement: DATABASE_URL, JWT_SECRET, etc.
   - API écoute sur port configurable

2. **Frontend (React/Vite)**
   - Build optimisé avec Vite
   - API base URL configurable
   - CORS configuré

3. **Base de données (PostgreSQL)**
   - Migrations prêtes
   - Backup système en place

### Commandes de production

```bash
# Backend
npm install
npm start

# Frontend
npm install
npm run build
npm run preview
```

---

## 📝 COMMENTAIRES DANS LE CODE

Tous les fichiers principaux incluent des commentaires expliquant:
- Le rôle du fichier
- Comment utiliser les fonctions
- Les paramètres et retours
- Exemples d'utilisation

**Consulter les fichiers:**
- `controllers/` - Logique métier
- `services/` (frontend) - Appels API
- `pages/` - Pages principales
- `routes/` (backend) - Définitions endpoints

---

## 🆘 DÉPANNAGE

### Problème: "Token expiré"
**Solution:** L'utilisateur doit se reconnecter

### Problème: "Aucune recommandation"
**Solution:** Assurez-vous d'avoir au moins:
- Un véhicule enregistré
- Au moins une intervention passée
- Au moins un garage actif

### Problème: "Chat ne met pas à jour"
**Solution:** Vérifiez connexion Supabase dans `.env`

---

## 📚 RESSOURCES

**Documentation interne:**
- CAHIER_DES_CHARGES_FINAL_PFE.md
- VISUAL_ARCHITECTURE.md
- UML_CLASS_DIAGRAMS.md
- UML_SEQUENCE_DIAGRAMS.md

**Code source:**
- Backend: `/backend/`
- Frontend: `/frontend/src/`
- Tests: `/backend/TEST_*.md`

---

**Dernière mise à jour:** Mai 2026
**Statut:** ✅ Prêt pour production
