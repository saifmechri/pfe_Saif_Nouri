# SOUS_TACHE_3 - TEST CRUD COMPLET (POSTMAN)

## Objectif
Verifier le fonctionnement complet Front+Back du CRUD vehicules via Postman.

## Prerequis
- Backend lance sur port 3000
- URL API: http://localhost:3000
- Utilisateur automobiliste existant

## Configuration Postman (recommandee)
Creer une collection nommee: Sous-tache 3 - CRUD Vehicules

Creer ces variables de collection:
- baseUrl = http://localhost:3000
- token = (vide au debut)
- vehiculeId = (vide au debut)

---

## TEST 1 - LOGIN (recuperer token)
Method: POST
URL: {{baseUrl}}/api/auth/login

Headers:
- Content-Type: application/json

Body (raw JSON):
{
  "email": "automobiliste@email.com",
  "password": "password123"
}

Resultat attendu:
- Status 200
- Reponse avec token

Action apres test:
- Copier le token dans la variable {{token}}

---

## TEST 2 - CREATE VEHICULE (JSON)
Method: POST
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body (raw JSON):
{
  "modele_voiture": "Toyota Corolla",
  "matricule_voiture": "TN123ABC",
  "kilometrage_voiture": 45000
}

Resultat attendu:
- Status 201
- Reponse contenant id du vehicule cree

Action apres test:
- Copier id dans la variable {{vehiculeId}}

---

## TEST 3 - READ LISTE VEHICULES
Method: GET
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer {{token}}

Body:
- Aucun

Resultat attendu:
- Status 200
- Liste contenant au moins le vehicule cree

---

## TEST 4 - UPDATE VEHICULE
Method: PUT
URL: {{baseUrl}}/api/vehicules/{{vehiculeId}}

Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body (raw JSON):
{
  "modele_voiture": "Toyota Camry",
  "matricule_voiture": "TN456DEF",
  "kilometrage_voiture": 50000
}

Resultat attendu:
- Status 200
- Donnees du vehicule mises a jour

---

## TEST 5 - DELETE VEHICULE
Method: DELETE
URL: {{baseUrl}}/api/vehicules/{{vehiculeId}}

Headers:
- Authorization: Bearer {{token}}

Body:
- Aucun

Resultat attendu:
- Status 200
- Message de suppression confirme

---

## TEST 6 - ERREUR SANS TOKEN
Method: GET
URL: {{baseUrl}}/api/vehicules

Headers:
- Aucun

Resultat attendu:
- Status 401

---

## TEST 7 - ERREUR TOKEN INVALIDE
Method: GET
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer token_invalide

Resultat attendu:
- Status 401

---

## TEST 8 - ERREUR CHAMPS OBLIGATOIRES MANQUANTS
Method: POST
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body (raw JSON):
{
  "modele_voiture": "",
  "matricule_voiture": "",
  "kilometrage_voiture": 10000
}

Resultat attendu:
- Status 400

---

## TEST 9 - ERREUR DUPLICATION MATRICULE
Method: POST
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body (raw JSON):
{
  "modele_voiture": "Peugeot 208",
  "matricule_voiture": "TN123ABC",
  "kilometrage_voiture": 12000
}

Resultat attendu:
- Status 409 (ou 400 selon gestion back)

---

## TEST 10 - UPLOAD PHOTO (form-data)
Method: POST
URL: {{baseUrl}}/api/vehicules

Headers:
- Authorization: Bearer {{token}}

Important:
- Ne pas forcer Content-Type manuellement
- Postman genere automatiquement multipart/form-data

Body (form-data):
- modele_voiture (Text): Honda Civic
- matricule_voiture (Text): TN789GHI
- kilometrage_voiture (Text): 35000
- photo (File): choisir une image locale

Resultat attendu:
- Status 201
- Reponse avec photo_voiture renseignee

---

## Ordre d execution recommande
1. TEST 1
2. TEST 2
3. TEST 3
4. TEST 4
5. TEST 5
6. TEST 6
7. TEST 7
8. TEST 8
9. TEST 9
10. TEST 10

## Critere de validation final
La Sous-tache 3 est validee si:
- Les tests CRUD principaux (1 a 5) passent
- Les tests erreurs (6 a 9) renvoient des statuts coerents
- Le test upload photo (10) fonctionne avec un fichier image
