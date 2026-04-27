# GUIDE Socket.io Chat Temps Reel (Backend)

Ce guide explique les evenements Socket.io exposes par le backend.

## Demarrage

1. Installer les dependances backend:

```bash
npm install
```

2. Lancer le backend:

```bash
npm run dev
```

Le serveur Socket.io est demarre avec le serveur HTTP Express.

## Authentification Socket

Le backend exige un JWT valide a la connexion Socket.

Option 1 (recommandee): `auth.token`

```js
const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <JWT>'
  }
});
```

Option 2: header `Authorization: Bearer <JWT>`.

## Variables d environnement utiles

- `PORT`: port HTTP/Socket (defaut 3000)
- `SOCKET_PATH`: chemin Socket.io (defaut `/socket.io`)
- `SOCKET_CORS_ORIGIN`: origines autorisees, separees par virgule

Exemple:

```env
SOCKET_CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
SOCKET_PATH=/socket.io
```

## Evenements serveur

- `chat:connected`
  - emis apres connexion et auth valide
  - payload: `{ socketId, user, connectedAt }`

- `chat:user_joined`
  - emis a la room quand un utilisateur la rejoint
  - payload: `{ roomId, user, joinedAt }`

- `chat:user_left`
  - emis a la room quand un utilisateur la quitte
  - payload: `{ roomId, user, leftAt }`

- `chat:message`
  - emis a toute la room quand un message est envoye
  - payload: `{ id, clientMessageId, roomId, message, sender, createdAt }`

## Evenements client attendus

- `chat:join`
  - payload: `{ roomId }`
  - ack: `{ ok: true, roomId }` ou `{ ok: false, error }`

- `chat:leave`
  - payload: `{ roomId }`
  - ack: `{ ok: true, roomId }` ou `{ ok: false, error }`

- `chat:message`
  - payload: `{ roomId, message, clientMessageId? }`
  - la room doit etre rejointe avant envoi
  - ack: `{ ok: true, messageId }` ou `{ ok: false, error }`
