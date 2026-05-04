# 📅 Système Amélioré de Gestion des Rendez-vous

## ✨ Nouvelles Fonctionnalités

### 1. Garagiste peut Proposer une Autre Date

**Situation:**
- Automobiliste propose une date/heure
- Garagiste la trouve non disponible
- **Garagiste peut proposer une alternative**

**Flux:**
1. Garagiste reçoit notification du rendez-vous
2. Clique sur la notification
3. Voit 3 options:
   - ✓ **Accepter** - Confirme la date proposée
   - ✕ **Refuser** - Rejette la demande
   - 📅 **Proposer une autre date** - Affiche un formulaire

**Formulaire de Contre-Proposition:**
```
- Nouvelle date (requise) - Min aujourd'hui
- Heure proposée (requise) - Entre 08:00 et 18:00
- Note ou justification (optionnel) - Explication pour l'automobiliste
```

**Exemple:**
```
Nouvelle date: 2026-05-08
Heure proposée: 15:30
Note: "Pas disponible le 05/05, mais nous pouvons vous accueillir le 08/05 à 15:30 pour la vidange."
```

---

### 2. Automobiliste reçoit la Contre-Proposition

**Notification envoyée à l'automobiliste:**
```
Titre: 📅 Contre-proposition de date
Corps: Le garage propose: [DATE] à [HEURE] - [NOTE]
```

**L'automobiliste peut alors:**
- Accepter la nouvelle date proposée
- Refuser et en proposer une autre
- Annuler la demande

---

## 🔄 Flux Complet Amélioré

```
ÉTAPE 1: Automobiliste crée RDV
┌─────────────────────────────────┐
│ Date proposée: 05/05 à 14:00    │
│ Service: Vidange                │
└────────────┬────────────────────┘
             │
             ↓ (notification envoyée)
             
ÉTAPE 2: Garagiste reçoit et voit 3 options
┌──────────────────────────────────┐
│ ✓ Accepter la date              │
│ ✕ Refuser la demande             │
│ 📅 Proposer une autre date       │
└────────┬─────────────────────────┘
         │
         ├─→ Si Accepter → Statut: Confirmé
         │                 Notification auto: ✓ Confirmé
         │
         ├─→ Si Refuser → Statut: Annulé
         │                 Notification auto: ✕ Annulé
         │
         └─→ Si Proposer une date:
                 ↓
             Form: date + heure + note
                 ↓
             Statut: Proposed
                 ↓ (notification envoyée)
                 
ÉTAPE 3: Automobiliste reçoit contre-proposition
┌──────────────────────────────────────────┐
│ 📅 Contre-proposition de date            │
│ Le garage propose: 08/05 à 15:30        │
│ "Pas disponible ce jour, mais nous..."   │
└─────────────────────────────────────────┘
```

---

## 📊 Statuts de Rendez-vous

| Statut | Couleur | Signification | Qui peut agir |
|--------|--------|---------------|--------------|
| ⏳ **Pending** | Amber | En attente de réponse du garagiste | Garagiste |
| ✓ **Confirmed** | Green | Accepté par le garagiste | Aucun (finalisé) |
| ✕ **Cancelled** | Red | Refusé ou annulé | Aucun (finalisé) |
| 📅 **Proposed** | Amber | Garagiste propose une date alternative | Automobiliste |

---

## 🔧 Modifications Techniques

### Backend Changes

#### 1. Validator (`appointmentValidator.js`)
```javascript
// Avant
VALID_STATUSES: ['pending', 'confirmed', 'cancelled']

// Après
VALID_STATUSES: ['pending', 'confirmed', 'cancelled', 'proposed']
STATUS_PROPOSED: 'proposed'
```

#### 2. Model (`appointment.model.js`)
```javascript
// Champs acceptés dans updateAppointment
validFields: [
  'appointment_date',
  'appointment_time',
  'status',
  'description',
  'notes',
  // ✨ NOUVEAUX:
  'proposed_date',
  'proposed_time',
  'proposed_note'
]
```

#### 3. Controller (`appointment.controller.js`)
```javascript
// Notification pour statut 'proposed'
if (newStatus === 'proposed') {
  title = `📅 Contre-proposition de date`;
  body = `Le garage propose: ${proposedDate} à ${proposedTime} - ${proposedNote}`;
}
```

#### 4. Migration (`add_proposed_fields_to_appointments.sql`)
```sql
ALTER TABLE appointments 
ADD COLUMN proposed_date DATE,
ADD COLUMN proposed_time TIME,
ADD COLUMN proposed_note TEXT;
```

### Frontend Changes

#### 1. AppointmentNotificationModal.jsx
```javascript
// Props ajoutés
- userRole: 'garage' | 'automobiliste'
- onAction: callback pour les actions

// États ajoutés
- showProposal: boolean
- proposalDate: string
- proposalTime: string
- proposalNote: string

// Boutons pour garagiste (si pending)
- ✓ Accepter
- ✕ Refuser
- 📅 Proposer une autre date
```

#### 2. Garage Appointments Page
```javascript
// Passé userRole="garage"
// Implémenté handleProposalAction
```

#### 3. Automobiliste Appointments Page
```javascript
// Passé userRole="automobiliste"
```

---

## 📱 Interface Utilisateur

### Garagiste - Vue Modal de Notification

```
┌─────────────────────────────────────┐
│ ✗ Nouveau rendez-vous de Jinan Ar... │
│                                     │
│ 📅 2026-05-05 à 08:00               │
│ 🔧 mécanique générale               │
│ Status: ⏳ En attente                │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ✓ Accepter │ ✕ Refuser       │   │
│ ├───────────────────────────────┤   │
│ │ 📅 Proposer une autre date    │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Garagiste - Formulaire de Proposition

```
┌──────────────────────────────────────┐
│ Proposer une autre date              │
│ La date proposée n'est pas dispo...? │
│                                      │
│ Nouvelle date * ────────────────────│
│ [2026-05-08]                         │
│                                      │
│ Heure proposée * ──────────────────│
│ [15:30]                              │
│                                      │
│ Note (optionnel) ──────────────────│
│ [Pas disponible ce jour...]          │
│                                      │
│ [Annuler] [Envoyer la proposition]   │
└──────────────────────────────────────┘
```

---

## 🔔 Notifications Envoyées

### Notification 1: Nouvelle Demande (Auto → Garage)
```json
{
  "type": "appointment",
  "title": "Nouveau rendez-vous de [Automobiliste Name]",
  "body": "2026-05-05 à 08:00 - mécanique générale",
  "actionable": true
}
```

### Notification 2: Acceptation (Garage → Auto)
```json
{
  "type": "appointment",
  "title": "✓ Rendez-vous confirmé",
  "body": "2026-05-05 à 08:00 - mécanique générale",
  "actionable": false
}
```

### Notification 3: Contre-Proposition (Garage → Auto)
```json
{
  "type": "appointment",
  "title": "📅 Contre-proposition de date",
  "body": "Le garage propose: 2026-05-08 à 15:30 - Pas disponible ce jour...",
  "metadata": {
    "proposed_date": "2026-05-08",
    "proposed_time": "15:30",
    "proposed_note": "Pas disponible ce jour..."
  }
}
```

---

## 🧪 Scénario de Test Complet

### Acte 1: Automobiliste Crée RDV
```
1. Login automobiliste
2. Page "Mes rendez-vous"
3. Remplir:
   - Garage: Al-alati
   - Date: 05/05 (dans 2 jours)
   - Heure: 14:00
   - Service: Vidange
   - Desc: "Vidange et changement filtre"
4. Cliquer "Réserver"
✓ Notification: "Rendez-vous réservé"
✓ RDV visible, statut: ⏳ En attente
```

### Acte 2: Garagiste Reçoit Notification
```
1. Login garagiste (propriétaire Al-alati)
2. Voir notification: "Nouveau rendez-vous de Jinan Ar..."
3. Cliquer sur notification → Modal s'ouvre
4. Voir les 3 options
```

### Acte 3: Garagiste Propose une Alternative
```
1. Cliquer "📅 Proposer une autre date"
2. Form s'ouvre
3. Remplir:
   - Nouvelle date: 08/05
   - Heure: 15:30
   - Note: "Pas disponible 05/05. Disponible 08/05?"
4. Cliquer "Envoyer la proposition"
✓ Statut change: Proposed
✓ Notification envoyée à automobiliste
```

### Acte 4: Automobiliste Reçoit la Proposition
```
1. Login automobiliste
2. Voir notification: "📅 Contre-proposition de date"
3. Message: "Le garage propose: 08/05 à 15:30"
4. Options:
   - Accepter la nouvelle date
   - Refuser et proposer une autre
   - Annuler
```

### Acte 5: Automobiliste Accepte
```
1. Cliquer "Accepter"
✓ Statut: Confirmé
✓ Rendez-vous finalisé pour 08/05 à 15:30
✓ Notification: "✓ Rendez-vous confirmé"
```

---

## 🛡️ Sécurité

1. **Role-based:** Seul garagiste peut proposer une date
2. **Ownership:** Vérifie que c'est le garagiste du garage
3. **Validation:** Date min = aujourd'hui, heure = 08:00-18:00
4. **Notifications:** Sécurisées avec userId verification

---

## 📡 API Endpoints

### Créer/Mettre à jour RDV
```
PATCH /api/appointments/:id
Body: {
  status: "proposed",
  proposed_date: "2026-05-08",
  proposed_time: "15:30",
  proposed_note: "Note optionnelle"
}
```

### Récupérer Notifications
```
GET /api/notifications
GET /api/notifications?onlyUnread=true
```

---

## ✅ Checklist de Déploiement

- [ ] Migration SQL exécutée
- [ ] Backend redémarré
- [ ] Frontend rechargé
- [ ] Tester flux complet avec 2 utilisateurs
- [ ] Vérifier notifications envoyées
- [ ] Tester tous les statuts: pending → proposed → confirmed
- [ ] Vérifier messages d'erreur
- [ ] Tester validation date/heure

---

**Status:** ✅ IMPLÉMENTATION COMPLÈTE
**Date:** 04/05/2026
