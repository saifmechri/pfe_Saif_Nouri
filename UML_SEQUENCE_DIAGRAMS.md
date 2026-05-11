# 11 Features - UML Sequence Diagrams

## 1. Authentification Utilisateur

### PlantUML Code
```plantuml
@startuml Authentification_Utilisateur
skinparam Style strictuml

group "SEQ AUTH: Connexion Utilisateur"

actor "Utilisateur" as User
participant "React UI\n(login.jsx)" as UI
participant "AuthContext + Axios" as Service
participant "authController\n.login()" as Ctrl
participant "user.model\n.findUserByEmail()" as Model
database "PostgreSQL" as DB

User -> UI: Remplit email/password
UI -> Service: login(credentials)

activate Service
Service -> Ctrl: POST /api/auth/login

activate Ctrl
Ctrl -> Ctrl: Valider email & password
Ctrl -> Model: findUserByEmail(email)

activate Model
Model -> DB: SELECT u.*, r.name as role_name\nFROM users u JOIN roles r\nON u.role_id = r.id WHERE u.email = $1
activate DB
DB --> Model: user object (hash inclus)
deactivate DB
Model --> Ctrl: user
deactivate Model

Ctrl -> Ctrl: bcrypt.compare(pwd, hash)
Ctrl -> Ctrl: jwt.sign({ id, email }, SECRET, {expiresIn: "7d"})
Ctrl --> Service: 200 OK { token, user }
deactivate Ctrl

Service -> Service: localStorage.setItem("token", token)
Service -> Service: setUser(userData)
Service --> UI: Auth success
deactivate Service

UI -> UI: navigate("/dashboard")
UI --> User: Dashboard affiché

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/pages/auth/login.jsx`, `frontend/src/context/AuthContext.jsx`, `frontend/src/services/api.js`
- Backend: `backend/controllers/authController.js`, `backend/models/user.model.js`
- Middleware: `backend/middlewares/authMiddleware.js` (utilisé pour `/api/auth/profile`, pas pour `/api/auth/login`)

**Validations:**
- express-validator chains on `/auth/register`
- bcrypt hash validation in `authController.login()`
- JWT token expiry: 7 days

---

## 2. CRUD Véhicule (CREATE Example)

### PlantUML Code
```plantuml
@startuml CRUD_Vehicule
skinparam Style strictuml

group "SEQ CRUD: Gestion Véhicule"

actor "Utilisateur" as User
participant "React UI\n(vehicule.jsx)" as UI
participant "vehicule.js Service" as Service
participant "vehiculeController" as Ctrl
database "PostgreSQL" as DB

User -> UI: Choisit une action CRUD

alt CREATE - Ajouter un véhicule
  UI -> Service: createVehicule(formData)
  activate Service
  Service -> Ctrl: POST /api/vehicules\n(Bearer token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: Multer: upload photo
  Ctrl -> Ctrl: validateVehiculePayload()
  Ctrl -> Ctrl: Valider: modele, matricule, km, type
  Ctrl -> DB: INSERT INTO vehicules\n(user_id, modele_voiture, matricule_voiture, type_vehicule,\nkilometrage_voiture, photo_voiture)\nVALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  activate DB
  DB --> Ctrl: vehicule créé
  deactivate DB
  Ctrl --> Service: 201 Created { message, vehicule }
  deactivate Ctrl
  Service --> UI: vehicule créé
  deactivate Service
  UI --> User: Liste rafraîchie

else READ - Lister les véhicules
  UI -> Service: listVehicules()
  activate Service
  Service -> Ctrl: GET /api/vehicules\n(Bearer token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> DB: SELECT id, user_id, modele_voiture, matricule_voiture, type_vehicule,\nkilometrage_voiture, photo_voiture, created_at, updated_at\nFROM vehicules WHERE user_id = $1 ORDER BY created_at DESC
  activate DB
  DB --> Ctrl: vehicules[]
  deactivate DB
  Ctrl --> Service: 200 OK { vehicules }
  deactivate Ctrl
  Service --> UI: vehicules[]
  deactivate Service
  UI --> User: Liste affichée

else UPDATE - Modifier un véhicule
  UI -> Service: updateVehicule(id, formData)
  activate Service
  Service -> Ctrl: PUT /api/vehicules/:id\n(Bearer token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: Multer: upload photo
  Ctrl -> Ctrl: validateVehiculePayload()
  Ctrl -> DB: SELECT photo_voiture FROM vehicules\nWHERE id = $1 AND user_id = $2
  activate DB
  DB --> Ctrl: photo existante ou vide
  deactivate DB
  Ctrl -> DB: UPDATE vehicules SET modele_voiture=$1, matricule_voiture=$2,\ntype_vehicule=$3, kilometrage_voiture=$4, photo_voiture=$5, updated_at=NOW()\nWHERE id=$6 AND user_id=$7 RETURNING *
  activate DB
  DB --> Ctrl: vehicule modifié
  deactivate DB
  Ctrl --> Service: 200 OK { message, vehicule }
  deactivate Ctrl
  Service --> UI: vehicule modifié
  deactivate Service
  UI --> User: Modification enregistrée

else DELETE - Supprimer un véhicule
  UI -> Service: deleteVehicule(id)
  activate Service
  Service -> Ctrl: DELETE /api/vehicules/:id\n(Bearer token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> DB: DELETE FROM vehicules\nWHERE id = $1 AND user_id = $2 RETURNING id
  activate DB
  DB --> Ctrl: deleted id ou vide
  deactivate DB
  Ctrl --> Service: 200 OK { message }
  deactivate Ctrl
  Service --> UI: véhicule supprimé
  deactivate Service
  UI --> User: Liste mise à jour
end

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/vehicule.js`
- Backend: `backend/routes/vehicules.js`, `backend/controllers/vehiculeController.js`
- Middleware: `backend/middlewares/uploadVehiculePhoto.js`

**Validations:**
- vehiculePayload: modele, matricule (required), km (positive), type (enum)
- Photo upload: max size, allowed types via Multer

**All CRUD Operations:**
- CREATE: POST /api/vehicules
- READ: GET /api/vehicules (list), GET /api/vehicules/:id (single)
- UPDATE: PUT /api/vehicules/:id
- DELETE: DELETE /api/vehicules/:id

---

## 3. Historique d'Entretien (Intervention CREATE)

### PlantUML Code
```plantuml
@startuml Intervention_History
skinparam Style strictuml

group "SEQ INTERVENTION: Créer Entretien"

actor "Utilisateur" as User
participant "React UI\n(Dashboard.jsx)" as UI
participant "interventions.js" as Service
participant "intervention.controller" as Ctrl
participant "interventionService" as IntService
participant "intervention.model" as Model
database "PostgreSQL" as DB

User -> UI: Remplit form (date, type, garage, pieces_libres)
UI -> UI: Append pieces_libres to description
UI -> Service: create(vehicleId, payload)

activate Service
Service -> Ctrl: POST /api/vehicules/:vehicleId/interventions\n(Bearer token)

activate Ctrl
Ctrl -> Ctrl: express-validator: vehicleId, body
Ctrl -> Ctrl: verifyToken middleware
Ctrl -> Ctrl: Extract vehicleId & userId

Ctrl -> IntService: createIntervention(payload)
activate IntService

IntService -> Model: createIntervention({...})
activate Model

Model -> DB: INSERT INTO interventions\n(vehicle_id, date_intervention, type, description,\ngarage_nom, garage_adresse, kilometrage,\ncout_total, km_recommande, jours_recommandes)\nVALUES ($1,$2,...,$10) RETURNING *
activate DB
DB --> Model: inserted row
deactivate DB

Model --> IntService: intervention object
deactivate Model

IntService --> Ctrl: intervention
deactivate IntService

Ctrl --> Service: 201 Created { success, data }
deactivate Ctrl

Service --> UI: intervention
deactivate Service

UI -> UI: Add to interventions list
UI --> User: Success, history updated

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/interventions.js`, `frontend/src/pages/automobiliste/Dashboard.jsx`
- Backend: `backend/routes/interventions.js`, `backend/controllers/intervention.controller.js`
- Service: `backend/services/interventionService.js`
- Model: `backend/models/intervention.model.js`

**Validations:**
- vehicleId: positive integer (param validation)
- date_intervention: ISO8601 format
- type, description: string lengths
- Cost/km: positive floats/ints

**Free-Text Parts:**
- User enters `pieces_libres` → appended to `description` field before DB insert
- No schema change required

**All Intervention CRUD:**
- CREATE: POST /api/vehicules/:vehicleId/interventions
- LIST: GET /api/vehicules/:vehicleId/interventions
- GET: GET /api/vehicules/:vehicleId/interventions/:id
- UPDATE: PATCH /api/vehicules/:vehicleId/interventions/:id
- DELETE: DELETE /api/vehicules/:vehicleId/interventions/:id

---

## 4. Recommandation Intelligente

### PlantUML Code
```plantuml
@startuml Recommandation_Intelligente
skinparam Style strictuml

group "SEQ RECOMMEND: Récupérer Recommandations"

actor "Utilisateur" as User
participant "React UI\n(RecommendationsAssistant.jsx)" as UI
participant "recommendation.js" as Service
participant "recommendationController" as Ctrl
participant "algorithms.js" as Algo
participant "PostgreSQL" as DB

User -> UI: Load recommendations assistant
UI -> Service: getDynamicRecommendations(params)

activate Service
Service -> Ctrl: GET /api/recommendations/classees?params\n(Bearer token)

activate Ctrl
Ctrl -> Ctrl: verifyToken middleware
Ctrl -> Ctrl: Parse & validate query params
Ctrl -> Ctrl: (minScore, urgency, sortBy, page, limit)

Ctrl -> DB: SELECT id, latitude, longitude FROM users WHERE id = $1
activate DB
DB --> Ctrl: user coords
deactivate DB

Ctrl -> DB: SELECT id, modele_voiture, type_vehicule, kilometrage_voiture FROM vehicules WHERE user_id = $1
activate DB
DB --> Ctrl: vehicles array
deactivate DB

Ctrl -> DB: SELECT DISTINCT ON (type) id, type, km_recommande, jours_recommandes FROM interventions
activate DB
DB --> Ctrl: intervention types
deactivate DB

Ctrl -> DB: SELECT id, name, adresse, latitude, longitude, rating FROM garages
activate DB
DB --> Ctrl: garages array
deactivate DB

loop for each vehicle & intervention type
  Ctrl -> DB: SELECT last intervention by type WHERE vehicle_id=$1 AND type=$2
  activate DB
  DB --> Ctrl: lastIntervention or null
  deactivate DB
  
  Ctrl -> Algo: calculateInterventionScore(...)
  Algo --> Ctrl: score (0-100)
  
  Ctrl -> Algo: getUrgency(kmActuel, kmRecommande)
  Algo --> Ctrl: urgence label
  
  loop for each garage
    Ctrl -> Algo: haversine(userLat, garageLat, ...)
    Algo --> Ctrl: distance_km
    Ctrl -> Algo: calculateGarageScore(...)
    Algo --> Ctrl: garage score
  end
  
  Ctrl -> Ctrl: Build recommendation item
end

Ctrl -> Ctrl: Filter, sort, paginate
Ctrl -> Ctrl: Compute meta & stats
Ctrl --> Service: 200 OK { data, meta }
deactivate Ctrl

Service --> UI: recommendations + meta
deactivate Service

UI -> UI: Render cards with rankings
UI --> User: Assistant UI affiché

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/recommendation.js`, `frontend/src/pages/automobiliste/RecommendationsAssistant.jsx`
- Backend: `backend/controllers/recommendationController.js`, `backend/utils/algorithms.js`
- Route: `backend/routes/recommendations.js`

**Scoring Algorithms** (in `algorithms.js`):
- `calculateInterventionScore(vehicle, lastIntervention, interventionType)`: returns 0-100 based on km and time since last intervention
- `calculateGarageScore(userLat, userLon, garage)`: combines distance, rating, availability
- `getUrgency(kmActuel, kmRecommande)`: returns "URGENT", "RECOMMANDÉ", or "FUTUR"
- `haversine(lat1, lon1, lat2, lon2)`: calculates distance in km between coordinates

**Query Parameters:**
- `minInterventionScore`: (0-100, default 0)
- `urgency`: URGENT | RECOMMANDÉ | FUTUR
- `sortBy`: urgence | score | distance | type (default: urgence)
- `order`: asc | desc (default: desc)
- `garageLimit`: (1-10, default 5)
- `page`: (>=1, default 1)
- `limit`: (1-50, default 10)

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "vehicle": { "id", "modele", "kilometrage", "type", "matricule" },
      "intervention": { "id", "type", "urgence", "score", "km_recommande", "km_actuel", "km_restant", "jours_recommandes" },
      "garages": [ { "id", "name", "adresse", "distance_km", "rating", "score_global", "isOpen" } ]
    }
  ],
  "count": 5,
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "sortBy": "urgence",
    "order": "desc",
    "filters": { "urgency": null, "minInterventionScore": 0 },
    "stats": { "byUrgency": { "URGENT": 3, "RECOMMANDÉ": 7, "FUTUR": 5 } }
  }
}
```

---

## 5. Gestion Profil Admin - Opérations Profil

### PlantUML Code
```plantuml
@startuml Admin_Profile_Management
skinparam Style strictuml

group "SEQ ADMIN: Gestion Profil Admin"

actor "Admin" as Admin
participant "React UI\n(AdminSettings.jsx)" as UI
participant "admin.js Service" as Service
participant "adminController" as Ctrl
participant "auditService" as Audit
database "PostgreSQL" as DB

Admin -> UI: Choisit une action profil

alt MODIFIER PROFIL - Mise à jour informations
  UI -> Service: updateProfile(formData)
  activate Service
  Service -> Ctrl: PUT /api/admin/profile\n(Bearer admin token)
  activate Ctrl
  Ctrl -> Ctrl: verifyAdminToken middleware
  Ctrl -> Ctrl: Verify: decoded.admin === true
  Ctrl -> Ctrl: Verify: email === ADMIN_EMAIL
  Ctrl -> Ctrl: Validate: name, email, telephone
  Ctrl -> DB: UPDATE users SET name=$1, email=$2, telephone=$3,\nupdated_at=NOW() WHERE id=$4 AND role_id=1\nRETURNING id, name, email, telephone
  activate DB
  DB --> Ctrl: admin profil mis à jour
  deactivate DB
  Ctrl -> Audit: logAction({action: 'PROFILE_UPDATE', entity: 'admin', ...})
  activate Audit
  Audit -> DB: INSERT INTO audit_logs(...) VALUES(...)
  activate DB
  DB --> Audit: inserted
  deactivate DB
  Audit --> Ctrl: success
  deactivate Audit
  Ctrl --> Service: 200 OK { message, admin }
  deactivate Ctrl
  Service --> UI: profil modifié
  deactivate Service
  UI --> Admin: Profil enregistré ✓

else CHANGER MOT DE PASSE
  UI -> Service: changePassword(oldPassword, newPassword)
  activate Service
  Service -> Ctrl: POST /api/admin/change-password\n(Bearer admin token)
  activate Ctrl
  Ctrl -> Ctrl: verifyAdminToken middleware
  Ctrl -> Ctrl: Verify: decoded.admin === true
  Ctrl -> Ctrl: Verify: email === ADMIN_EMAIL
  Ctrl -> Ctrl: Validate: oldPassword & newPassword
  Ctrl -> DB: SELECT password_hash FROM users\nWHERE id=$1 AND role_id=1
  activate DB
  DB --> Ctrl: admin user (hash)
  deactivate DB
  Ctrl -> Ctrl: bcrypt.compare(oldPassword, hash)
  alt Ancien mot de passe incorrect
    Ctrl --> Service: 401 Unauthorized
    Service --> UI: error: "Mot de passe actuel incorrect"
  else Ancien mot de passe valide
    Ctrl -> Ctrl: bcrypt.hash(newPassword, 10)
    Ctrl -> DB: UPDATE users SET password_hash=$1, updated_at=NOW()\nWHERE id=$2 AND role_id=1 RETURNING id
    activate DB
    DB --> Ctrl: mot de passe changé
    deactivate DB
    Ctrl -> Audit: logAction({action: 'PASSWORD_CHANGE', entity: 'admin', ...})
    activate Audit
    Audit -> DB: INSERT INTO audit_logs(...) VALUES(...)
    activate DB
    DB --> Audit: inserted
    deactivate DB
    Audit --> Ctrl: success
    deactivate Audit
    Ctrl --> Service: 200 OK { message }
  end
  deactivate Ctrl
  Service --> UI: mot de passe changé
  deactivate Service
  UI --> Admin: Mot de passe enregistré ✓

else SUPPRIMER COMPTE ADMIN
  UI -> UI: Affiche confirmation
  Admin -> UI: Confirme suppression + mot de passe
  UI -> Service: deleteAccount(adminPassword)
  activate Service
  Service -> Ctrl: DELETE /api/admin/account\n(Bearer admin token)
  activate Ctrl
  Ctrl -> Ctrl: verifyAdminToken middleware
  Ctrl -> Ctrl: Verify: decoded.admin === true
  Ctrl -> Ctrl: Verify: email === ADMIN_EMAIL
  Ctrl -> DB: SELECT password_hash FROM users WHERE id=$1 AND role_id=1
  activate DB
  DB --> Ctrl: admin user (hash)
  deactivate DB
  Ctrl -> Ctrl: bcrypt.compare(password, hash)
  alt Mot de passe incorrect
    Ctrl --> Service: 401 Unauthorized
    Service --> UI: error: "Mot de passe incorrect"
  else Mot de passe valide
    Ctrl -> DB: BEGIN TRANSACTION
    Ctrl -> Audit: logAction({action: 'ADMIN_DELETED', entity: 'admin', entityId: adminId, ...})
    activate Audit
    Audit -> DB: INSERT INTO audit_logs(...) VALUES(...)
    activate DB
    DB --> Audit: logged
    deactivate DB
    Audit --> Ctrl: logged
    deactivate Audit
    Ctrl -> DB: DELETE FROM users WHERE id=$1 AND role_id=1 RETURNING id
    activate DB
    DB --> Ctrl: admin supprimé
    deactivate DB
    Ctrl -> DB: COMMIT TRANSACTION
    Ctrl --> Service: 200 OK { message }
  end
  deactivate Ctrl
  Service --> UI: compte supprimé
  deactivate Service
  UI -> UI: Clear localStorage token
  UI -> UI: navigate("/")
  UI --> Admin: Compte supprimé - Redirection login

end

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/admin.js`, `frontend/src/pages/admin/AdminSettings.jsx`
- Backend: `backend/controllers/adminController.js`, `backend/routes/admin.js`
- Middleware: `backend/middlewares/adminAuthMiddleware.js`
- Service: `backend/services/auditService.js`

**Admin Profile Operations:**

**Profile Management:**
- PUT /api/admin/profile → `updateProfile()` (name, email, telephone)
- POST /api/admin/change-password → `changePassword()` (oldPassword, newPassword)
- DELETE /api/admin/account → `deleteAccount()` (password confirmation required)

**User Management:**
- GET /api/admin/users/pending → `listPendingUsers()`
- POST /api/admin/users/:id/approve → `approveUser()`
- POST /api/admin/users/:id/reject → `rejectUser()`

**Garage Management:**
- GET /api/admin/garages → `listGarages()`
- POST /api/admin/garages/:id/approve → `approveGarage()`
- POST /api/admin/garages/:id/reject → `rejectGarage()`
- POST /api/admin/garages/:id/deactivate → `deactivateGarage()`
- DELETE /api/admin/garages/:id → `deleteGarageAdmin()`

**Piece Management:**
- GET /api/admin/pieces → `listPieces()`
- POST /api/admin/pieces/:id/approve → `approvePiece()`
- POST /api/admin/pieces/:id/reject → `rejectPiece()`
- DELETE /api/admin/pieces/:id → `deletePieceAdmin()`

**Reports & Audit:**
- GET /api/admin/stats → `getDashboardStats()`
- GET /api/admin/audit-logs → `listAuditLogs()`

**Admin Authentication:**
- Environment variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Default: `admin123@gmail.com` / `Admin@admin0`
- JWT payload includes `{ admin: true, email: ADMIN_EMAIL }`
- Token expiry: 7 days

**Audit Logging:**
- Every admin action calls `logAction()` with: adminEmail, action, entity, entityId, details, ip, userAgent
- Inserted into `audit_logs` table for full compliance trail
- Profile updates, password changes, and account deletion are all logged

---

## Summary: Key Lifelines for All 11 Features

| Feature | Frontend Service | API Route | Controller | Model/Service | DB Query |
|---------|------------------|-----------|------------|---------------|----------|
| **Auth** | AuthContext.login() | POST /api/auth/login | authController.login() | user.model.findUserByEmail() | SELECT users JOIN roles |
| **Vehicle CRUD** | vehicule.js | POST/GET/PUT/DELETE /vehicules | vehiculeController | Direct SQL in controller | INSERT/SELECT/UPDATE/DELETE vehicules |
| **Intervention** | interventions.js | POST/GET/PATCH/DELETE /vehicules/:id/interventions | intervention.controller | interventionService → intervention.model | INSERT/SELECT/UPDATE/DELETE interventions |
| **Recommendation** | recommendation.js | GET /recommendations/classees | recommendationController | algorithms.js scoring | SELECT users, vehicules, interventions, garages |
| **Admin Profile** | admin.js | PUT/POST/DELETE /admin/* | adminController | auditService | UPDATE/DELETE users, INSERT audit_logs |
| **Pieces Catalog** | pieces.js | GET /api/pieces | pieceController | Direct SQL in controller | SELECT pieces (search, filter, sort, paginate) |
| **Pieces Compare** | pieces.js | GET /api/pieces/compare | pieceController | algorithms.js comparison | SELECT pieces (similar items, pricing analysis) |
| **Garage Filters** | garages.js | GET /api/garages | garageController | algorithms.js (haversine) | SELECT garages (distance calc, service match) |
| **Garage Profile** | garages.js | GET/PUT /api/garages/me | garageController | Direct SQL in controller | SELECT/UPDATE garages (garage owner) |
| **Garage Services** | garageServices.js | GET/POST/PUT/DELETE /api/garages/:id/services | garageServiceController | Direct SQL in controller | INSERT/SELECT/UPDATE/DELETE garage_services |
| **Seller Pieces Management** | pieces.js | GET/POST/PUT/DELETE /api/pieces + stock routes | pieceController | pieceService | SELECT/INSERT/UPDATE/DELETE pieces, stock movements |

---

## 6. Automobiliste — Catalogue Pièces

### PlantUML Code
```plantuml
@startuml Automobiliste_Catalogue_Pieces
skinparam Style strictuml

group "SEQ PIECES: Consulter Catalogue Pièces"

actor "Automobiliste" as User
participant "React UI\n(PiecesCatalog.jsx)" as UI
participant "pieces.js Service" as Service
participant "pieceController" as Ctrl
participant "algorithms.js" as Algo
database "PostgreSQL" as DB

User -> UI: Accède au catalogue pièces
UI -> UI: Charge filtres (marque, catégorie)

User -> UI: Cherche/Filtre pièces

activate UI
UI -> Service: listPieces(page, limit, search, sortBy, sortOrder)
activate Service
Service -> Ctrl: GET /api/pieces?params\n(Bearer token optionnel)
activate Ctrl

Ctrl -> Ctrl: Parse query params (page, limit, search, sortBy, sortOrder)
Ctrl -> Ctrl: Valider: sortBy ∈ [nom, reference, prix, created_at]
Ctrl -> Ctrl: Valider: sortOrder ∈ [asc, desc]

Ctrl -> DB: SELECT id, nom, reference, description, prix_unitaire,\nstock, condition, marque, modele, categorie, photo_url, rating\nFROM pieces WHERE (nom ILIKE $1 OR reference ILIKE $1)\nORDER BY {sortBy} {sortOrder}\nLIMIT $2 OFFSET $3
activate DB
DB --> Ctrl: pieces[] + metadata (total count)
deactivate DB

Ctrl -> Ctrl: Filter/sort results in memory
Ctrl -> Ctrl: Paginate response

Ctrl --> Service: 200 OK { pieces, total, page, limit }
deactivate Ctrl

Service --> UI: pieces[]
deactivate Service

UI -> UI: Affiche liste de pièces avec filtres
UI -> UI: Pagination controls
UI --> User: Catalogue affiché

alt Utilisateur sélectionne une pièce
  User -> UI: Clique sur pièce
  UI -> Service: getPieceById(pieceId)
  activate Service
  Service -> Ctrl: GET /api/pieces/:id
  activate Ctrl
  Ctrl -> DB: SELECT * FROM pieces WHERE id = $1
  activate DB
  DB --> Ctrl: piece détail
  deactivate DB
  Ctrl --> Service: 200 OK { piece }
  deactivate Ctrl
  Service --> UI: piece détail
  deactivate Service
  UI --> User: Détail pièce affiché
end

deactivate UI

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/pieces.js`, `frontend/src/pages/automobiliste/PiecesCatalog.jsx`
- Backend: `backend/routes/piece.routes.js`, `backend/controllers/piece.controller.js`

**Piece Catalog Operations:**
- GET /api/pieces → `listPieces()` (pagination, search, sort, filter)
- GET /api/pieces/:id → `getPieceById()` (détail pièce)
- GET /api/pieces/compare → `comparePieces()` (comparaison intelligente)

**Query Parameters:**
- `page`: (>=1, default 1)
- `limit`: (1-100, default 10)
- `search`: (texte libre pour nom/reference)
- `sortBy`: nom | reference | prix_unitaire | created_at
- `sortOrder`: asc | desc

---

## 7. Automobiliste — Comparaison Intelligente Pièces

### PlantUML Code
```plantuml
@startuml Automobiliste_Comparaison_Pieces
skinparam Style strictuml

group "SEQ COMPARE: Comparer Pièces Intelligemment"

actor "Automobiliste" as User
participant "React UI\n(PiecesComparison.jsx)" as UI
participant "pieces.js Service" as Service
participant "pieceController" as Ctrl
participant "algorithms.js" as Algo
database "PostgreSQL" as DB

User -> UI: Sélectionne pièces à comparer

alt Comparaison par ID
  UI -> Service: comparePieces(pieceId)
  activate Service
  Service -> Ctrl: GET /api/pieces/compare?pieceId=123\n(Bearer token optionnel)
  activate Ctrl
  Ctrl -> DB: SELECT * FROM pieces WHERE id = $1
  activate DB
  DB --> Ctrl: piece source
  deactivate DB
  
else Comparaison par nom
  UI -> Service: comparePieces(pieceName)
  activate Service
  Service -> Ctrl: GET /api/pieces/compare?name="Filtre à air"\n(Bearer token optionnel)
  activate Ctrl
  Ctrl -> DB: SELECT * FROM pieces WHERE nom ILIKE $1
  activate DB
  DB --> Ctrl: pieces matching name
  deactivate DB
end

Ctrl -> Algo: calculatePriceDifference(pieces)
Algo --> Ctrl: price stats (min, max, avg, variance)

Ctrl -> Algo: comparePieceFeatures(pieces)
Algo --> Ctrl: feature comparison matrix

Ctrl -> Ctrl: Build comparison response with:
Ctrl -> Ctrl: - Piece details (nom, marque, modele)
Ctrl -> Ctrl: - Pricing comparison (prix, écart)
Ctrl -> Ctrl: - Stock availability
Ctrl -> Ctrl: - Rating & reviews

Ctrl --> Service: 200 OK { pieces[], priceStats, comparison }
deactivate Ctrl

Service --> UI: comparison data
deactivate Service

UI -> UI: Render comparison table
UI -> UI: Highlight differences (prix, qualité)
UI -> UI: Show best value recommendation
UI --> User: Comparaison affichée

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/pieces.js`, `frontend/src/pages/automobiliste/PiecesComparison.jsx`
- Backend: `backend/controllers/piece.controller.js`, `backend/utils/algorithms.js`

**Comparison Features:**
- Compare by pieceId (exact match)
- Compare by name (similar pieces search)
- Price range analysis
- Stock availability comparison
- Quality & condition scoring
- Value-for-money recommendation

---

## 8. Automobiliste — Filtrage Intelligent Garages

### PlantUML Code
```plantuml
@startuml Automobiliste_Filtrage_Garages
skinparam Style strictuml

group "SEQ FILTER: Filtrer Garages Intelligemment"

actor "Automobiliste" as User
participant "React UI\n(GarageFilters.jsx)" as UI
participant "garages.js Service" as Service
participant "garageController" as Ctrl
participant "algorithms.js" as Algo
database "PostgreSQL" as DB

User -> UI: Charge page recherche garages
UI -> Service: getFilterOptions()
activate Service
Service -> Ctrl: GET /api/garages/filter-options
activate Ctrl
Ctrl -> DB: SELECT DISTINCT services FROM garage_services
activate DB
DB --> Ctrl: services[]
deactivate DB
Ctrl -> Ctrl: Build filter options
Ctrl --> Service: { services, minRating, maxRating }
deactivate Ctrl
Service --> UI: filter options
deactivate Service
UI -> UI: Affiche formulaire filtres

User -> UI: Applique filtres (distance, services, rating)

activate UI
UI -> Service: listGarages(filters)
activate Service
Service -> Ctrl: GET /api/garages?userLat=X&userLon=Y&radiusKm=50&services=oil,tire&minRating=4
activate Ctrl

Ctrl -> Ctrl: verifyToken middleware (optionnel pour localisation)
Ctrl -> Ctrl: Parse filters: userLat, userLon, radiusKm, services, serviceMatch, minRating
Ctrl -> Ctrl: Valider: radiusKm > 0, minRating ∈ [0-5]

Ctrl -> DB: SELECT id, name, adresse, latitude, longitude, rating, is_open,\nphone, email FROM garages WHERE is_validated = true AND is_active = true
activate DB
DB --> Ctrl: garages[]
deactivate DB

loop for each garage
  Ctrl -> Algo: haversine(userLat, userLon, garageLat, garageLon)
  Algo --> Ctrl: distance_km
  
  Ctrl -> Ctrl: Check: distance_km <= radiusKm
  Ctrl -> Ctrl: Check: rating >= minRating
  
  alt Services requested
    Ctrl -> DB: SELECT services FROM garage_services WHERE garage_id=$1
    activate DB
    DB --> Ctrl: garage services
    deactivate DB
    Ctrl -> Ctrl: Match services (any/all)
  end
end

Ctrl -> Ctrl: Filter matching garages
Ctrl -> Ctrl: Sort: distance ASC (default)
Ctrl -> Ctrl: Paginate results

Ctrl --> Service: 200 OK { garages[], count, filters }
deactivate Ctrl

Service --> UI: filtered garages
deactivate Service

UI -> UI: Affiche résultats sur carte + liste
UI -> UI: Tri par distance/rating
UI -> UI: Affiche services compatibles
UI --> User: Garages filtrés affichés

deactivate UI

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/garages.js`, `frontend/src/pages/automobiliste/GarageFilters.jsx`
- Backend: `backend/controllers/garage.controller.js`, `backend/utils/algorithms.js`

**Filter Parameters:**
- `userLat`, `userLon`: User location for distance calculation
- `radiusKm`: Search radius (1-500 km, default 50)
- `services`: Comma-separated service names
- `serviceMatch`: any | all (default: any)
- `minRating`: 0-5 (default: 0)
- `maxRating`: 0-5 (default: 5)
- `includeClosed`: Include closed garages (true/false)

---

## 9. Garage — Consultation et Modification Profil

### PlantUML Code
```plantuml
@startuml Garage_Profile_Management
skinparam Style strictuml

group "SEQ GARAGE: Gestion Profil Garage"

actor "GarageOwner" as Owner
participant "React UI\n(GarageProfile.jsx)" as UI
participant "garages.js Service" as Service
participant "garageController" as Ctrl
database "PostgreSQL" as DB

Owner -> UI: Accède à profil garage

alt CONSULTER PROFIL
  UI -> Service: getMyGarage()
  activate Service
  Service -> Ctrl: GET /api/garages/me\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> DB: SELECT id, name, adresse, telephone, email, latitude, longitude,\nrating, is_open, photo, user_id FROM garages WHERE user_id=$1
  activate DB
  DB --> Ctrl: garage profil
  deactivate DB
  Ctrl --> Service: 200 OK { garage }
  deactivate Ctrl
  Service --> UI: garage data
  deactivate Service
  UI -> UI: Affiche profil garage
  UI --> Owner: Profil affiché

else MODIFIER PROFIL
  Owner -> UI: Modifie informations (nom, adresse, tel, email, horaires, localisation)
  UI -> Service: updateGarage(formData)
  activate Service
  Service -> Ctrl: PUT /api/garages/:id\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> Ctrl: Valider: name, adresse, telephone, email (format)
  Ctrl -> Ctrl: Valider: latitude ∈ [-90,90], longitude ∈ [-180,180]
  
  Ctrl -> DB: SELECT user_id FROM garages WHERE id=$1
  activate DB
  DB --> Ctrl: garage
  deactivate DB
  
  Ctrl -> Ctrl: Verify: req.user.id == garage.user_id
  
  Ctrl -> DB: UPDATE garages SET name=$1, adresse=$2, telephone=$3, email=$4,\nlatitude=$5, longitude=$6, is_open=$7, updated_at=NOW()\nWHERE id=$8 AND user_id=$9 RETURNING *
  activate DB
  DB --> Ctrl: garage modifié
  deactivate DB
  
  Ctrl --> Service: 200 OK { message, garage }
  deactivate Ctrl
  Service --> UI: garage modifié
  deactivate Service
  UI -> UI: Update local state
  UI --> Owner: Profil enregistré ✓

end

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/garages.js`, `frontend/src/pages/garage/GarageProfile.jsx`
- Backend: `backend/routes/garage.routes.js`, `backend/controllers/garage.controller.js`

**Garage Profile Operations:**
- GET /api/garages/me → `getMyGarage()` (consultation profil)
- PUT /api/garages/:id → `updateGarage()` (modification profil)
- GET /api/garages/:id/reviews → `listGarageReviews()` (avis clients)
- GET /api/garages/:id/availability → `getAvailability()` (disponibilités)

**Editable Fields:**
- name, adresse, telephone, email
- latitude, longitude (GPS position)
- is_open (horaires ouvert/fermé)
- rating (géré par les clients via reviews)

---

## 10. Garage — Gestion Catalogue Services

### PlantUML Code
```plantuml
@startuml Garage_Services_Management
skinparam Style strictuml

group "SEQ GARAGE SERVICES: Gérer Catalogue Services"

actor "GarageOwner" as Owner
participant "React UI\n(ServicesManagement.jsx)" as UI
participant "garageServices.js" as Service
participant "garageServiceController" as Ctrl
database "PostgreSQL" as DB

Owner -> UI: Accède gestion services

alt LISTER SERVICES
  UI -> Service: listMyServices()
  activate Service
  Service -> Ctrl: GET /api/garages/:id/services\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> DB: SELECT id, name, description, base_price, duration_minutes,\nis_active, created_at FROM garage_services\nWHERE garage_id=$1 ORDER BY created_at DESC
  activate DB
  DB --> Ctrl: services[]
  deactivate DB
  Ctrl --> Service: 200 OK { services }
  deactivate Ctrl
  Service --> UI: services[]
  deactivate Service
  UI -> UI: Affiche liste services
  UI --> Owner: Services affichés

else AJOUTER SERVICE
  Owner -> UI: Clique "Ajouter service"
  UI -> UI: Affiche formulaire (nom, description, prix, durée)
  Owner -> UI: Remplir form + submit
  UI -> Service: createService(formData)
  activate Service
  Service -> Ctrl: POST /api/garages/:id/services\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> Ctrl: Valider: name (obligatoire), description, base_price>0, duration_minutes>0
  Ctrl -> DB: INSERT INTO garage_services\n(garage_id, name, description, base_price, duration_minutes, is_active)\nVALUES ($1, $2, $3, $4, $5, true) RETURNING *
  activate DB
  DB --> Ctrl: service créé
  deactivate DB
  Ctrl --> Service: 201 Created { service }
  deactivate Ctrl
  Service --> UI: service créé
  deactivate Service
  UI -> UI: Add to list
  UI --> Owner: Service ajouté ✓

else MODIFIER SERVICE
  Owner -> UI: Clique "Éditer" sur service
  UI -> Service: updateService(serviceId, formData)
  activate Service
  Service -> Ctrl: PUT /api/garages/:id/services/:serviceId\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> Ctrl: Valider: name, description, base_price, duration_minutes
  Ctrl -> DB: UPDATE garage_services SET name=$1, description=$2,\nbase_price=$3, duration_minutes=$4, is_active=$5, updated_at=NOW()\nWHERE id=$6 AND garage_id=$7 RETURNING *
  activate DB
  DB --> Ctrl: service modifié
  deactivate DB
  Ctrl --> Service: 200 OK { service }
  deactivate Ctrl
  Service --> UI: service modifié
  deactivate Service
  UI -> UI: Update in list
  UI --> Owner: Service modifié ✓

else SUPPRIMER SERVICE
  Owner -> UI: Clique "Supprimer" sur service
  UI -> UI: Affiche confirmation
  Owner -> UI: Confirme suppression
  UI -> Service: deleteService(serviceId)
  activate Service
  Service -> Ctrl: DELETE /api/garages/:id/services/:serviceId\n(Bearer token garage owner)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: checkRole('garage')
  Ctrl -> DB: DELETE FROM garage_services\nWHERE id=$1 AND garage_id=$2 RETURNING id
  activate DB
  DB --> Ctrl: deleted
  deactivate DB
  Ctrl --> Service: 200 OK { message }
  deactivate Ctrl
  Service --> UI: supprimé
  deactivate Service
  UI -> UI: Remove from list
  UI --> Owner: Service supprimé ✓

end

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/garageServices.js`, `frontend/src/pages/garage/ServicesManagement.jsx`
- Backend: `backend/routes/garage.routes.js`, `backend/controllers/garageService.controller.js`

**Service Management Operations:**
- GET /api/garages/:id/services → `listGarageServices()` (lister services)
- POST /api/garages/:id/services → `createService()` (ajouter service)
- PUT /api/garages/:id/services/:serviceId → `updateService()` (modifier service)
- DELETE /api/garages/:id/services/:serviceId → `deleteService()` (supprimer service)

**Service Fields:**
- name: String (required, max 255)
- description: Text (optional)
- base_price: Float (required, > 0)
- duration_minutes: Int (required, 1-10080)
- is_active: Boolean (default: true)

---

## 11. Vendeur — Gestion du Catalogue Pièces

### PlantUML Code
```plantuml
@startuml Vendeur_Gestion_Catalogue_Pieces
skinparam Style strictuml

group "SEQ PIECES: Gestion Catalogue Vendeur"

actor "Vendeur" as Seller
participant "React UI\n(SellerPiecesManagement.jsx)" as UI
participant "pieces.js Service" as Service
participant "pieceController" as Ctrl
participant "pieceService" as PService
database "PostgreSQL" as DB

Seller -> UI: Accède à la gestion du catalogue

alt LISTER CATALOGUE
  UI -> Service: listPieces(page, limit, search, sortBy, sortOrder)
  activate Service
  Service -> Ctrl: GET /api/pieces?params
  activate Ctrl
  Ctrl -> Ctrl: Parse query params
  Ctrl -> Ctrl: Valider page, limit, search, sortBy, sortOrder
  Ctrl -> PService: getPieces(filters)
  activate PService
  PService -> DB: SELECT id, nom, reference, description, prix_unitaire, stock,\ncondition, marque, modele, categorie, photo_url, created_at\nFROM pieces WHERE user_id = $1\nORDER BY created_at DESC LIMIT $2 OFFSET $3
  activate DB
  DB --> PService: pieces[]
  deactivate DB
  PService --> Ctrl: catalogue pièces
  deactivate PService
  Ctrl --> Service: 200 OK { pieces }
  deactivate Ctrl
  Service --> UI: pieces[]
  deactivate Service
  UI --> Seller: Catalogue affiché

else AJOUTER PIECE
  Seller -> UI: Remplit form (nom, reference, prix, stock, photo)
  UI -> Service: createPiece(formData)
  activate Service
  Service -> Ctrl: POST /api/pieces\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: uploadPiecePhoto.single('photo_piece')
  Ctrl -> Ctrl: validate createPieceValidation
  Ctrl -> PService: createPiece(payload)
  activate PService
  PService -> DB: INSERT INTO pieces\n(user_id, nom, reference, description, prix_unitaire, stock, photo_url)\nVALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  activate DB
  DB --> PService: piece créée
  deactivate DB
  PService --> Ctrl: piece
  deactivate PService
  Ctrl --> Service: 201 Created { piece }
  deactivate Ctrl
  Service --> UI: piece créée
  deactivate Service
  UI --> Seller: Pièce ajoutée ✓

else MODIFIER PIECE
  Seller -> UI: Ouvre une pièce et modifie les champs
  UI -> Service: updatePiece(id, formData)
  activate Service
  Service -> Ctrl: PUT /api/pieces/:id\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: uploadPiecePhoto.single('photo_piece')
  Ctrl -> Ctrl: validate updatePieceValidation
  Ctrl -> PService: updatePiece(pieceId, payload)
  activate PService
  PService -> DB: UPDATE pieces SET nom=$1, reference=$2, description=$3,\nprix_unitaire=$4, stock=$5, condition=$6, zone_geographique=$7,\nmarque=$8, modele=$9, categorie=$10, photo_url=$11, updated_at=NOW()\nWHERE id=$12 RETURNING *
  activate DB
  DB --> PService: piece mise à jour
  deactivate DB
  PService --> Ctrl: piece
  deactivate PService
  Ctrl --> Service: 200 OK { piece }
  deactivate Ctrl
  Service --> UI: piece mise à jour
  deactivate Service
  UI --> Seller: Modification enregistrée

else SUPPRIMER PIECE
  Seller -> UI: Clique supprimer puis confirme
  UI -> Service: deletePiece(id)
  activate Service
  Service -> Ctrl: DELETE /api/pieces/:id\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: validate piece id
  Ctrl -> PService: deletePiece(pieceId)
  activate PService
  PService -> DB: DELETE FROM pieces WHERE id=$1 RETURNING id
  activate DB
  DB --> PService: piece supprimée
  deactivate DB
  PService --> Ctrl: deleted
  deactivate PService
  Ctrl --> Service: 200 OK { message }
  deactivate Ctrl
  Service --> UI: piece supprimée
  deactivate Service
  UI --> Seller: Catalogue mis à jour

else AJUSTER STOCK
  Seller -> UI: Saisit variation de stock
  UI -> Service: adjustStock(id, quantity_change, reason)
  activate Service
  Service -> Ctrl: POST /api/pieces/:id/stock/adjust\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: validate adjustStockValidation
  Ctrl -> PService: adjustPieceStock(pieceId, payload, userId)
  activate PService
  PService -> DB: INSERT INTO piece_stock_movements(...) VALUES(...)
  activate DB
  DB --> PService: mouvement enregistré
  deactivate DB
  PService -> DB: UPDATE pieces SET stock = stock + $1 WHERE id=$2 RETURNING stock
  activate DB
  DB --> PService: stock mis à jour
  deactivate DB
  PService --> Ctrl: stock + mouvement
  deactivate PService
  Ctrl --> Service: 200 OK { stock, movement }
  deactivate Ctrl
  Service --> UI: stock mis à jour
  deactivate Service
  UI --> Seller: Stock ajusté

else DEFINIR STOCK
  Seller -> UI: Définit le stock exact
  UI -> Service: setStock(id, stock)
  activate Service
  Service -> Ctrl: PUT /api/pieces/:id/stock\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: validate setStockValidation
  Ctrl -> PService: setPieceStock(pieceId, payload, userId)
  activate PService
  PService -> DB: UPDATE pieces SET stock=$1, updated_at=NOW() WHERE id=$2 RETURNING stock
  activate DB
  DB --> PService: stock défini
  deactivate DB
  PService -> DB: INSERT INTO piece_stock_movements(...) VALUES(...)
  activate DB
  DB --> PService: historique stock créé
  deactivate DB
  PService --> Ctrl: stock défini
  deactivate PService
  Ctrl --> Service: 200 OK { stock }
  deactivate Ctrl
  Service --> UI: stock défini
  deactivate Service
  UI --> Seller: Stock enregistré

else CONSULTER HISTORIQUE STOCK
  Seller -> UI: Ouvre historique de stock
  UI -> Service: getStockMovements(id, page, limit)
  activate Service
  Service -> Ctrl: GET /api/pieces/:id/stock/movements\n(Bearer vendeur token)
  activate Ctrl
  Ctrl -> Ctrl: verifyToken middleware
  Ctrl -> Ctrl: isVendeurOrAdmin
  Ctrl -> Ctrl: validate stockMovementsValidation
  Ctrl -> PService: getPieceStockMovements(pieceId, pagination)
  activate PService
  PService -> DB: SELECT * FROM piece_stock_movements WHERE piece_id=$1\nORDER BY created_at DESC LIMIT $2 OFFSET $3
  activate DB
  DB --> PService: mouvements[]
  deactivate DB
  PService --> Ctrl: historique stock
  deactivate PService
  Ctrl --> Service: 200 OK { movements }
  deactivate Ctrl
  Service --> UI: movements[]
  deactivate Service
  UI --> Seller: Historique affiché

end

end
@enduml
```

**Key Files:**
- Frontend: `frontend/src/services/pieces.js`, `frontend/src/pages/vendeur/SellerPiecesManagement.jsx`
- Backend: `backend/routes/piece.routes.js`, `backend/controllers/piece.controller.js`
- Service: `backend/services/pieceService.js`
- Middleware: `backend/middlewares/uploadPiecePhoto.js`

**Seller Catalog Operations:**
- GET /api/pieces → `getAllPieces()`
- GET /api/pieces/:id → `getPieceById()`
- POST /api/pieces → `createPiece()`
- PUT /api/pieces/:id → `updatePiece()`
- DELETE /api/pieces/:id → `deletePiece()`
- POST /api/pieces/:id/stock/adjust → `adjustPieceStock()`
- PUT /api/pieces/:id/stock → `setPieceStock()`
- GET /api/pieces/:id/stock/movements → `getPieceStockMovements()`

**Fields Gérés:**
- nom, reference, description
- prix_unitaire, stock, condition
- zone_geographique, marque, modele, categorie
- photo_url et historique des mouvements de stock

---

## Export Instructions

### To use in Lucidchart or Draw.io:
1. Copy PlantUML code above
2. Visit https://www.planttext.com/ or use your UML tool
3. Paste code → render

### To use locally:
```bash
# Install PlantUML
npm install -g plantuml

# Generate PNG/SVG
plantuml -o output UML_SEQUENCE_DIAGRAMS.md
```

### To use in VS Code:
- Install "PlantUML" extension by jebbs
- Preview PlantUML files directly in editor

---

**Generated:** May 8, 2026 | Project: pfe_Saif_Nouri
