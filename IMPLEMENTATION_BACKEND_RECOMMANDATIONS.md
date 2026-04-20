# 📋 Guide: Implémenter l'Algorithme - Étape par Étape

## 📁 Structure des fichiers à créer/modifier

```
backend/
  controllers/
    recommendationController.js  ← 🆕 À créer
  utils/
    algorithms.js               ← 🆕 À créer (helpers)
  models/
    Intervention.js             ← ✏️ À modifier (ajouter colonnes)
    Garage.js                   ← ✏️ À modifier (ajouter colonnes)
  routes/
    recommendations.js          ← 🆕 À créer (API endpoint)
```

---

## 🔑 ÉTAPE 1: Modifier `backend/models/Intervention.js` (UNIQUEMENT SEQUELIZE)

**ATTENTION:** Pas de SQL manuel! Sequelize fera tout automatiquement.

**À faire:** Ajouter ces 2 propriétés dans le modèle Intervention:

```javascript
// backend/models/Intervention.js
// Cherche define('Intervention', { et AJOUTE ceci dans l'objet:

km_recommande: {
  type: DataTypes.INTEGER,
  defaultValue: 15000,
  comment: 'Kilométrage recommandé pour cette intervention'
},
jours_recommandes: {
  type: DataTypes.INTEGER,
  defaultValue: 365,
  comment: 'Jours recommandés entre deux interventions'
}
```

**Quand tu feras `npm start` à l'étape 6, Sequelize ajoutera les colonnes automatiquement!** ✅

---

## 🔑 ÉTAPE 2: Créer `backend/models/Garage.js` (NOUVEAU FICHIER)

**Pourquoi?** La table garages existe pas en tant que modèle Sequelize!

**Crée un nouveau fichier** `backend/models/Garage.js`:

```javascript
module.exports = (sequelize, DataTypes) => {
  const Garage = sequelize.define('Garage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    adresse: DataTypes.STRING,
    telephone: DataTypes.STRING,
    email: DataTypes.STRING,
    // ← NOUVELLES COLONNES POUR RECOMMANDATIONS:
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: 'Latitude GPS du garage'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: 'Longitude GPS du garage'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 3.5,
      comment: 'Note moyenne du garage (0-5)'
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'garages',
    timestamps: true
  });

  return Garage;
};
```

**Puis ajoute à `backend/models/index.js`:**
```javascript
const Garage = require('./Garage')(sequelize, DataTypes);
```

---

## � ÉTAPE 2b: Modifier `backend/models/User.js` (Ajouter latitude/longitude)

**À faire:** Ajoute ces 2 propriétés dans le modèle User:

```javascript
// backend/models/User.js
// Dans l'objet define('User', { ajoute:

latitude: {
  type: DataTypes.DECIMAL(10, 8),
  defaultValue: 33.8869,  // Tunis par défaut
  comment: 'Latitude GPS de l\'utilisateur'
},
longitude: {
  type: DataTypes.DECIMAL(11, 8),
  defaultValue: 9.5375,   // Tunis par défaut
  comment: 'Longitude GPS de l\'utilisateur'
}
```

**Sequelize ajoutera ces colonnes au démarrage!** ✅

---

## �💻 ÉTAPE 3: Créer `backend/utils/algorithms.js`

**C'est quoi?** Les fonctions de calcul du scoring

```javascript
// backend/utils/algorithms.js

/**
 * ✅ FONCTION 1: Calculer distance Haversine entre 2 points GPS
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2)); // retourne en km
}

/**
 * ✅ FONCTION 2: Convertir distance en score (0-10)
 */
function getDistanceScore(distanceKm) {
  if (distanceKm < 5) return 10;
  if (distanceKm < 10) return 8;
  if (distanceKm < 20) return 6;
  if (distanceKm < 30) return 4;
  return 2;
}

/**
 * ✅ FONCTION 3: Calculer score intervalle kilométrage (0-100)
 * 
 * Exemple:
 * - km_actuel = 14,200
 * - km_recommande = 15,000
 * - score = (14200 / 15000) * 100 = 94.7
 */
function getKilometrationScore(kmActuel, kmRecommande) {
  if (!kmRecommande) return 0;
  const percentage = (kmActuel / kmRecommande) * 100;
  return Math.min(percentage, 100); // max 100
}

/**
 * ✅ FONCTION 4: Calculer score intervalle temps (0-100)
 * 
 * Exemple:
 * - jours_ecoules = 350 jours
 * - jours_recommandes = 365 jours
 * - score = (350 / 365) * 100 = 95.8
 */
function getDateScore(dateLastIntervention, joursRecommandes) {
  if (!joursRecommandes) return 0;
  
  const now = new Date();
  const diffMs = now - new Date(dateLastIntervention);
  const joursEcoules = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const percentage = (joursEcoules / joursRecommandes) * 100;
  return Math.min(percentage, 100); // max 100
}

/**
 * ✅ FONCTION 5: Convertir rating (0-5) en score (0-10)
 */
function getRatingScore(rating) {
  if (!rating) return 5; // par défaut 5/10 si pas de rating
  return (rating / 5) * 10;
}

/**
 * ✅ FONCTION 6: Score disponibilité du garage
 * 
 * TODO: À implémenter quand tu auras table garage_horaires
 * Pour maintenant: retourner 10 si garage.isOpen === true
 */
function getAvailabilityScore(garage) {
  // SIMPLE VERSION (à améliorer plus tard)
  if (garage.isOpen) return 10;
  return 0;
}

/**
 * ✅ FONCTION 7: Calculer score TOTAL d'une intervention
 * 
 * Poids:
 * - Kilométrage: 40%
 * - Date: 30%
 * - Type véhicule: 10%
 */
function calculateInterventionScore(vehicle, lastIntervention, interventionType) {
  let score = 0;
  
  // 1. Score kilométrage (40%)
  if (interventionType.km_recommande) {
    const kmScore = getKilometrationScore(vehicle.kilometrage, interventionType.km_recommande);
    score += (kmScore / 100) * 40;
  }
  
  // 2. Score date (30%)
  if (lastIntervention && interventionType.jours_recommandes) {
    const dateScore = getDateScore(lastIntervention.date, interventionType.jours_recommandes);
    score += (dateScore / 100) * 30;
  }
  
  // 3. Score type véhicule (10%)
  let vehicleTypeMultiplier = 1.0;
  if (vehicle.type === 'Diesel') vehicleTypeMultiplier = 1.2;
  if (vehicle.type === 'SUV') vehicleTypeMultiplier = 1.15;
  if (vehicle.type === 'Électrique') vehicleTypeMultiplier = 0.8;
  
  score += vehicleTypeMultiplier * 10;
  
  return Math.min(score, 100); // max 100
}

/**
 * ✅ FONCTION 8: Calculer score TOTAL d'un garage
 * 
 * Poids:
 * - Distance: 40%
 * - Rating: 35%
 * - Disponibilité: 25%
 */
function calculateGarageScore(userLat, userLon, garage) {
  let score = 0;
  
  // 1. Distance (40%)
  const distance = haversine(userLat, userLon, garage.latitude, garage.longitude);
  const distanceScore = getDistanceScore(distance);
  score += (distanceScore / 10) * 40;
  
  // 2. Rating (35%)
  const ratingScore = getRatingScore(garage.rating);
  score += (ratingScore / 10) * 35;
  
  // 3. Disponibilité (25%)
  const availabilityScore = getAvailabilityScore(garage);
  score += (availabilityScore / 10) * 25;
  
  return parseFloat(score.toFixed(2)); // retourne avec 2 décimales
}

/**
 * ✅ DÉTERMINER URGENCE basé sur score
 */
function getUrgency(score) {
  if (score >= 80) return 'URGENT';
  if (score >= 60) return 'RECOMMANDÉ';
  return 'FUTUR';
}

// EXPORTER les fonctions
module.exports = {
  haversine,
  getDistanceScore,
  getKilometrationScore,
  getDateScore,
  getRatingScore,
  getAvailabilityScore,
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency
};
```

---

## 🎯 ÉTAPE 4: Créer `backend/controllers/recommendationController.js`

**C'est quoi?** La logique métier qui utilise les algorithmes

```javascript
// backend/controllers/recommendationController.js

const { Vehicle, User, Intervention, Garage, InterventionPiece } = require('../models');
const {
  calculateInterventionScore,
  calculateGarageScore,
  getUrgency,
  haversine
} = require('../utils/algorithms');

/**
 * GET /api/recommandations
 * 
 * Retourner les interventions recommandées + meilleurs garages pour chaque
 */
async function getRecommendations(req, res) {
  try {
    const userId = req.user.id;
    
    console.log(`[RECOMMANDATIONS] Calcul pour userId: ${userId}`);
    
    // 1️⃣ Récupérer l'utilisateur et ses véhicules
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const vehicles = await Vehicle.findAll({ 
      where: { userId } 
    });
    
    if (!vehicles || vehicles.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'Aucun véhicule trouvé'
      });
    }
    
    // 2️⃣ Récupérer tous les types d'intervention possibles
    const interventionTypes = await Intervention.findAll({
      attributes: ['id', 'type', 'km_recommande', 'jours_recommandes']
    });
    
    // 3️⃣ Récupérer tous les garages
    const garages = await Garage.findAll();
    
    // 4️⃣ Calculer les recommandations
    const allRecommendations = [];
    
    for (const vehicle of vehicles) {
      console.log(`  [VEHICLE] ${vehicle.marque} ${vehicle.modele} - ${vehicle.kilometrage} km`);
      
      // Pour chaque type d'intervention
      for (const interventionType of interventionTypes) {
        // Récupérer dernière intervention de ce type pour ce véhicule
        const lastIntervention = await InterventionPiece.findOne({
          where: { vehiculeId: vehicle.id },
          order: [['updatedAt', 'DESC']],
          limit: 1
        });
        
        // Calculer score intervention
        const interventionScore = calculateInterventionScore(
          vehicle,
          lastIntervention,
          interventionType
        );
        
        // Si score > 50, ajouter à recommandations
        if (interventionScore >= 50) {
          console.log(`    ✅ ${interventionType.type}: score = ${interventionScore}`);
          
          // Trouver les 5 meilleurs garages pour cette intervention
          const bestGarages = garages
            .map(garage => ({
              ...garage.dataValues,
              distance_km: haversine(user.latitude, user.longitude, garage.latitude, garage.longitude),
              score_global: calculateGarageScore(user.latitude, user.longitude, garage)
            }))
            .sort((a, b) => b.score_global - a.score_global)
            .slice(0, 5);
          
          allRecommendations.push({
            vehicle: {
              id: vehicle.id,
              marque: vehicle.marque,
              modele: vehicle.modele,
              kilometrage: vehicle.kilometrage,
              type: vehicle.type
            },
            intervention: {
              id: interventionType.id,
              type: interventionType.type,
              urgence: getUrgency(interventionScore),
              score: parseFloat(interventionScore.toFixed(2)),
              km_recommande: interventionType.km_recommande,
              km_actuel: vehicle.kilometrage,
              km_restant: interventionType.km_recommande ? 
                Math.max(0, interventionType.km_recommande - vehicle.kilometrage) : null,
              jours_recommandes: interventionType.jours_recommandes,
              jours_depuis_derniere: lastIntervention ? 
                Math.floor((new Date() - new Date(lastIntervention.updatedAt)) / (1000 * 60 * 60 * 24)) : null
            },
            garages: bestGarages.map(g => ({
              id: g.id,
              name: g.name,
              adresse: g.adresse,
              telephone: g.telephone,
              distance_km: g.distance_km,
              rating: g.rating,
              score_global: parseFloat(g.score_global.toFixed(2)),
              isOpen: g.isOpen || false
            }))
          });
        }
      }
    }
    
    // 5️⃣ Trier par urgence (URGENT > RECOMMANDÉ > FUTUR) et score
    allRecommendations.sort((a, b) => {
      const urgencyOrder = { 'URGENT': 0, 'RECOMMANDÉ': 1, 'FUTUR': 2 };
      const urgenciesDiff = urgencyOrder[a.intervention.urgence] - urgencyOrder[b.intervention.urgence];
      
      if (urgenciesDiff !== 0) return urgenciesDiff;
      return b.intervention.score - a.intervention.score;
    });
    
    console.log(`[RECOMMANDATIONS] Total trouvées: ${allRecommendations.length}`);
    
    return res.json({
      success: true,
      data: allRecommendations,
      count: allRecommendations.length
    });
    
  } catch (error) {
    console.error('[RECOMMANDATIONS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des recommandations',
      error: error.message
    });
  }
}

module.exports = {
  getRecommendations
};
```

---

## 🔌 ÉTAPE 5: Créer `backend/routes/recommendations.js`

**C'est quoi?** L'endpoint API

```javascript
// backend/routes/recommendations.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlwares/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

/**
 * GET /api/recommandations
 * 
 * Retourner les interventions recommandées pour l'utilisateur
 * 
 * @returns {
 *   success: boolean,
 *   data: [{
 *     vehicle: {...},
 *     intervention: {...},
 *     garages: [...]
 *   }]
 * }
 */
router.get('/', authMiddleware, getRecommendations);

module.exports = router;
```

---

## 📡 ÉTAPE 6: Ajouter la route à `backend/server.js`

```javascript
// backend/server.js

// ... autres imports ...
const recommendationsRoutes = require('./routes/recommendations');

// ... après les autres routes ...
app.use('/api/recommandations', recommendationsRoutes);
```

---

## 🧪 ÉTAPE 7: Tester avec Postman

**1. Ouvrir Postman**

**2. Créer une nouvelle requête GET:**
```
URL: http://localhost:3000/api/recommandations
Headers:
  Authorization: Bearer <ton_token_jwt>
```

**3. Obtenir le token:**
- Login d'abord avec: `POST /api/auth/login`
- Copier le token de la réponse

**4. Résultat attendu:**
```json
{
  "success": true,
  "data": [
    {
      "vehicle": {
        "id": 7,
        "marque": "Toyota",
        "modele": "Yaris",
        "kilometrage": 45000,
        "type": "Essence"
      },
      "intervention": {
        "id": 1,
        "type": "Révision",
        "urgence": "URGENT",
        "score": 94.7,
        "km_recommande": 15000,
        "km_actuel": 45000,
        "km_restant": 2000,
        "jours_recommandes": 365,
        "jours_depuis_derniere": 245
      },
      "garages": [
        {
          "id": 5,
          "name": "Garage Ahmed",
          "adresse": "Rue Ibn Khaldoun, Tunis",
          "telephone": "71 123 456",
          "distance_km": 1.2,
          "rating": 4.8,
          "score_global": 92.5,
          "isOpen": true
        }
      ]
    }
  ],
  "count": 3
}
```

---

## 📋 Checklist - À faire dans l'ordre:

- [ ] **ÉTAPE 1:** Modifier `backend/models/Intervention.js` - ajoute km_recommande + jours_recommandes
- [ ] **ÉTAPE 2:** Créer `backend/models/Garage.js` - nouveau fichier complet
- [ ] **ÉTAPE 2b:** Modifier `backend/models/User.js` - ajoute latitude + longitude
- [ ] **ÉTAPE 3:** Créer `backend/utils/algorithms.js` - copie-colle le code complet
- [ ] **ÉTAPE 4:** Créer `backend/controllers/recommendationController.js` - copie-colle le code complet
- [ ] **ÉTAPE 5:** Créer `backend/routes/recommendations.js` - copie-colle le code complet
- [ ] **ÉTAPE 6:** Modifier `backend/server.js` - ajoute la route recommandations
- [ ] **ÉTAPE 7:** Relance le backend: `npm start` (Sequelize fera `sync({ alter: true })`)
- [ ] **ÉTAPE 8:** Test avec Postman

---

## ⚠️ Points importants

🔴 **NE PAS FAIRE DE SQL MANUEL!**
- Pas d'ALTER TABLE
- Pas d'UPDATE
- Pas de CREATE TABLE
- Tout se fait via les modèles Sequelize!

✅ **Le flux est simple:**
1. Modifie les fichiers `.js` (2 models + 3 nouveaux fichiers)
2. Relance `npm start`
3. Sequelize exécute `sync({ alter: true })` automatiquement
4. Les colonnes sont créées! ✅

✅ **La distance Haversine est correcte:**
- Test: Tunis (33.8869, 9.5375) à Sousse (35.8256, 10.6369) = ~140 km
