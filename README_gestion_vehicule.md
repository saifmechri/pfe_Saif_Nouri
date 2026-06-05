# Gestion Véhicule

Ce document décrit la gestion des véhicules dans le projet (architecture 3‑tiers, endpoints, payloads et fichiers impliqués).

## Objectif
Gérer les véhicules d'un automobiliste : CRUD véhicules, historique d'interventions, alertes et tableau de bord maintenance.

## Architecture (3 tiers)
- Frontend : UI React (pages et composants) — collecte les données utilisateur et appelle l'API.
- Backend (API) : Express routes → middlewares (auth, upload) → controllers → accès DB.
- Base de données : tables relationnelles (`vehicules`, `interventions`, `intervention_pieces`, ...).

## Endpoints principaux
- GET  /api/vehicules                    → lister véhicules de l'utilisateur
- POST /api/vehicules                    → créer véhicule (multipart/form-data pour `photo`)
- PUT  /api/vehicules/:id                → modifier véhicule (multipart/form-data pour `photo`)
- DELETE /api/vehicules/:id              → supprimer véhicule
- GET  /api/vehicules/:vehicleId/interventions      → lister interventions d'un véhicule
- POST /api/vehicules/:vehicleId/interventions     → créer intervention pour véhicule

Toutes les routes CRUD véhicules et interventions sont protégées par JWT (`verifyToken`).

## Payloads — exemples
- Créer véhicule (FormData multipart pour upload photo):

  - FormData fields:
    - `modele_voiture` (string) — requis
    - `matricule_voiture` (string) — requis, unique
    - `kilometrage_voiture` (int) — optionnel
    - `type_vehicule` (string) — optionnel (ex: "Essence")
    - `photo` (file) — optionnel (champ attendu par upload middleware)

- Créer intervention (JSON):

  {
    "date_intervention": "2026-06-01",
    "type": "vidange",
    "description": "Vidange et filtre",
    "garage_nom": "Garage X",
    "garage_adresse": "Ville",
    "kilometrage": 45000,
    "cout_total": 120.50,
    "pieces": [ { "pieceId": 12, "quantite": 1 } ]
  }

## Fichiers impliqués (mapping)
- Frontend:
  - `frontend/src/services/vehicule.js` : wrapper API pour véhicules
  - `frontend/src/services/interventions.js` : wrapper API pour interventions
  - `frontend/src/pages/automobiliste/Dashboard.jsx` : UI CRUD véhicules (formulaire, upload, listes)
  - `frontend/src/pages/automobiliste/VehicleHistory.jsx` : historique interventions
  - `frontend/src/pages/automobiliste/InterventionDetail.jsx` : détail et gestion pièces
  - `frontend/src/pages/automobiliste/maintenance/MaintenancePage.jsx` : tableau maintenance
- Backend:
  - `backend/routes/vehicules.js` : routes HTTP pour véhicules
  - `backend/controllers/vehiculeController.js` : logique CRUD véhicules
  - `backend/middlewares/uploadVehiculePhoto.js` : upload photo (champ `photo`)
  - `backend/middlewares/authMiddleware.js` : `verifyToken` pour protection
  - `backend/routes/interventions.js` + `backend/controllers/interventionController.js` : gestion interventions
  - `backend/db.js` : création des tables (`vehicules`, `interventions`, ...)

## Ajouter une intervention depuis la page historique
Dans cette architecture 3 tiers, l'ajout d'une intervention depuis la page historique suit ce flux:

### 1. Frontend
- La page `frontend/src/pages/automobiliste/VehicleHistory.jsx` affiche la liste des interventions du véhicule.
- Quand l'utilisateur clique sur une action comme "Ajouter une intervention" ou ouvre le détail, le frontend doit naviguer vers `frontend/src/pages/automobiliste/InterventionDetail.jsx` ou ouvrir un formulaire dédié.
- Le formulaire envoie un objet JSON vers le service `frontend/src/services/interventions.js`.
- Le service appelle `POST /api/vehicules/:vehicleId/interventions`.

### 2. Backend
- La route `backend/routes/interventions.js` reçoit la requête.
- Le middleware `verifyToken` vérifie le JWT.
- Le contrôleur `backend/controllers/interventionController.js` vérifie que le véhicule appartient bien à l'utilisateur connecté.
- Le contrôleur valide les champs, insère l'intervention en base et, si besoin, rattache les pièces.

### 3. Base de données
- La table `vehicules` est utilisée pour vérifier l'existence du véhicule et son propriétaire.
- La table `interventions` enregistre la nouvelle intervention avec `vehicle_id`.
- La table `intervention_pieces` est utilisée si l'intervention contient des pièces.

### Fichiers à modifier pour ajouter cette fonctionnalité
- `frontend/src/pages/automobiliste/VehicleHistory.jsx` : ajouter le bouton ou le lien vers le formulaire.
- `frontend/src/pages/automobiliste/InterventionDetail.jsx` : gérer le formulaire d'ajout ou la modification.
- `frontend/src/services/interventions.js` : ajouter ou adapter la méthode `create` si le payload change.
- `backend/routes/interventions.js` : exposer la route POST si elle n'existe pas déjà.
- `backend/controllers/interventionController.js` : valider et enregistrer l'intervention.
- `backend/db.js` : ajouter un champ ou une table si la donnée doit être persistée autrement.

### Exemple de payload
```json
{
  "date_intervention": "2026-06-05",
  "type": "vidange",
  "description": "Vidange moteur et changement du filtre",
  "garage_nom": "Garage Central",
  "garage_adresse": "Tunis",
  "kilometrage": 45200,
  "cout_total": 120,
  "pieces": [
    { "pieceId": 12, "quantite": 1 }
  ]
}
```

### Résumé du flux
`VehicleHistory.jsx` -> `services/interventions.js` -> `routes/interventions.js` -> `interventionController.js` -> `interventions` / `intervention_pieces`

## Contraintes & notes importantes
- `matricule_voiture` est UNIQUE en base — gérer l'erreur 23505 côté frontend (message retourné : "Ce matricule_voiture existe deja").
- Les opérations de modification/suppression d'un véhicule vérifient la propriété (`user_id`) côté serveur.
- Upload photo : utiliser `FormData` et nommer le champ `photo`.
- Auth : toutes les requêtes nécessitent un header `Authorization: Bearer <token>`.
- Après création/modification d'intervention, le backend déclenche une synchronisation de l'état maintenance; le frontend écoute l'événement `maintenance:refresh` pour actualiser la vue.

## Exemples rapides (curl)
- Créer véhicule (avec fichier):

  curl -X POST "${VITE_API_URL:-http://localhost:3000}/api/vehicules" \
    -H "Authorization: Bearer <TOKEN>" \
    -F "modele_voiture=Peugeot 208" \
    -F "matricule_voiture=123-XYZ" \
    -F "kilometrage_voiture=12000" \
    -F "photo=@/chemin/vers/photo.jpg"

- Créer intervention (JSON):

  curl -X POST "${VITE_API_URL:-http://localhost:3000}/api/vehicules/1/interventions" \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"type":"vidange","kilometrage":12000}'

## Étapes recommandées pour étendre ou modifier
1. Ajouter un champ en DB → modifier `backend/db.js` (ou créer migration) et mettre à jour `vehiculeController` pour lire/enregistrer le champ.  
2. Adapter le service frontend (`frontend/src/services/vehicule.js`) si le champ est envoyé côté client.  
3. Mettre à jour les composants UI (formulaire dans `Dashboard.jsx`) pour exposer le champ.  
4. Ajouter tests unitaires/integration pour controller et endpoints.

## Besoin d'aide ?
Si tu veux, je peux :
- Générer une migration SQL pour ajouter un champ précis.
- Modifier `Dashboard.jsx` pour inclure un nouveau champ et le FormData.
- Produire un diagramme séquentiel ou des exemples de tests.

---
Fichier généré automatiquement par l'assistant — dis-moi si tu veux une version plus courte ou détaillée.