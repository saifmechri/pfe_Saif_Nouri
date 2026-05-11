# 🧪 Guide de Test - Explanation Engine

## Pré-requis
- Backend Node.js en cours d'exécution
- Frontend Vue/React compilé
- Base de données avec données test (véhicules, garages, interventions)

---

## 📋 Test 1: Vérifier les Endpoints API

### 1.1 Appel d'API Basique
```bash
# GET /api/recommendations/classees
curl -X GET "http://localhost:3000/api/recommendations/classees" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 1.2 Vérifier la structure de réponse

La réponse doit contenir pour chaque recommandation :

```javascript
{
  success: true,
  data: [
    {
      vehicle: {...},
      intervention: {
        id: "xxx",
        type: "vidange",
        score: 75,
        score_breakdown: {
          kmScorePercent: 85,
          kmContribution: 34,
          dateScorePercent: 60,
          dateContribution: 18,
          vehicleTypeMultiplier: 1.2,
          typeContribution: 12,
          total: 75
        },
        urgence: "URGENT"
      },
      garages: [
        {
          score_breakdown: {
            distanceScore0to10: 9.8,
            ratingScore0to10: 8.4,
            availabilityScore0to10: 10,
            total: 93.6
          }
        }
      ],
      finalScore: 84,
      recommendationSummary: "Meilleur choix global",
      reasons: [
        "Kilométrage très élevé - intervention urgente",
        "Garage très proche - localisation excellente"
        // ... autres raisons
      ],
      explanation: {
        interventionReasons: [...],
        garageReasons: [...],
        recommendationSummary: "Meilleur choix global",
        finalScore: 84
      }
    }
  ]
}
```

✅ **Vérifier:**
- [ ] `reasons` array contient ≥ 2 éléments
- [ ] `explanation` object est présent
- [ ] `recommendationSummary` est non-vide
- [ ] Tous les `score_breakdown` sont remplis

---

## 🎨 Test 2: Affichage Frontend - Raisons avec Icônes

### 2.1 Ouvrir la Page RecommendationsAssistant
```
http://localhost:5173/automobiliste/recommendations
```

### 2.2 Vérifier les Raisons Affichées
- Les raisons doivent avoir des **icônes colorées** différentes
- Vérifier les couleurs par type :
  - 📈 **Kilométrage** → Ambre
  - ⏰ **Date/Ancienneté** → Violet
  - 📍 **Distance** → Bleu
  - ⭐ **Rating** → Jaune
  - ✓ **Disponibilité** → Vert

✅ **Points de vérification:**
- [ ] Les icônes s'affichent correctement
- [ ] Les couleurs correspondent au type de raison
- [ ] Texte lisible et pas coupé
- [ ] Responsive sur mobile (≤ 2 colonnes)

### 2.3 Screenshot Attendu
```
┌─────────────────────────────────────────┐
│  Carte Recommandation                   │
├─────────────────────────────────────────┤
│ Véhicule: Peugeot 308 | Score: 84/100   │
│                                         │
│ Raisons clés:                           │
│ ┌───────────────────────────────────┐   │
│ │ 📈 Kilométrage très élevé...     │   │
│ │ ⏰ Dernière intervention ancienne │   │
│ │ ✓ Entretien urgent               │   │
│ │ 📍 Garage proche                 │   │
│ └───────────────────────────────────┘   │
│                                         │
│ [Voir garage] [RDV] [Voir détails ▼]  │
└─────────────────────────────────────────┘
```

---

## 📊 Test 3: Détail du Scoring - Nouvelle UI

### 3.1 Cliquer sur "Voir détails"
Le panneau détails doit afficher:

#### Section 1: Résumé (3 colonnes)
```
┌──────────────┬──────────────┬──────────────┐
│ Résumé       │ Score final  │ Raisons clés │
│ "Meilleur    │ 84/100 ✨    │ • Km élevé   │
│  choix       │              │ • Dispo auj  │
│  global"     │ Moyenne I+G  │ • Bien noté  │
└──────────────┴──────────────┴──────────────┘
```

#### Section 2: Breakdown Intervention (Bleu)
```
┌────────────────────────────────┐
│ Intervention / Entretien       │ 🔧
├────────────────────────────────┤
│ Kilométrage                    │
│ ████████░░░░░░░░░░░░░ 85%     │
│ 34 pts                         │
│                                │
│ Date dernière intervention     │
│ ███████░░░░░░░░░░░░░░░ 60%    │
│ 18 pts                         │
│                                │
│ Type de véhicule: ×1.2         │
│ 12 pts                         │
│                                │
│ ═══════════════════════        │
│ Total Intervention: 75/100     │ 🔵
└────────────────────────────────┘
```

#### Section 3: Breakdown Garage (Vert)
```
┌────────────────────────────────┐
│ Garage / Localisation          │ 📍
├────────────────────────────────┤
│ Distance: 3.5 km               │
│ ████████░░░░░░░░░░░░░ 98%     │
│ Score: 9.8/10 | 39 pts        │
│                                │
│ Rating / Avis: ⭐ 8.4/10       │
│ ██████░░░░░░░░░░░░░░░░░ 84%   │
│ 29 pts                         │
│                                │
│ Disponibilité: ✓ Ouvert       │
│ ██████████░░░░░░░░░░░░ 100%  │
│ 25 pts                         │
│                                │
│ ═══════════════════════        │
│ Total Garage: 94/100           │ 🟢
└────────────────────────────────┘
```

#### Section 4: Explication du Calcul
```
📊 Comment le score est calculé ?
• Intervention: Km (40%) + Date (30%) + Type (30%)
• Garage: Distance (40%) + Rating (35%) + Dispo (25%)
• Score Final: Moyenne entre score intervention et garage
```

✅ **Points de vérification:**
- [ ] Barres de progression s'affichent avec bonnes couleurs
- [ ] Pourcentages corrects (0-100%)
- [ ] Points d'intervention et garage corrects
- [ ] Total correct (moyenne des deux)
- [ ] Explication lisible et complète

---

## 🔍 Test 4: Logique des Raisons

### 4.1 Tester avec Différents Scores

#### Cas 1: Score Kilométrage TRÈS ÉLEVÉ (≥90%)
**Résultat attendu**: "Kilométrage très élevé - intervention urgente"
```
Test: km_actuel = 18000, km_recommande = 10000
Ratio = 180% → 100% (capped)
Raison = ✓ "Kilométrage très élevé..."
```

#### Cas 2: Score Date TRÈS ANCIEN (≥90%)
**Résultat attendu**: "Dernière intervention très ancienne"
```
Test: date_intervention = 2023-01-01, jours_recommandes = 180
Jours écoulés = 500+ → 277% → 100% (capped)
Raison = ✓ "Dernière intervention très ancienne"
```

#### Cas 3: Garage TRÈS PROCHE
**Résultat attendu**: "Garage très proche - localisation excellente"
```
Test: distance = 2 km → score = 10/10
Raison = ✓ "Garage très proche..."
```

#### Cas 4: Garage EXCELLENT (tous critères élevés)
**Résultat attendu**: "Garage très recommandé - excellent profil global"
```
Test: distanceScore=9, ratingScore=9, availabilityScore=10
Average = 9.3 → ≥8
Raison = ✓ "Garage très recommandé..."
```

✅ **Validation:**
- [ ] Chaque niveau de score génère la bonne raison
- [ ] Pas de raisons dupliquées
- [ ] Minimum 1 raison toujours présente
- [ ] Raisons combinées intelligemment

---

## 🎯 Test 5: Cas Limites

### 5.1 Score Faible (< 50%)
**Test setup:**
```javascript
kmScore = 30%, dateScore = 20%
```
**Résultat attendu:**
- Pas de raisons "très élevé" ni "élevé"
- Message par défaut: "Entretien cohérent avec l'historique du véhicule"

✅ **Vérifier:**
- [ ] Message de fallback s'affiche
- [ ] Pas d'erreur en console

### 5.2 Garage Indisponible
**Test setup:**
```javascript
availabilityScore = 0 (fermé)
distanceScore = 2 (loin)
ratingScore = 3 (mal noté)
```
**Résultat attendu:**
- Raison: "Garage accessible" (distance ≥4)
- Pas de raison "disponible aujourd'hui"
- Message par défaut si aucune raison

✅ **Vérifier:**
- [ ] Logique "sur rendez-vous" s'affiche
- [ ] Pas d'erreur si score = 0

### 5.3 Aucun Garage Trouvé
**Test setup:**
```javascript
garages = []
```
**Résultat attendu:**
- Pas de crash frontend
- Message "Aucune recommandation"

✅ **Vérifier:**
- [ ] Page affiche message approprié
- [ ] Pas d'erreur JavaScript

---

## 🚀 Test 6: Performance

### 6.1 Temps de Chargement
```bash
# Mesurer le temps d'API
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/recommendations/classees

# Temps attendu: < 1000ms
```

### 6.2 Nombre de Recommandations
- Tester avec 50+ recommandations
- Vérifier que pagination fonctionne
- Vérifier que les raisons se chargent

✅ **Critères:**
- [ ] API répond en < 1000ms
- [ ] Frontend affiche fluide (no lag)
- [ ] Scrolling smooth

---

## 📱 Test 7: Responsive Design

### 7.1 Desktop (1920px)
- 2 colonnes: Cartes | Sidebar
- Raisons sur une ligne
- Détails du scoring côte à côte

### 7.2 Tablet (768px)
- Raisons continue sur 2-3 lignes
- Détails stacked verticalement
- Sidebar en bas

### 7.3 Mobile (375px)
- Full width
- Raisons sur plusieurs lignes
- Une raison par "chip"
- Détails en accordéon

✅ **Vérifier:**
- [ ] Pas de text overflow
- [ ] Icônes lisibles
- [ ] Boutons cliquables (>44px)
- [ ] Scroll smooth

---

## 🐛 Dépannage

### Problème: Raisons vides
```
Solution: Vérifier que intervention.score_breakdown est non-null
Debug: console.log(item.intervention.score_breakdown)
```

### Problème: Icônes ne s'affichent pas
```
Solution: Vérifier les imports lucide-react
Debug: Vérifier que IconComponent est instancié correctement
```

### Problème: Barres de progression vides
```
Solution: Vérifier que score_breakdown.kmScorePercent existe
Debug: Ajouter console.log avant le calcul de width
```

### Problème: Score mal calculé
```
Solution: Vérifier la formule: (intervention + garage) / 2
Debug: console.log(`Calcul: (${intervention} + ${garage}) / 2 = ${final}`)
```

---

## ✅ Checklist de Validation Finale

- [ ] API retourne `reasons` array
- [ ] API retourne `recommendationSummary`  
- [ ] Frontend affiche raisons avec icônes colorées
- [ ] Frontend affiche barres de progression
- [ ] Détails du scoring affiche intervention vs garage séparés
- [ ] Tous les scores affichent correctement (0-100)
- [ ] Pas d'erreur en console JavaScript
- [ ] Pas d'erreur en logs serveur
- [ ] Responsive design fonctionne
- [ ] Textes à accents affichent correctement (é, à, etc)
- [ ] Performance acceptable (< 1s)
- [ ] Fallback messages affichent si données manquent

---

## 📝 Notes de Test

**Date du test:** _______________
**Testeur:** _______________
**Résultat:** ☐ PASS ☐ FAIL

**Problèmes trouvés:**
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

**Améliorations suggérées:**
```
1. ___________________________________
2. ___________________________________
```

---

Bon test! 🚀
