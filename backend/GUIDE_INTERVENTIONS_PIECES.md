# Guide Test - API Interventions et Pièces

## Configuration
Le serveur doit être démarré avant de tester ces endpoints:
```bash
npm start
```

Le serveur s'exécutera sur `http://localhost:3000`

## 1. GESTION DES PIÈCES

### Créer une pièce
```bash
POST /api/pieces
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "nom": "Plaquettes de frein",
  "reference": "PAD-BR-001",
  "description": "Plaquettes de frein avant pour Peugeot 308",
  "prix_unitaire": 45.50,
  "stock": 10
}
```

### Récupérer toutes les pièces
```bash
GET /api/pieces
```

### Récupérer une pièce par ID
```bash
GET /api/pieces/1
```

### Mettre à jour une pièce
```bash
PUT /api/pieces/1
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "nom": "Plaquettes de frein optimisées",
  "prix_unitaire": 48.00,
  "stock": 8
}
```

### Supprimer une pièce
```bash
DELETE /api/pieces/1
Authorization: Bearer {TOKEN}
```

## 2. GESTION DES INTERVENTIONS

### Créer une intervention avec pièces
```bash
POST /api/vehicules/{vehicleId}/interventions
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "date_intervention": "2024-03-19",
  "type": "réparation",
  "description": "Remplacement des plaquettes de frein",
  "garage_nom": "Garage Dupont",
  "garage_adresse": "123 Rue de la Paix, 75000 Paris",
  "kilometrage": 45000,
  "pieces": [
    {
      "pieceId": 1,
      "quantite": 4,
      "prix_unitaire": 45.50
    }
  ]
}
```

### Récupérer toutes les interventions d'un véhicule
```bash
GET /api/vehicules/{vehicleId}/interventions
Authorization: Bearer {TOKEN}
```

### Récupérer une intervention par ID
```bash
GET /api/vehicules/{vehicleId}/interventions/{interventionId}
Authorization: Bearer {TOKEN}
```

### Ajouter une pièce à une intervention existante
```bash
POST /api/vehicules/{vehicleId}/interventions/{interventionId}/pieces
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "pieceId": 2,
  "quantite": 2,
  "prix_unitaire": 30.00
}
```

### Retirer une pièce d'une intervention
```bash
DELETE /api/vehicules/{vehicleId}/interventions/{interventionId}/pieces/{pieceId}
Authorization: Bearer {TOKEN}
```

### Mettre à jour une intervention
```bash
PUT /api/vehicules/{vehicleId}/interventions/{interventionId}
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "type": "révision",
  "kilometrage": 50000
}
```

### Supprimer une intervention
```bash
DELETE /api/vehicules/{vehicleId}/interventions/{interventionId}
Authorization: Bearer {TOKEN}
```

## 3. FLUX COMPLET D'UTILISATION

### Étape 1: S'authentifier
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
Récupérez le token JWT dans la réponse.

### Étape 2: Récupérer les véhicules de l'utilisateur
```bash
GET /api/vehicules
Authorization: Bearer {TOKEN}
```

### Étape 3: Créer une intervention pour un véhicule
Utilisez le `vehicleId` obtenu à l'étape précédente.

### Étape 4: Consulter l'historique d'entretien
```bash
GET /api/vehicules/{vehicleId}/interventions
Authorization: Bearer {TOKEN}
```

## 4. STRUCTURE DE DONNÉES

### Intervention
```json
{
  "id": 1,
  "vehicleId": 1,
  "date_intervention": "2024-03-19",
  "type": "réparation",
  "description": "Remplacement des plaquettes",
  "garage_nom": "Garage Dupont",
  "garage_adresse": "123 Rue",
  "kilometrage": 45000,
  "cout_total": 182.00,
  "createdAt": "2024-03-19T10:00:00Z",
  "updatedAt": "2024-03-19T10:00:00Z",
  "pieces": [
    {
      "id": 1,
      "nom": "Plaquettes de frein",
      "reference": "PAD-BR-001",
      "prix_unitaire": 45.50,
      "InterventionPiece": {
        "quantite": 4,
        "prix_unitaire_applique": 45.50
      }
    }
  ]
}
```

### Pièce
```json
{
  "id": 1,
  "nom": "Plaquettes de frein",
  "reference": "PAD-BR-001",
  "description": "Plaquettes de frein avant et arrière",
  "prix_unitaire": 45.50,
  "stock": 10,
  "createdAt": "2024-03-19T10:00:00Z",
  "updatedAt": "2024-03-19T10:00:00Z"
}
```

## NOTES IMPORTANTES

1. **Authentification requise**: La plupart des endpoints (sauf GET pour les pièces) requièrent un token JWT valide dans l'en-tête `Authorization: Bearer {TOKEN}`

2. **Propriété des véhicules**: Les interventions ne peuvent être créées que pour les véhicules appartenant à l'utilisateur authentifié

3. **Coût total automatique**: Le coût total d'une intervention est calculé automatiquement en fonction des pièces ajoutées (quantité × prix)

4. **Types d'interventions**: Les types acceptés sont: `révision`, `réparation`, `vidange`, `autre`

5. **Référence unique**: Chaque pièce doit avoir une référence unique dans la base de données
