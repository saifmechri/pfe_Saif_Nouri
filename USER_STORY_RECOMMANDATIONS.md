# 📋 User Story: Recommandations Intelligentes

## 🎯 Objectif Global
Créer un système intelligent de recommandations d'interventions et de garages basé sur les données du véhicule et l'historique.

---

## 📊 Explication de la Logique

### Qu'est-ce qu'on recommande?
On recommande à l'automobiliste **les interventions à faire prochainement ET les meilleurs garages** pour les faire.

**Exemple:**
- Voiture: Toyota yaris, kilométrage 45,000 km
- Système recommande: "Révision recommandée, garage X à 5 km (4.8 ⭐)"

---

## 🔧 Backend - Implémentation de l'Algorithme

### **Critère 1: Kilométrage du véhicule**
```
Chaque type d'intervention a un kilométrage recommandé
- Révision: tous les 15,000 km
- Vidange: tous les 10,000 km
- Changement pneus: tous les 40,000 km
- Climatisation: tous les 20,000 km

Logique:
SI kilométrage_actuel % intervalle_recommandé >= 80%
  ALORS urgence = HIGH
```

**Exemple:**
```
Révision (tous les 15,000 km)
- Kilométrage actuel: 14,200 km
- Pourcentage: 14,200 / 15,000 = 94.7% ✅ URGENT!
- Kilométrage restant: 800 km
```

### **Critère 2: Date dernière intervention**
```
Chaque intervention a une fréquence recommandée en jours
- Révision: tous les 365 jours (1 an)
- Vidange: tous les 180 jours (6 mois)
- Climatisation: tous les 730 jours (2 ans)

Logique:
jours_ecoules = maintenant - date_derniere_intervention
SI jours_ecoules >= jours_recommandes * 0.8
  ALORS urgence = HIGH
```

**Exemple:**
```
Vidange (tous les 180 jours)
- Dernière vidange: 140 jours ago
- Seuil d'alerte: 180 * 0.8 = 144 jours
- 140 < 144 = PAS ENCORE URGENT
```

### **Critère 3: Type de véhicule**
```
Différents types = différentes recommandations
- Voiture essence: révision plus fréquente
- Voiture diesel: révision moins fréquente mais plus chère
- SUV: usure plus rapide
- Voiture électrique: moins d'interventions

Logique:
SI type_vehicule = "Diesel" ET intervention = "Vidange"
  ALORS urgence *= 1.2 (plus urgent pour diesel)
```

### **Critère 4: Distance (Haversine) - Proximité du garage**
```
FORMULE HAVERSINE (calcul distance entre 2 points GPS):

distance = 2 * R * asin(sqrt(
  sin²((lat2-lat1)/2) + 
  cos(lat1) * cos(lat2) * sin²((lon2-lon1)/2)
))

R = 6371 km (rayon Terre)

Logique de scoring:
- Distance < 5 km: score = 10/10
- Distance 5-10 km: score = 8/10
- Distance 10-20 km: score = 6/10
- Distance 20-30 km: score = 4/10
- Distance > 30 km: score = 2/10
```

**Exemple:**
```
Garage X: latitude 33.8869, longitude 9.5375 (Tunis)
Utilisateur: latitude 33.8765, longitude 9.5320
Distance = 1.2 km ✅ EXCELLENT (score: 10/10)
```

### **Critère 5: Rating du garage**
```
Basé sur les avis utilisateurs

Logique de scoring:
- Rating >= 4.5: score = 10/10
- Rating 4.0-4.5: score = 8/10
- Rating 3.5-4.0: score = 6/10
- Rating 3.0-3.5: score = 4/10
- Rating < 3.0: score = 2/10
```

### **Critère 6: Disponibilité du garage**
```
Horaires d'ouverture et disponibilité

Logique de scoring:
- Ouvert maintenant: score = 10/10
- Ouvert bientôt (< 2h): score = 8/10
- Ouvert aujourd'hui: score = 6/10
- Ferme aujourd'hui: score = 0/10
```

---

## 🧮 ALGORITHME DE SCORING COMPLET

### **Étape 1: Calculer priorité d'intervention**
```javascript
score_intervention = 0

// 1. Kilométrage (40% du poids)
score_km = (km_actuel % km_recommande) / km_recommande * 100
poids_km = 40
score_intervention += (score_km / 100) * poids_km

// 2. Date (30% du poids)
jours_ecoules = new Date() - date_derniere_intervention
jours_recommandes = 365  // exemple
score_date = (jours_ecoules / jours_recommandes) * 100
poids_date = 30
score_intervention += Math.min(1, score_date / 100) * poids_date

// 3. Type véhicule (10% du poids)
multiplicateur_type = 1.0
if (type_vehicule === "Diesel") multiplicateur_type = 1.2
if (type_vehicule === "SUV") multiplicateur_type = 1.15
poids_type = 10
score_intervention += multiplicateur_type * poids_type

// Score FINAL intervention: 0-100
// > 80 = URGENT
// 60-80 = RECOMMANDÉ
// < 60 = FUTUR
```

### **Étape 2: Calculer score garage (pour chaque intervention recommandée)**
```javascript
score_garage = 0

// 1. Distance Haversine (40% du poids)
distance = haversine(user.lat, user.lon, garage.lat, garage.lon)
score_distance = distance < 5 ? 10 : (distance > 30 ? 2 : (10 - distance/3))
poids_distance = 40
score_garage += (score_distance / 10) * poids_distance

// 2. Rating (35% du poids)
score_rating = garage.rating  // 0-5
poids_rating = 35
score_garage += (score_rating / 5) * poids_rating

// 3. Disponibilité (25% du poids)
score_dispo = garage.isOpen ? 10 : (garage.opensSoon ? 8 : 0)
poids_dispo = 25
score_garage += (score_dispo / 10) * poids_dispo

// Score FINAL garage: 0-100
```

### **Étape 3: Ranking final**
```javascript
recommandations = []

// Pour chaque intervention à recommander
for (intervention of interventions_recommandees) {
  // Trouver les 5 meilleurs garages
  best_garages = garages
    .map(garage => ({
      garage,
      score: score_garage(garage, intervention)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  
  // Ajouter à recommandations
  recommandations.push({
    intervention: {
      type: intervention.type,
      urgence: intervention.score > 80 ? "URGENT" : "RECOMMANDÉ",
      score: intervention.score
    },
    garages: best_garages
  })
}

// Trier par urgence
return recommandations.sort((a, b) => b.intervention.score - a.intervention.score)
```

---

## 🔌 API Backend à implémenter

### **Endpoint: GET `/api/recommandations`**

**Query Parameters:**
```
userId: number (required)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "intervention": {
        "id": 1,
        "type": "Révision",
        "description": "Révision complète du véhicule",
        "urgence": "URGENT",
        "score": 94.7,
        "km_restant": 800,
        "jours_restant": 45
      },
      "garages": [
        {
          "id": 5,
          "name": "Garage Ahmed",
          "distance_km": 1.2,
          "distance_score": 10,
          "rating": 4.8,
          "rating_score": 9.6,
          "disponibilite": "Ouvert maintenant",
          "score_global": 92.5,
          "adresse": "Rue Ibn Khaldoun, Tunis",
          "telephone": "71 123 456",
          "horaires": "08:00 - 18:00"
        },
        {
          "id": 3,
          "name": "Garage Sidi",
          "distance_km": 3.5,
          "rating": 4.6,
          "score_global": 85.2
        }
      ]
    }
  ]
}
```

---

## 📝 Backend Tasks (Saif)

### **Task 1: [Back] Implémenter l'algorithme**

**Fichier à créer:** `backend/controllers/recommandationController.js`

```javascript
// Helper functions
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const calculateInterventionScore = (vehicle, intervention) => {
  // 40% kilométrage
  // 30% date
  // 10% type véhicule
  // etc...
}

const calculateGarageScore = (userLocation, garage, intervention) => {
  // 40% distance
  // 35% rating
  // 25% disponibilité
}

const getRecommendations = async (userId) => {
  // Logique complète
}

module.exports = { getRecommendations }
```

**Données requises dans DB:**
- Table `interventions` avec `km_recommande`, `jours_recommandes`
- Table `garages` avec latitude, longitude, rating
- Table `garage_horaires` avec horaires d'ouverture

### **Task 2: [Back] API recommandations**

**Fichier:** `backend/routes/recommandations.js`

```javascript
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const recommandations = await getRecommendations(userId)
  return res.json({ success: true, data: recommandations })
})
```

---

## 🎨 Frontend Tasks (Binôme)

### **Task 1: [Front] Page recommandations**

**Composant:** `frontend/src/pages/automobiliste/Recommandations.jsx`

- Liste des interventions recommandées (triées par urgence)
- Pour chaque intervention: afficher les 5 meilleurs garages
- Design attractif avec couleurs (URGENT = rouge, RECOMMANDÉ = orange)
- Cliquer sur un garage = ouvrir fiche garage complète
- Bouton "Prendre RDV" pour réserver chez un garage

---

## 🧪 Tests logique avant implémentation

### **[Front+Back] Test logique classement**

**Pour tester sans frontend, utiliser POSTMAN:**

```
GET /api/recommandations
Headers: Authorization: Bearer <token>
```

**Expected:**
1. Interventions triées par score (décroissant)
2. Pour chaque intervention: garages triés par score (décroissant)
3. Vérifier les formules de calcul

**Exemples de test:**
```javascript
// Test 1: Véhicule neuf (pas d'intervention)
userId: 1, km: 5000
Expected: [] (aucune recommandation)

// Test 2: Véhicule avec intervention urgente
userId: 2, km: 14800 (révision à 15000)
Expected: [{intervention: "Révision", score: 98.7, ...}]

// Test 3: Multiple interventions
userId: 3
Expected: Interventions triées par urgence
```

---

## 📅 Plan de travail suggéré

### **Sprint 1: Backend (Saif)**
1. ✅ Ajouter colonnes `km_recommande`, `jours_recommandes` à table `interventions`
2. ✅ Ajouter colonnes latitude, longitude à table `garages`
3. ✅ Implémenter fonction `haversine`
4. ✅ Implémenter fonction `calculateInterventionScore`
5. ✅ Implémenter fonction `calculateGarageScore`
6. ✅ Implémenter endpoint `/api/recommandations`
7. ✅ Tester avec Postman

### **Sprint 1: Frontend (Binôme)**
- En attente de l'API fonctionnelle

### **Sprint 2: Frontend (Binôme)**
1. ✅ Créer page Recommandations avec layout
2. ✅ Fetch données de `/api/recommandations`
3. ✅ Afficher interventions avec urgence
4. ✅ Afficher garages classés
5. ✅ Ajouter bouton "Prendre RDV"
6. ✅ Tester en live

### **Sprint 2: Backend (Saif)**
- Support pour le frontend (bug fixes, optimisations)

---

## 🚀 Stack technologique

**Backend:**
- Node.js / Express
- PostgreSQL (données existantes)
- Math pour calculs (distance, scoring)
- JWT pour authentification

**Frontend:**
- React
- Axios pour API
- Tailwind CSS pour design
- État: useState, useEffect

---

## 💡 Points clés à retenir

✅ **Algorithme = scoring basé sur 6 critères**  
✅ **Chaque critère a un poids différent**  
✅ **Interventions triées par urgence**  
✅ **Garages triés par score pour chaque intervention**  
✅ **Distance = formule Haversine**  
✅ **API simple: GET + userId**  

---

**Questions avant de commencer?** 👍
