# Utils

Le dossier `utils` contient des fonctions transverses reutilisables:

- `apiResponse.js`: format de reponse API homogene
- `appError.js`: type d erreur applicative
- `logger.js`: journalisation centralisee
- `algorithms.js`: calculs metier techniques (scores, distance, etc.)

Regle:

- ne pas inclure d acces HTTP direct ni de SQL metier ici.
