# Sprint 2 - Front+Back - Test logique classement

## Objectif
Valider que la logique de classement des recommandations fonctionne de bout en bout:
- Backend: calcul, tri, filtres, pagination
- Frontend: envoi des filtres, affichage des resultats, gestion des cas vides et erreurs

## Prerequis
1. Base de donnees accessible depuis le backend.
2. Au moins un utilisateur automobiliste existant.
3. Donnees minimales presentes:
- vehicules pour l utilisateur connecte
- types d interventions
- garages
4. Variables d environnement configurees.

## Demarrage des services
### Backend
1. Ouvrir un terminal dans le dossier backend.
2. Executer:
- npm install
- npm start

### Frontend
1. Ouvrir un second terminal dans le dossier frontend.
2. Executer:
- npm install
- npm run dev

## Verification rapide des endpoints
L API doit accepter ces routes:
- GET /api/recommandations/classees
- GET /api/recommandations
- GET /api/recommendations/classees (alias)

## Tests Postman
### 1) Login (recuperer token)
- Method: POST
- URL: http://localhost:3000/api/auth/login
- Body JSON:
{
  "email": "automobiliste@email.com",
  "password": "password123"
}
- Attendu: status 200 + token

### 2) Test principal tri score
- Method: GET
- URL:
http://localhost:3000/api/recommandations/classees?sortBy=score&order=desc&minInterventionScore=0&garageLimit=3&page=1&limit=5
- Header:
Authorization: Bearer TON_TOKEN
- Attendu:
  - status 200
  - data present
  - meta present
  - scores tries du plus grand au plus petit

### 3) Test tri distance
- Method: GET
- URL:
http://localhost:3000/api/recommandations/classees?sortBy=distance&order=asc&minInterventionScore=0&garageLimit=3&page=1&limit=5
- Header:
Authorization: Bearer TON_TOKEN
- Attendu:
  - status 200
  - recommandations triees par distance croissante

### 4) Test filtre urgence
- Method: GET
- URL:
http://localhost:3000/api/recommandations/classees?urgency=URGENT&sortBy=score&order=desc&minInterventionScore=0&page=1&limit=5
- Header:
Authorization: Bearer TON_TOKEN
- Attendu:
  - status 200
  - uniquement des recommandations URGENT

### 5) Test pagination
- Method: GET
- URL:
http://localhost:3000/api/recommandations/classees?sortBy=urgence&order=desc&page=2&limit=2
- Header:
Authorization: Bearer TON_TOKEN
- Attendu:
  - status 200
  - meta.page = 2
  - count <= 2

### 6) Test validation query params (erreurs 400)
Tester ces URLs:
- http://localhost:3000/api/recommandations/classees?sortBy=abc
- http://localhost:3000/api/recommandations/classees?order=up
- http://localhost:3000/api/recommandations/classees?limit=1000
- http://localhost:3000/api/recommandations/classees?garageLimit=0
- http://localhost:3000/api/recommandations/classees?minInterventionScore=150
- http://localhost:3000/api/recommandations/classees?urgency=HIGH

Attendu:
- status 400
- body avec success=false et errors

## Tests sur la page frontend
Page cible:
- http://localhost:5173/automobiliste/recommandations

### Scenario A - Test normal
1. Cliquer Reinitialiser.
2. Remplir:
- Urgence: Toutes urgences
- Tri: score
- Ordre: descendant
- Score minimum: 0
- Garages proposes/reco: 3
- Recommandations par page: 6
3. Cliquer Appliquer.

Attendu:
- requete envoyee avec les bons params
- cartes URGENT/RECOMMANDE/FUTUR mises a jour
- liste de recommandations affichee

### Scenario B - Filtre strict
1. Remplir:
- Urgence: URGENT
- Tri: distance
- Ordre: ascendant
- Score minimum: 70
- Garages proposes/reco: 2
- Recommandations par page: 3
2. Cliquer Appliquer.

Attendu:
- resultats filtres
- si vide: message metier backend visible (ex: Aucun vehicule trouve ou Aucun garage trouve)

## Controle reseau navigateur
1. Ouvrir DevTools > Network.
2. Filtrer sur recommandations.
3. Verifier:
- URL appelee
- Query params
- Status HTTP
- Response JSON (data + meta + message)

## Criteres de validation finale
La tache est validee si:
1. Les endpoints de classement repondent correctement.
2. Le tri fonctionne pour score, distance, urgence, type.
3. Les filtres urgency et minInterventionScore fonctionnent.
4. La pagination fonctionne.
5. Les erreurs de validation retournent 400.
6. Le frontend affiche correctement les resultats et les cas vides.
7. Aucun 404 de route recommandations/recommendations.

## Notes de debug
Si la page affiche 0 recommandation:
1. Mettre Score minimum a 0 et Urgence sur Toutes urgences.
2. Verifier que l utilisateur connecte a des vehicules.
3. Verifier que la table garages contient des lignes.
4. Verifier la reponse API dans Network.
