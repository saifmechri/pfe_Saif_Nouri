# Guide des Nouvelles Fonctionnalités - Maps et Distance

## Pour les Automobilistes

### Voir les Distances des Garages
1. Allez à la page "Carte des garages"
2. Vous verrez une liste de garages à gauche
3. Chaque garage affiche:
   - **Nom du garage**
   - **Adresse**
   - **Note moyenne et nombre d'avis** (avec étoile ⭐)
   - **Distance depuis vous** (en badge coloré)
   - **Label de proximité** ("Très proche", "Proche", "À proximité", "Loin")

### Comprendre les Couleurs de Distance
- 🟢 **Vert** (0-5 km): Très proche - Idéal pour un déplacement rapide
- 🔵 **Bleu** (5-15 km): Proche - À proximité raisonnable
- 🟠 **Orange** (15-30 km): À proximité - Un peu plus loin mais accessible
- ⚫ **Gris** (30+ km): Loin - Déplacement important

### Affichage de la Distance
- Les distances sont **calculées en temps réel** depuis votre position GPS
- Les distances s'**actualisent automatiquement** lorsque vous sélectionnez un garage
- Format d'affichage:
  - **< 1 km**: "123 m" (en mètres)
  - **≥ 1 km**: "12.3 km" (en kilomètres avec 1 décimale)

### Autoriser la Géolocalisation
Pour voir les distances:
1. Le navigateur vous demandera l'autorisation d'accéder à votre localisation
2. Cliquez sur "Autoriser"
3. Les distances apparaîtront automatiquement

---

## Pour les Propriétaires de Garages

### Voir la Localisation de Votre Garage
1. Allez à votre **Tableau de Bord Garage**
2. Cliquez sur l'onglet **"Présentation"**
3. Vous verrez une section **"Localisation du garage"** avec:
   - **Coordonnées GPS** (Latitude et Longitude)
   - **Carte interactive** de votre garage
   - **Distance depuis vous** (si vous avez autorisé la géolocalisation)

### Mettre à Jour la Localisation
1. Dans le tableau de bord Garage, allez à l'onglet **"Garage"**
2. Cliquez sur **"Ouvrir la carte pour choisir"**
3. Cliquez sur la carte pour placer votre garage exactement
4. Ou utilisez **"Utiliser ma position GPS"** pour localiser automatiquement
5. Cliquez sur **"Enregistrer le garage"**

### Comprendre l'Affichage de Distance
- Si vous avez **autorisé la géolocalisation**, vous verrez:
  - Votre position (marqueur orange/jaune)
  - La position de votre garage (marqueur bleu)
  - La distance calculée en temps réel
- Utile pour **vérifier la précision** de votre localisation

---

## Pour les Vendeurs de Pièces

### Infrastructure de Distance
- Les systèmes de **calcul de distance** sont maintenant disponibles
- Les pièces peuvent être affichées avec la **distance du vendeur** (implémentation future)
- Les clients peuvent **filtrer par rayon de distance** (implémentation future)

---

## Aspect Technique

### Comment Fonctionne le Calcul de Distance

#### Formule Utilisée: Haversine
La distance entre deux points géographiques est calculée en utilisant la formule de Haversine:
- **Rayon de la Terre**: 6371 km
- **Conversion**: Degrés → Radians
- **Résultat**: Distance en kilomètres

#### Paramètres Requis
```
Distance = calculateDistance(latitude1, longitude1, latitude2, longitude2)
```

### Système de Couleurs
```javascript
// 0-5 km: Très proche (Vert)
getDistanceColor(2.5) → "text-emerald-600 bg-emerald-50 border-emerald-200"

// 5-15 km: Proche (Bleu)  
getDistanceColor(10) → "text-blue-600 bg-blue-50 border-blue-200"

// 15-30 km: À proximité (Orange)
getDistanceColor(20) → "text-amber-600 bg-amber-50 border-amber-200"

// 30+ km: Loin (Gris)
getDistanceColor(50) → "text-slate-600 bg-slate-50 border-slate-200"
```

### Fichiers Importants
- `frontend/src/utils/distanceCalculator.js` - Logique de calcul
- `frontend/src/components/DistanceComponents.jsx` - Composants réutilisables
- `frontend/src/pages/automobiliste/Garages.jsx` - Affichage pour automobilistes
- `frontend/src/pages/garage/Dashboard.jsx` - Affichage pour garages

---

## Dépannage

### Les distances ne s'affichent pas
- ✅ Vérifiez que vous avez **autorisé la géolocalisation**
- ✅ Assurez-vous que votre **navigateur supporte la géolocalisation** (tous les navigateurs modernes le supportent)
- ✅ Attendez quelques secondes le temps du calcul

### La carte ne s'affiche pas
- ✅ Vérifiez votre **connexion Internet**
- ✅ La clé API Google Maps est correctement configurée
- ✅ Rechargez la page si nécessaire

### Les distances semblent incorrectes
- ✅ Les distances sont calculées à vol d'oiseau (droite)
- ✅ Vérifiez que vos coordonnées GPS sont correctes
- ✅ La géolocalisation du navigateur peut avoir une marge d'erreur de ±50m

---

## Fonctionnalités Futures

- 📍 **Itinéraires** (Google Maps Directions API)
- 🔍 **Filtrage par rayon** (Afficher uniquement les garages à X km)
- 🗺️ **Modes de déplacement** (Voiture, Transport en commun, Vélo, etc.)
- ⏱️ **Temps de trajet estimé**
- 🏪 **Vendeurs de pièces** avec distance (implémentation complète)
- 📊 **Statistiques** de proximité

---

## Contact & Support

Pour toute question ou pour rapporter un bug:
- Consultez le fichier [DISTANCE_IMPROVEMENTS.md](./DISTANCE_IMPROVEMENTS.md)
- Vérifiez les notes du repo dans `/memories/repo/`
