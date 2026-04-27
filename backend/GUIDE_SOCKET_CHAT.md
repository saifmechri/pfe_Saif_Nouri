# GUIDE Socket.io Chat Temps Reel (Backend)

Ce guide decrit la messagerie backend avec persistance PostgreSQL/Supabase.

## Cas couverts

- Chat automobiliste <-> garage
- Chat automobiliste <-> vendeur

Les conversations garage <-> vendeur, garage <-> garage, vendeur <-> vendeur ne sont pas autorisees.

## Stockage en base

Le backend cree/maintient ces tables:

- `chat_conversations`
  - `conversation_type`: `automobiliste_garage` ou `automobiliste_vendeur`
  - `automobiliste_user_id`
  - `garage_id` (si chat auto-garage)
  - `vendeur_user_id` (si chat auto-vendeur)
  - `created_by_user_id`, `last_message_at`, timestamps

- `chat_messages`
  - `conversation_id`
  - `sender_user_id`
  - `content`
  - `client_message_id`
  - `created_at`

Contrainte d unicite appliquee:
- 1 conversation unique par paire automobiliste-garage
- 1 conversation unique par paire automobiliste-vendeur

## Demarrage

```bash
npm install
npm run dev
```

Le schema chat est initialise dans `initDatabase()` au demarrage backend.

## Authentification Socket

JWT obligatoire a la connexion Socket.

Option recommandee:

```js
const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <JWT>'
  }
});
```

Option alternative: header `Authorization: Bearer <JWT>`.

## Variables d environnement utiles

- `PORT`: port HTTP/Socket (defaut `3000`)
- `SOCKET_PATH`: chemin Socket.io (defaut `/socket.io`)
- `SOCKET_CORS_ORIGIN`: origines autorisees (CSV)

Exemple:

```env
SOCKET_CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
SOCKET_PATH=/socket.io
```

## Evenements client

- `chat:conversations`
  - payload: `{ limit?, offset? }`
  - ack success: `{ ok: true, items: Conversation[] }`

- `chat:start`
  - but: creer ou recuperer une conversation autorisee
  - payload auto-garage:
    - automobiliste: `{ conversationType: 'automobiliste_garage', garageId }`
    - garage: `{ conversationType: 'automobiliste_garage', automobilisteId }`
  - payload auto-vendeur:
    - automobiliste: `{ conversationType: 'automobiliste_vendeur', vendeurId }`
    - vendeur: `{ conversationType: 'automobiliste_vendeur', automobilisteId }`
  - ack success: `{ ok: true, conversation, messages }`

- `chat:join`
  - payload: `{ conversationId, historyLimit? }`
  - rejoint la room de conversation si utilisateur autorise
  - ack success: `{ ok: true, conversation, messages }`

- `chat:history`
  - payload: `{ conversationId, limit?, beforeMessageId? }`
  - pagination historique
  - ack success: `{ ok: true, conversation, messages }`

- `chat:message`
  - payload: `{ conversationId, message, clientMessageId? }`
  - le message est valide, persiste en DB, puis diffuse
  - ack success: `{ ok: true, conversationId, messageId }`

- `chat:leave`
  - payload: `{ conversationId }`
  - ack success: `{ ok: true, conversationId }`

## Evenements serveur

- `chat:connected`
  - emis apres auth socket
  - payload: `{ socketId, user, connectedAt }`

- `chat:conversation_available`
  - notifie le destinataire qu une conversation existe/devient disponible
  - payload: `{ conversation }`

- `chat:new_message`
  - notification utilisateur ciblé pour nouveau message
  - payload: `{ conversationId, message }`

- `chat:user_joined`
  - emis dans la room conversation
  - payload: `{ conversationId, user, joinedAt }`

- `chat:user_left`
  - emis dans la room conversation
  - payload: `{ conversationId, user, leftAt }`

- `chat:message`
  - emis dans la room conversation apres insertion DB
  - payload: `{ conversationId, message }`

## Format d erreur ack

Tous les handlers Socket renvoient:

```json
{
  "ok": false,
  "error": "Message lisible",
  "code": "ERROR_CODE"
}
```
