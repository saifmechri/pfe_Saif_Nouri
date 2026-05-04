# Tests - Gestion Rendez‑vous

But
- Fournir des étapes et exemples pour tester les endpoints CRUD rendez‑vous et la disponibilité des garages.

Pré-requis
- Avoir une base Postgres accessible et les variables d'environnement du backend configurées.
- Installer les dépendances et lancer le serveur depuis le dossier `backend`:

```bash
npm install
npm start
```

Authentification
- Tous les endpoints protégés attendent un header `Authorization: Bearer <token>`.
- Utiliser un token d'un utilisateur avec le rôle `automobiliste` pour créer des RDV, et `garage`/`admin` pour certaines opérations.

Endpoints principaux à tester

- Lister les RDV (pour l'utilisateur connecté)

```
GET /api/appointments?limit=20&offset=0
Headers: Authorization: Bearer <token>
```

- Voir le détail d'un RDV depuis une notification

```
GET /api/appointments/:id
Headers: Authorization: Bearer <token>
```

Réponse attendue: `data.appointment`, `data.automobiliste`, `data.garage`.
Ce point sert au parcours: clic sur une notification -> ouverture de la page détail RDV -> confirmation ou refus.

- Créer un RDV (automobiliste)

```
POST /api/appointments
Headers: Authorization: Bearer <automobiliste-token>
Body JSON:
{
  "garageId": 123,
  "appointmentDate": "2026-05-10",
  "appointmentTime": "10:00",
  "description": "Controle freins"
}
```

Réponse attendue: statut `201` et objet `appointment` dans `data`.

- Mettre à jour un RDV

```
PATCH /api/appointments/:id
Headers: Authorization: Bearer <token>
Body JSON: { "status": "confirmed" }
```

Pour le garage:
- `status = confirmed` pour valider la réservation.
- `status = cancelled` pour refuser/annuler la réservation.

Réponse attendue: `200` avec le RDV mis à jour.

- Supprimer un RDV

```
DELETE /api/appointments/:id
Headers: Authorization: Bearer <token>
```

- Vérifier disponibilités d'un garage

```
GET /api/garages/:id/availability?date=2026-05-10&slotMinutes=60
Headers: Authorization: Bearer <any-token-or-public>
```

Réponse attendue: `data.slots` tableau d'objets `{ start, end, available }`.

Vérifications DB utiles
- Vérifier la table `appointments`:

```sql
SELECT id, automobiliste_user_id, garage_id, appointment_date, appointment_time, status
FROM appointments
WHERE garage_id = 123 AND appointment_date = '2026-05-10';
```

- Vérifier notifications liées (si applicable):

```sql
SELECT * FROM notifications WHERE reference_id = <appointmentId> ORDER BY created_at DESC;
```

Cas de test recommandés
- Création simple (slot libre) → `201`, notification créée pour le garage.
- Création sur créneau déjà pris → comportement actuel: création autorisée (vérifier règle métier souhaitée).
- Notification RDV → clic sur la notification, ouverture de la page détail, affichage du RDV en grand format.
- Acceptation garage → `PATCH /api/appointments/:id` avec `status = confirmed`.
- Refus garage → `PATCH /api/appointments/:id` avec `status = cancelled`.
- Proposition de nouvelle date par le garage → `PATCH /api/appointments/:id` avec `status = proposed`, `proposed_date`, `proposed_time`, `proposed_note`.
- Acceptation par l'automobiliste de la date proposée → `PATCH /api/appointments/:id` avec `status = confirmed` et notification envoyée au garage pour lui demander de confirmer ou refuser la réservation.
- Refus par l'automobiliste de la date proposée → `PATCH /api/appointments/:id` avec `status = cancelled` et notification dédiée envoyée au garage pour proposer une autre date si nécessaire.
- Annulation → `status = cancelled` et notification d'annulation.
- Disponibilités: garage avec `work_hours` invalide → fallback `09:00-17:00`.
- Validation: requête sans `date` pour disponibilité → `400`.

Automatisation (optionnel)
- Ajouter des tests d'intégration avec `jest` + `supertest` dans `backend/tests`.
- Exemple de commande: `npm run test:integration` (ajouter script si nécessaire).

Notes
- Le controller de disponibilité utilise un parsing simple de `work_hours` au format `HH:MM-HH:MM`.
- Si vous voulez que la création de RDV bloque réellement un créneau, il faut ajouter une vérification côté `appointmentService` avant la création.
