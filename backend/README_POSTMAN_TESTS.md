# 📚 Guide Complet des Tests API avec Postman

Ce guide détaille tous les endpoints du backend avec des exemples Postman complètes, explications et cas d'erreur.

---

## 🚀 Prérequis

### 1. **Démarrer le serveur**

```bash
cd backend
node server.js
# ou avec npm
npm start
# ou avec nodemon (rechargement automatique)
npx nodemon server.js
```

Le serveur démarre sur **`http://localhost:3000`**

### 2. **Importer dans Postman**

1. Ouvrir Postman
2. Créer une nouvelle collection appelée **"PFE Auto API Tests"**
3. Créer des dossiers pour chaque module (Auth, Vehicules, Interventions, Pieces, etc.)
4. Créer les requêtes selon ce guide

### 3. **Configuration Postman**

Pour faciliter les tests, créer des variables d'environnement Postman :

1. **Settings** → **Environments** → **Create**
2. Créer un environnement appelé **"Local Dev"**
3. Ajouter les variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `base_url` | `http://localhost:3000` | URL de base de l'API |
| `token` | `` | Token JWT (rempli après login) |
| `user_id` | `` | ID utilisateur (rempli après login) |
| `vehicle_id` | `` | ID du véhicule (rempli après création) |
| `intervention_id` | `` | ID de l'intervention |
| `piece_id` | `` | ID de la pièce |

**Utiliser les variables dans les requêtes :**
- URL : `{{base_url}}/api/auth/login`
- Headers : `Authorization: Bearer {{token}}`
- Body : `"userId": {{user_id}}`

---

# 🔐 MODULE 1 : AUTHENTIFICATION

## 1.1 Inscription (Register)

### Endpoint
**POST** `{{base_url}}/api/auth/register`

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "nom": "Jean ",
  "prenom":"Dupont",
  "email": "jean.dupont@example.com",
  "telephone":"95789987",
  "password": "SecurePassword123!",
  "role": "automobiliste"
}
```

### Paramètres Body

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `name` | string | ✅ | Nom complet de l'utilisateur |
| `email` | string | ✅ | Email unique |
| `password` | string | ✅ | Mot de passe (min 6 caractères) |
| `role` | string | ❌ | Rôle : `automobiliste`, `garage`, `vendeur`, `admin` |

### Réponse Attendue (201 Created)
```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "automobiliste",
    "created_at": "2026-04-18T10:30:00Z"
  }
}
```

### Cas d'Erreur

#### Email déjà utilisé (400)
```json
{
  "message": "Email already exists"
}
```

#### Validation échouée (400)
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### Scripts Postman (Tests)
```javascript
pm.test("Status is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has user data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.have.property('id');
    pm.expect(jsonData.user).to.have.property('email');
});

pm.environment.set("user_id", pm.response.json().user.id);
```

---

## 1.2 Connexion (Login)

### Endpoint
**POST** `{{base_url}}/api/auth/login`

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "email": "jean.dupont@example.com",
  "password": "SecurePassword123!"
}
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Login success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjksImVtYWlsIjoiamVhbi5kdXBvbnRAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzY0OTUxNzIsImV4cCI6MTc3NzA5OTk3Mn0.XqhP5kwPiVpfuYzPAo4xuAMHIKya_HeKuE_Ak-dNDfo",
        "user": {
            "id": 29,
            "name": "Dupont Jean ",
            "email": "jean.dupont@example.com",
            "phone": "95789987",
            "role": "automobiliste",
            "store_name": null,
            "store_address": null,
            "store_description": null,
            "store_hours": null,
            "store_specialties": null,
            "store_services": null
        }
    },
    "error": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjksImVtYWlsIjoiamVhbi5kdXBvbnRAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzY0OTUxNzIsImV4cCI6MTc3NzA5OTk3Mn0.XqhP5kwPiVpfuYzPAo4xuAMHIKya_HeKuE_Ak-dNDfo",
    "user": {
        "id": 29,
        "name": "Dupont Jean ",
        "email": "jean.dupont@example.com",
        "phone": "95789987",
        "role": "automobiliste",
        "store_name": null,
        "store_address": null,
        "store_description": null,
        "store_hours": null,
        "store_specialties": null,
        "store_services": null
    }
}

### Sauvegarde du Token dans Postman

**Après recevoir la réponse, ajouter ce script dans l'onglet "Tests" :**

```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
});

// Sauvegarder le token dans les variables d'environnement
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.token);
pm.environment.set("user_id", jsonData.user.id);

// Afficher un message
console.log("✅ Token sauvegardé : " + jsonData.token.substring(0, 20) + "...");
```

### Cas d'Erreur

#### Email non trouvé (401)
```json
{
  "message": "User not found"
}
```

#### Mot de passe incorrect (401)
```json
{
  "message": "Wrong password"
}
```

#### Validation échouée (400)
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## 1.3 Récupérer le Profil (Authentifié)

### Endpoint
**GET** `{{base_url}}/api/auth/profile`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body
(Vide pour une requête GET)

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Profil récupéré avec succès",
    "data": {
        "user": {
            "id": 29,
            "name": "Dupont Jean ",
            "email": "jean.dupont@example.com",
            "phone": "95789987",
            "store_name": null,
            "store_address": null,
            "store_description": null,
            "store_hours": null,
            "store_specialties": null,
            "store_services": null,
            "created_at": "2026-04-18T04:26:19.451Z",
            "updated_at": "2026-04-18T04:26:19.451Z",
            "role": "automobiliste"
        }
    },
    "error": null,
    "id": 29,
    "name": "Dupont Jean ",
    "email": "jean.dupont@example.com",
    "phone": "95789987",
    "store_name": null,
    "store_address": null,
    "store_description": null,
    "store_hours": null,
    "store_specialties": null,
    "store_services": null,
    "created_at": "2026-04-18T04:26:19.451Z",
    "updated_at": "2026-04-18T04:26:19.451Z",
    "role": "automobiliste",
    "user": {
        "id": 29,
        "name": "Dupont Jean ",
        "email": "jean.dupont@example.com",
        "phone": "95789987",
        "store_name": null,
        "store_address": null,
        "store_description": null,
        "store_hours": null,
        "store_specialties": null,
        "store_services": null,
        "created_at": "2026-04-18T04:26:19.451Z",
        "updated_at": "2026-04-18T04:26:19.451Z",
        "role": "automobiliste"
    }
}
```

### Cas d'Erreur

#### Sans token (401)
```json
{
  "message": "Token non fourni"
}
```

#### Token invalide (401)
```json
{
  "message": "Token invalide"
}
```

#### Token expiré (401)
```json
{
  "message": "Token expiré"
}
```

---

## 1.4 Mettre à Jour le Profil

### Endpoint
**PUT** `{{base_url}}/api/auth/profile`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "name": "Jean Dupont Modifié",
  "email": "jean.new@example.com"
}
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Profil mis à jour avec succès",
    "data": {
        "user": {
            "id": 29,
            "name": "Jean Dupont Modifié",
            "email": "jean.new@example.com",
            "phone": "95789987",
            "store_name": null,
            "store_address": null,
            "store_description": null,
            "store_hours": null,
            "store_specialties": null,
            "store_services": null,
            "role": "automobiliste",
            "created_at": "2026-04-18T04:26:19.451Z",
            "updated_at": "2026-04-18T05:23:48.599Z"
        }
    },
    "error": null,
    "user": {
        "id": 29,
        "name": "Jean Dupont Modifié",
        "email": "jean.new@example.com",
        "phone": "95789987",
        "store_name": null,
        "store_address": null,
        "store_description": null,
        "store_hours": null,
        "store_specialties": null,
        "store_services": null,
        "role": "automobiliste",
        "created_at": "2026-04-18T04:26:19.451Z",
        "updated_at": "2026-04-18T05:23:48.599Z"
    }
}

---

## 1.5 Changer le Mot de Passe

### Endpoint
**PUT** `{{base_url}}/api/auth/profile/password`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "oldPassword": "SecurePassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Mot de passe modifié avec succès",
    "data": null,
    "error": null
}

### Cas d'Erreur

#### Mot de passe actuel incorrect (401)
```json
{
  "message": "Current password is incorrect"
}
```

---

## 1.6 Supprimer le Compte

### Endpoint
**DELETE** `{{base_url}}/api/auth/profile`

### Headers
```
Authorization: Bearer {{token}}
```

### Body
(Vide)

### Réponse Attendue (200 OK)
```json
{
  "message": "Profile deleted successfully"
}
```

---

## 1.7 Récupérer le Profil Complet (avec détails)

### Endpoint
**GET** `{{base_url}}/api/auth/profile-complet`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Profil complet récupéré avec succès",
    "data": {
        "user": {
            "id": 29,
            "name": "Jean Dupont Modifié",
            "email": "jean.new@example.com",
            "phone": "95789987",
            "store_name": null,
            "store_address": null,
            "store_description": null,
            "store_hours": null,
            "store_specialties": null,
            "store_services": null,
            "role": "automobiliste"
        }
    },
    "error": null,
    "user": {
        "id": 29,
        "name": "Jean Dupont Modifié",
        "email": "jean.new@example.com",
        "phone": "95789987",
        "store_name": null,
        "store_address": null,
        "store_description": null,
        "store_hours": null,
        "store_specialties": null,
        "store_services": null,
        "role": "automobiliste"
    }
}
```

---

## 1.8 Dashboards Spécifiques au Rôle

### Dashboard Automobiliste
**GET** `{{base_url}}/api/auth/automobiliste/mes-vehicules`

Liste les véhicules de l'automobiliste
### Réponse Attendue (200 OK)
json
{
    "success": true,
    "message": "Liste de vos véhicules",
    "data": {
        "userId": 29
    },
    "error": null,
    "userId": 29
}

---

# 🚗 MODULE 2 : GESTION DES VÉHICULES

## 2.1 Créer un Véhicule

### Endpoint
**POST** `{{base_url}}/api/vehicules`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

### Body (Form-Data)

| Clé | Type | Valeur | Requis |
|-----|------|--------|--------|
| `marque` | text | Toyota | ✅ |
| `modele` | text | Corolla | ✅ |
| `annee` | text | 2020 | ✅ |
| `immatriculation` | text | AB-123-CD | ✅ |
| `couleur` | text | Bleu | ✅ |
| `kilometrage` | text | 45000 | ✅ |
| `photo` | file | [sélectionner une image] | ❌ |
ou
{
  "modele_voiture": "Peugeot 208",
  "matricule_voiture": "123TU456",
  "type_vehicule": "Essence",
  "kilometrage_voiture": 120000,
  "photo_voiture":"earkjreakjk.jpg"
}
### Réponse Attendue (201 Created)
```json
{
    "message": "Vehicule ajoute avec succes",
    "vehicule": {
        "id": 20,
        "user_id": 29,
        "modele_voiture": "Peugeot 208",
        "matricule_voiture": "123TU456",
        "type_vehicule": "Essence",
        "kilometrage_voiture": 120000,
        "photo_voiture": "earkjreakjk.jpg",
        "created_at": "2026-04-18T06:02:17.289Z",
        "updated_at": "2026-04-18T06:02:17.289Z"
    }
}
```

### Script Postman pour Sauvegarder l'ID
```javascript
pm.test("Vehicle created", function () {
    pm.response.to.have.status(201);
});

var jsonData = pm.response.json();
pm.environment.set("vehicle_id", jsonData.vehicule.id);
```

### Cas d'Erreur

#### Immatriculation déjà utilisée (400)
```json
{
  "message": "Cette immatriculation existe deja"
}
```

#### Sans token (401)
```json
{
  "message": "Token non fourni"
}
```

---

## 2.2 Lister les Véhicules de l'Utilisateur

### Endpoint
**GET** `{{base_url}}/api/vehicules`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
    "vehicules": [
        {
            "id": 20,
            "user_id": 29,
            "modele_voiture": "Peugeot 208",
            "matricule_voiture": "123TU456",
            "type_vehicule": "Essence",
            "kilometrage_voiture": 120000,
            "photo_voiture": "earkjreakjk.jpg",
            "created_at": "2026-04-18T06:02:17.289Z",
            "updated_at": "2026-04-18T06:02:17.289Z"
        }
    ]
}
```

---

## 2.3 Modifier un Véhicule

### Endpoint
**PUT** `{{base_url}}/api/vehicules/{{vehicle_id}}`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

### Body (Form-Data)
```
marque: Toyota
modele: Corolla
annee: 2021
immatriculation: AB-123-CD
couleur: Noir
kilometrage: 50000
photo: [fichier optionnel]
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Vehicule updated successfully",
  "vehicule": {
    "id": 1,
    "marque": "Toyota",
    "modele": "Corolla",
    "annee": 2021,
    "immatriculation": "AB-123-CD",
    "couleur": "Noir",
    "kilometrage": 50000
  }
}
```

### Cas d'Erreur

#### ID invalide (400)
```json
{
  "message": "ID vehicule invalide"
}
```

#### Véhicule non trouvé (404)
```json
{
  "message": "Vehicule non trouve"
}
```

#### Non autorisé (403)
```json
{
  "message": "Vous n'avez pas la permission de modifier ce vehicule"
}
```

---

## 2.4 Supprimer un Véhicule

### Endpoint
**DELETE** `{{base_url}}/api/vehicules/{{vehicle_id}}`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
    "message": "Vehicule supprime avec succes"
}
```

---

# 🔧 MODULE 3 : GESTION DES INTERVENTIONS

## 3.1 Créer une Intervention

### Endpoint
**POST** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "vehicule": "Toyota Corolla - AB-123-CD",
  "date": "2026-04-20",
  "type": "Vidange",
  "kilometrage": 120000,
  "nomGarage": "Garage Auto Excellence",
  "adresseGarage": "123 rue de la République, Tunis",
  "description": "Changement huile moteur et filtre à huile",
  "pieces": []
}
```

### Paramètres Body

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `vehicule` | string | ✅ | Identifiant du véhicule |
| `date` | string (YYYY-MM-DD) | ✅ | Date de l'intervention |
| `type` | string | ✅ | Type : Vidange, Révision, Réparation, etc. |
| `kilometrage` | number | ✅ | Kilométrage au moment de l'intervention |
| `nomGarage` | string | ✅ | Nom du garage |
| `adresseGarage` | string | ✅ | Adresse du garage |
| `description` | string | ✅ | Détails de l'intervention |
| `pieces` | array | ❌ | Pièces utilisées (vide par défaut) |

### Réponse Attendue (201 Created)
```json
{
  "message": "Intervention créée avec succès",
  "intervention": {
    "id": 1,
    "vehicule_id": 1,
    "date": "2026-04-20",
    "type": "Vidange",
    "kilometrage": 120000,
    "nomGarage": "Garage Auto Excellence",
    "adresseGarage": "123 rue de la République, Tunis",
    "description": "Changement huile moteur et filtre à huile",
    "created_at": "2026-04-18T10:30:00Z"
  }
}
```

### Script Postman
```javascript
pm.test("Intervention created", function () {
    pm.response.to.have.status(201);
});

var jsonData = pm.response.json();
pm.environment.set("intervention_id", jsonData.intervention.id);
```

---

## 3.2 Récupérer les Interventions d'un Véhicule

### Endpoint
**GET** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Interventions retrieved successfully",
  "interventions": [
    {
      "id": 1,
      "vehicule_id": 1,
      "date": "2026-04-20",
      "type": "Vidange",
      "kilometrage": 120000,
      "nomGarage": "Garage Auto Excellence",
      "description": "Changement huile moteur",
      "created_at": "2026-04-18T10:30:00Z"
    }
  ]
}
```

---

## 3.3 Récupérer une Intervention par ID

### Endpoint
**GET** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions/{{intervention_id}}`

### Réponse Attendue (200 OK)
```json
{
  "message": "Intervention retrieved successfully",
  "intervention": {
    "id": 1,
    "vehicule_id": 1,
    "date": "2026-04-20",
    "type": "Vidange",
    "kilometrage": 120000,
    "nomGarage": "Garage Auto Excellence",
    "adresseGarage": "123 rue de la République, Tunis",
    "description": "Changement huile moteur et filtre à huile",
    "pieces": []
  }
}
```

---

## 3.4 Modifier une Intervention

### Endpoint
**PUT** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions/{{intervention_id}}`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "date": "2026-04-21",
  "type": "Révision",
  "kilometrage": 125000,
  "nomGarage": "Garage Premium",
  "description": "Révision complète du véhicule"
}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Intervention updated successfully",
  "intervention": {
    "id": 1,
    "date": "2026-04-21",
    "type": "Révision",
    "kilometrage": 125000
  }
}
```

---

## 3.5 Supprimer une Intervention

### Endpoint
**DELETE** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions/{{intervention_id}}`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Intervention deleted successfully"
}
```

---

## 3.6 Ajouter des Pièces à une Intervention

### Endpoint
**POST** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions/{{intervention_id}}/pieces`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "piece_ids": [1, 2, 3]
}
```

ou

```json
{
  "piece_ids": [
    {
      "id": 1,
      "quantite": 1,
      "prix_unitaire": 50
    }
  ]
}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Pieces added to intervention successfully"
}
```

---

## 3.7 Retirer une Pièce d'une Intervention

### Endpoint
**DELETE** `{{base_url}}/api/vehicules/{{vehicle_id}}/interventions/{{intervention_id}}/pieces/{{piece_id}}`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Piece removed from intervention successfully"
}
```

---

# 🔩 MODULE 4 : GESTION DES PIÈCES

## 4.1 Créer une Pièce (Vendeur/Admin)

### Endpoint
**POST** `{{base_url}}/api/pieces`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

### Body (Form-Data)

| Clé | Type | Valeur | Requis |
|-----|------|--------|--------|
| `nom_piece` | text | Filtre à Huile | ✅ |
| `reference` | text | FH-001-TOYOTA | ✅ |
| `categorie` | text | Filtration | ✅ |
| `prix` | text | 45.50 | ✅ |
| `stock` | text | 50 | ✅ |
| `marque` | text | Bosch | ❌ |
| `description` | text | Filtre huile moteur... | ❌ |
| `photo_piece` | file | [sélectionner une image] | ❌ |
ou
json{
  "nom": "Plaquette de frein",
  "reference": "PF-789",
  "prix_unitaire": 120,
  "stock": 30,
  "condition": "Neuf",
  "zone_geographique": "Sousse",
  "marque": "Brembo",
  "modele": "Sport",
  "categorie": "Freinage"
}
### Réponse Attendue (201 Created)
```json
{
    "success": true,
    "message": "Piece creee avec succes",
    "data": {
        "id": 30,
        "user_id": 30,
        "seller_name": null,
        "seller_store_name": null,
        "seller_phone": null,
        "seller_role": null,
        "nom": "Plaquette de frein",
        "reference": "PF-789",
        "description": null,
        "photo_url": null,
        "prix_unitaire": 120,
        "stock": 30,
        "condition": "Neuf",
        "zone_geographique": "Sousse",
        "marque": "Brembo",
        "modele": "Sport",
        "categorie": "Freinage",
        "created_at": "2026-04-18T06:45:42.238Z",
        "updated_at": "2026-04-18T06:45:42.238Z",
        "deleted_at": null
    },
    "error": null
}
```

### Script Postman
```javascript
pm.test("Piece created", function () {
    pm.response.to.have.status(201);
});

var jsonData = pm.response.json();
pm.environment.set("piece_id", jsonData.piece.id);
```

### Cas d'Erreur

#### Référence déjà existante (400)
```json
{
  "message": "Reference already exists"
}
```

---

## 4.2 Lister Toutes les Pièces

### Endpoint
**GET** `{{base_url}}/api/pieces`

### Query Parameters (optionnels)

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Numéro de page (défaut: 1) |
| `limit` | number | Éléments par page (défaut: 20) |
| `categorie` | string | Filtrer par catégorie |
| `search` | string | Rechercher par nom |
| `sortBy` | string | Trier par `prix`, `nom`, `stock` |
| `order` | string | `asc` ou `desc` |

### Exemple d'URL
```
GET {{base_url}}/api/pieces?categorie=Filtration&sortBy=prix&order=asc&limit=10
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Liste des pieces recuperée avec succes",
    "data": {
        "items": [
            {
                "id": 30,
                "user_id": 30,
                "seller_name": "Dupont Jean",
                "seller_store_name": null,
                "seller_phone": "95789987",
                "seller_role": "vendeur",
                "nom": "Plaquette de frein",
                "reference": "PF-789",
                "description": null,
                "photo_url": null,
                "prix_unitaire": 120,
                "stock": 30,
                "condition": "Neuf",
                "zone_geographique": "Sousse",
                "marque": "Brembo",
                "modele": "Sport",
                "categorie": "Freinage",
                "created_at": "2026-04-18T06:45:42.238Z",
                "updated_at": "2026-04-18T06:45:42.238Z",
                "deleted_at": null
            },
            {
                "id": 29,
                "user_id": 28,
                "seller_name": "amine trabelsi",
                "seller_store_name": null,
                "seller_phone": "25147100",
                "seller_role": "vendeur",
                "nom": "Filtre a huile Toyota Corolla",
                "reference": "TOY-FH-001",
                "description": "Filtre huile premium\",",
                "photo_url": null,
                "prix_unitaire": 39,
                "stock": 8,
                "condition": "Neuf",
                "zone_geographique": "Centre",
                "marque": "Toyota",
                "modele": "Corolla",
                "categorie": "Moteur",
                "created_at": "2026-04-17T11:32:10.672Z",
                "updated_at": "2026-04-17T11:32:10.672Z",
                "deleted_at": null
            },
            {
                "id": 27,
                "user_id": 27,
                "seller_name": "ben saleh youssef ",
                "seller_store_name": null,
                "seller_phone": "25100123",
                "seller_role": "vendeur",
                "nom": "Filtre a huile Toyota Corolla",
                "reference": "TOY-FH-001",
                "description": "Filtre huile original",
                "photo_url": null,
                "prix_unitaire": 45,
                "stock": 12,
                "condition": "Neuf",
                "zone_geographique": "Nord",
                "marque": "Toyota",
                "modele": "Corolla",
                "categorie": "Moteur",
                "created_at": "2026-04-17T11:23:31.499Z",
                "updated_at": "2026-04-17T11:23:31.499Z",
                "deleted_at": null
            },
            {
                "id": 24,
                "user_id": 16,
                "seller_name": "limem fedi",
                "seller_store_name": null,
                "seller_phone": "96044301",
                "seller_role": "vendeur",
                "nom": "arbi",
                "reference": "pa-011",
                "description": "persone",
                "photo_url": "/uploads/pieces/1776417966690-338372622.png",
                "prix_unitaire": 11111,
                "stock": 0,
                "condition": "Neuf",
                "zone_geographique": null,
                "marque": "Audi",
                "modele": "Q7",
                "categorie": "Intérieur",
                "created_at": "2026-04-17T07:26:04.310Z",
                "updated_at": "2026-04-17T07:30:55.908Z",
                "deleted_at": null
            },
            {
                "id": 23,
                "user_id": 18,
                "seller_name": "piéce auto",
                "seller_store_name": null,
                "seller_phone": "21236632",
                "seller_role": "vendeur",
                "nom": "chatmo",
                "reference": "pe-124",
                "description": "chatmo",
                "photo_url": "/uploads/pieces/1776410822422-495205204.png",
                "prix_unitaire": 20,
                "stock": 0,
                "condition": "Occasion",
                "zone_geographique": null,
                "marque": "Geely",
                "modele": "Monjaro",
                "categorie": "Échappement",
                "created_at": "2026-04-17T05:27:00.119Z",
                "updated_at": "2026-04-17T07:34:33.278Z",
                "deleted_at": null
            },
            {
                "id": 22,
                "user_id": 21,
                "seller_name": "drugula mecanico",
                "seller_store_name": null,
                "seller_phone": "92789987",
                "seller_role": "vendeur",
                "nom": "filtre air",
                "reference": "pr-123",
                "description": null,
                "photo_url": "/uploads/pieces/1776373136506-61939218.jpg",
                "prix_unitaire": 13,
                "stock": 40,
                "condition": "Neuf",
                "zone_geographique": null,
                "marque": "Volkswagen",
                "modele": "Polo",
                "categorie": "Huiles et Fluides",
                "created_at": "2026-04-16T18:58:54.081Z",
                "updated_at": "2026-04-17T08:01:34.509Z",
                "deleted_at": null
            },
            {
                "id": 21,
                "user_id": 16,
                "seller_name": "limem fedi",
                "seller_store_name": null,
                "seller_phone": "96044301",
                "seller_role": "vendeur",
                "nom": "patanete",
                "reference": "pc-021",
                "description": "zvzfggggggggggggggggggggggggggfgnbdgb",
                "photo_url": "/uploads/pieces/1776372692595-193050405.jpg",
                "prix_unitaire": 30,
                "stock": 30,
                "condition": "Neuf",
                "zone_geographique": null,
                "marque": "BMW",
                "modele": "iX",
                "categorie": "Freinage",
                "created_at": "2026-04-16T18:51:30.216Z",
                "updated_at": "2026-04-16T18:51:30.216Z",
                "deleted_at": null
            },
            {
                "id": 20,
                "user_id": 19,
                "seller_name": "mbarek amer",
                "seller_store_name": null,
                "seller_phone": "26608613",
                "seller_role": "vendeur",
                "nom": "Plaquettes de frein avant auddi",
                "reference": "PC-12343",
                "description": "a vendre",
                "photo_url": "/uploads/pieces/1776342504107-914658457.png",
                "prix_unitaire": 60,
                "stock": 1,
                "condition": "Occasion",
                "zone_geographique": null,
                "marque": "Audi",
                "modele": "A7",
                "categorie": "Moteur",
                "created_at": "2026-04-16T10:28:24.766Z",
                "updated_at": "2026-04-16T10:28:24.766Z",
                "deleted_at": null
            },
            {
                "id": 19,
                "user_id": 16,
                "seller_name": "limem fedi",
                "seller_store_name": null,
                "seller_phone": "96044301",
                "seller_role": "vendeur",
                "nom": "Plaquettes de frein avant MG",
                "reference": "PC-12349",
                "description": "a vendre pour meilleur budget",
                "photo_url": "/uploads/pieces/1776342170143-499542672.webp",
                "prix_unitaire": 60,
                "stock": 1,
                "condition": "Occasion",
                "zone_geographique": null,
                "marque": "MG",
                "modele": "RX5",
                "categorie": "Train Avant-Arrière",
                "created_at": "2026-04-16T10:22:51.459Z",
                "updated_at": "2026-04-16T10:22:51.459Z",
                "deleted_at": null
            },
            {
                "id": 18,
                "user_id": null,
                "seller_name": null,
                "seller_store_name": null,
                "seller_phone": null,
                "seller_role": null,
                "nom": "disque enbreige",
                "reference": "dem-30",
                "description": "ttgjjhhj",
                "photo_url": "/uploads/pieces/1776256779392-247854462.png",
                "prix_unitaire": 100,
                "stock": 3,
                "condition": "Neuf",
                "zone_geographique": null,
                "marque": "Foton",
                "modele": "View",
                "categorie": "Pièces Face Avant",
                "created_at": "2026-04-15T10:39:39.387Z",
                "updated_at": "2026-04-15T10:39:39.387Z",
                "deleted_at": null
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "totalItems": 22,
            "totalPages": 3
        }
    },
    "error": null
}
```

---

## 4.3 Récupérer une Pièce par ID

### Endpoint
**GET** `{{base_url}}/api/pieces/({{piece_id}})n3awthoha bel id ala houa 30`

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Piece recuperée avec succes",
    "data": {
        "id": 30,
        "user_id": 30,
        "seller_name": "Dupont Jean",
        "seller_store_name": null,
        "seller_phone": "95789987",
        "seller_role": "vendeur",
        "nom": "Plaquette de frein",
        "reference": "PF-789",
        "description": null,
        "photo_url": null,
        "prix_unitaire": 120,
        "stock": 30,
        "condition": "Neuf",
        "zone_geographique": "Sousse",
        "marque": "Brembo",
        "modele": "Sport",
        "categorie": "Freinage",
        "created_at": "2026-04-18T06:45:42.238Z",
        "updated_at": "2026-04-18T06:45:42.238Z",
        "deleted_at": null
    },
    "error": null
}
```

---

## 4.4 Mettre à Jour une Pièce

### Endpoint
**PUT** `{{base_url}}/api/pieces/{{piece_id}}`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

### Body (Form-Data - optionnel)
```
nom_piece: Filtre à Huile Amélioré
prix: 49.99
stock: 60
photo_piece: [fichier optionnel]
```
ou
{
  "nom": "Filtre à air",
  "reference": "FA-999",
  "prix_unitaire": 60,
  "stock": 25,
  "condition": "Neuf",
  "zone_geographique": "Tunis",
  "marque": "Bosch",
  "modele": "X500",
  "categorie": "Moteur"
}

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Piece mise a jour avec succes",
    "data": {
        "id": 30,
        "user_id": 30,
        "seller_name": null,
        "seller_store_name": null,
        "seller_phone": null,
        "seller_role": null,
        "nom": "Filtre à air",
        "reference": "FA-999",
        "description": null,
        "photo_url": null,
        "prix_unitaire": 60,
        "stock": 25,
        "condition": "Neuf",
        "zone_geographique": "Tunis",
        "marque": "Bosch",
        "modele": "X500",
        "categorie": "Moteur",
        "created_at": "2026-04-18T06:45:42.238Z",
        "updated_at": "2026-04-18T06:57:35.892Z",
        "deleted_at": null
    },
    "error": null
}

### Cas d'Erreur

#### Non autorisé (403)
```json
{
  "message": "Vous n'avez pas la permission de modifier cette piece"
}
```

---

## 4.5 Supprimer une Pièce

### Endpoint
**DELETE** `{{base_url}}/api/pieces/{{piece_id}}`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
    "success": true,
    "message": "Piece supprimee avec succes",
    "data": null,
    "error": null
}
```

---

## 4.6 Ajuster le Stock d'une Pièce

### Endpoint
**POST** `{{base_url}}/api/pieces/{{piece_id}}/stock/adjust`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "quantite": 10,
  "raison": "Réception de commande",
  "notes": "Commande fournisseur ref #12345"
}
```

ou pour décrémenter :

```json
{
  "quantite": -5,
  "raison": "Vente",
  "notes": "Vente à M. Dupont"
}
```

### Paramètres Body

| Paramètre | Type | Description |
|-----------|------|-------------|
| `quantite` | number | Quantité à ajouter (positif) ou retirer (négatif) |
| `raison` | string | Motif : `Réception de commande`, `Vente`, `Correction`, `Inventaire` |
| `notes` | string | Détails supplémentaires |

### Réponse Attendue (200 OK)
```json
{
  "message": "Stock adjusted successfully",
  "movement": {
    "id": 1,
    "piece_id": 1,
    "quantite": 10,
    "raison": "Réception de commande",
    "stock_avant": 50,
    "stock_apres": 60,
    "date": "2026-04-18T10:30:00Z"
  }
}
```

---

## 4.7 Définir le Stock d'une Pièce

### Endpoint
**PUT** `{{base_url}}/api/pieces/{{piece_id}}/stock`

### Headers
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (JSON)
```json
{
  "nouveau_stock": 100,
  "raison": "Inventaire"
}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Stock set successfully",
  "piece": {
    "id": 1,
    "stock": 100
  }
}
```

---

## 4.8 Historique des Mouvements de Stock

### Endpoint
**GET** `{{base_url}}/api/pieces/{{piece_id}}/stock/movements`

### Headers
```
Authorization: Bearer {{token}}
```

### Query Parameters (optionnels)

| Paramètre | Description |
|-----------|-------------|
| `page` | Numéro de page |
| `limit` | Éléments par page |
| `raison` | Filtrer par raison |

### Réponse Attendue (200 OK)
```json
{
  "message": "Stock movements retrieved successfully",
  "movements": [
    {
      "id": 1,
      "piece_id": 1,
      "quantite": 10,
      "raison": "Réception de commande",
      "stock_avant": 50,
      "stock_apres": 60,
      "notes": "Commande fournisseur ref #12345",
      "date": "2026-04-18T10:30:00Z"
    },
    {
      "id": 2,
      "piece_id": 1,
      "quantite": -5,
      "raison": "Vente",
      "stock_avant": 60,
      "stock_apres": 55,
      "date": "2026-04-17T15:45:00Z"
    }
  ]
}
```

---

## 4.9 ⭐ COMPARAISON INTELLIGENTE DES PRIX

Cette fonctionnalité compare automatiquement les offres d'une même pièce chez plusieurs vendeurs et retourne le prix minimum.

### Endpoint
**GET** `{{base_url}}/api/pieces/compare/vendors`

### Query Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| `pieceId` | number | ID de la pièce (si nom non fourni) |
| `name` | string | Nom de la pièce (si ID non fourni) |
| `includeOutOfStock` | boolean | Inclure pièces en rupture (défaut: false) |

### Exemple 1: Comparaison par ID
```
GET {{base_url}}/api/pieces/compare/vendors?pieceId=12
```

### Exemple 2: Comparaison par nom
```
GET {{base_url}}/api/pieces/compare/vendors?name=filtre%20huile
```

### Exemple 3: Inclure ruptures de stock
```
GET {{base_url}}/api/pieces/compare/vendors?name=filtre%20huile&includeOutOfStock=true
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Comparaison multi-vendeurs recuperee avec succes",
  "data": {
    "summary": {
      "vendeurs_count": 3,
      "prix_min": 120.50,
      "prix_max": 180.00,
      "economie_max": 59.50
    },
    "best_offer": {
      "prix_minimum": 120.50,
      "meilleur_vendeur": {
        "id": 8,
        "nom": "Garage El Amal",
        "magasin": "El Amal Pieces"
      }
    },
    "available_prices": [120.50, 145.00, 180.00],
    "offres": [
      {
        "id": 1,
        "nom_piece": "Filtre à Huile",
        "prix": 120.50,
        "stock": 45,
        "vendeur": {
          "id": 8,
          "nom": "Garage El Amal",
          "magasin": "El Amal Pieces"
        }
      },
      {
        "id": 2,
        "nom_piece": "Filtre à Huile",
        "prix": 145.00,
        "stock": 30,
        "vendeur": {
          "id": 5,
          "nom": "Auto Parts Central",
          "magasin": "Central Store"
        }
      },
      {
        "id": 3,
        "nom_piece": "Filtre à Huile",
        "prix": 180.00,
        "stock": 0,
        "vendeur": {
          "id": 12,
          "nom": "Premium Auto Parts",
          "magasin": "Premium Store"
        }
      }
    ]
  }
}
```

### Logique Appliquée

- ✅ Les offres sont **triées par prix croissant**
- ✅ Les offres en **rupture de stock** sont ignorées par défaut
- ✅ La première offre devient automatiquement la **meilleure offre**
- ✅ Calcul automatique de l'**économie maximale**
- ✅ Affichage du **nombre de vendeurs** et des **prix disponibles**

### Cas d'Erreur

#### Pièce non trouvée (404)
```json
{
  "message": "Piece not found"
}
```

#### Paramètre manquant (400)
```json
{
  "message": "Either pieceId or name must be provided"
}
```

---

# 💡 MODULE 5 : RECOMMANDATIONS INTELLIGENTES

## 5.1 Récupérer les Recommandations (Classées)

### Endpoint
**GET** `{{base_url}}/api/recommendations`

ou

**GET** `{{base_url}}/api/recommendations/classees`

### Headers
```
Authorization: Bearer {{token}}
```

### Réponse Attendue (200 OK)
```json
{
  "message": "Recommendations retrieved successfully",
  "recommendations": [
    {
      "id": 1,
      "vehicule_id": 1,
      "type": "Vidange",
      "priorite": "haute",
      "raison": "Dernière vidange : 45000 km, kilométrage actuel : 95000 km",
      "kilometrage_recommande": 100000,
      "delai_jours": 30,
      "created_at": "2026-04-18T10:30:00Z"
    },
    {
      "id": 2,
      "vehicule_id": 1,
      "type": "Révision",
      "priorite": "moyenne",
      "raison": "Révision annuelle recommandée",
      "kilometrage_recommande": 120000,
      "delai_jours": 60
    }
  ]
}
```

### Niveaux de Priorité

| Priorité | Description |
|----------|-------------|
| `haute` | À effectuer rapidement |
| `moyenne` | À prévoir dans les prochaines semaines |
| `basse` | À planifier à moyen terme |

---

# 🚨 GESTION DES ERREURS COMMUNES

## Codes d'Erreur HTTP

| Code | Signification | Exemple |
|------|---------------|---------|
| 400 | Requête invalide | Body mal formé, données manquantes |
| 401 | Non authentifié | Token manquant ou invalide |
| 403 | Non autorisé | Permissions insuffisantes |
| 404 | Ressource non trouvée | ID inexistant |
| 409 | Conflit | Email/immatriculation déjà existant |
| 500 | Erreur serveur | Erreur interne du serveur |

## Réponse d'Erreur Standard

```json
{
  "message": "Description de l'erreur",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "email",
    "issue": "Email already exists"
  }
}
```

---

# 📋 CHECKLIST DE TEST

## Tests d'Authentification
- [ ] Register avec données valides
- [ ] Register avec email déjà existant
- [ ] Login avec identifiants corrects
- [ ] Login avec mot de passe incorrect
- [ ] Accès au profil avec token valide
- [ ] Accès au profil sans token
- [ ] Accès au profil avec token expiré

## Tests de Véhicules
- [ ] Créer un véhicule avec tous les paramètres
- [ ] Créer un véhicule avec immatriculation déjà existante
- [ ] Lister les véhicules de l'utilisateur
- [ ] Modifier un véhicule existant
- [ ] Modifier un véhicule d'un autre utilisateur (doit échouer)
- [ ] Supprimer un véhicule

## Tests d'Interventions
- [ ] Créer une intervention
- [ ] Lister les interventions
- [ ] Modifier une intervention
- [ ] Ajouter des pièces à une intervention
- [ ] Supprimer une intervention

## Tests de Pièces
- [ ] Créer une pièce (Vendeur)
- [ ] Créer une pièce avec référence déjà existante
- [ ] Lister toutes les pièces
- [ ] Filtrer les pièces par catégorie
- [ ] Modifier une pièce
- [ ] Ajuster le stock
- [ ] Comparer les prix d'une même pièce chez plusieurs vendeurs

## Tests de Recommandations
- [ ] Récupérer les recommandations
- [ ] Vérifier le classement par priorité

---

# 🔧 ASTUCES POSTMAN

## 1. Créer des Variables d'Environnement
```javascript
// Dans l'onglet "Tests" après une requête
pm.environment.set("token", jsonData.token);
pm.environment.set("user_id", jsonData.user.id);
```

## 2. Utiliser les Variables
```
URL: {{base_url}}/api/vehicules/{{vehicle_id}}
Header: Authorization: Bearer {{token}}
```

## 3. Chainer les Requêtes
Dans l'onglet "Tests" :
```javascript
// Exécuter la prochaine requête automatiquement
postman.setNextRequest("Nom de la requête suivante");
```

## 4. Valider les Réponses
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
});
```

## 5. Exporter les Résultats
Postman → Menu → Export → HTML Report

---

# 📞 SUPPORT ET DÉPANNAGE

## Erreur: "Token non fourni"
- **Solution** : Ajouter le header `Authorization: Bearer {{token}}`
- Vérifier que le token est sauvegardé dans les variables d'environnement

## Erreur: "Email already exists"
- **Solution** : Utiliser un nouvel email pour l'inscription
- Ou s'authentifier avec l'email déjà existant

## Erreur: "Vehicule non trouve"
- **Solution** : Vérifier l'ID du véhicule
- S'assurer que le véhicule appartient à l'utilisateur connecté

## Serveur ne répond pas
- **Solution** : Vérifier que le serveur est démarré
- `npm start` ou `npx nodemon server.js`
- Vérifier que le port 3000 est disponible

---

**Version** : 1.0  
**Dernière mise à jour** : 18 Avril 2026  
**Auteur** : Équipe Backend
