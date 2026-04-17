# Controllers

Les controleurs gerent l interface HTTP:

- lecture de `req.params`, `req.query`, `req.body`
- appel des services
- construction des reponses
- propagation des erreurs applicatives

Bonnes pratiques:

- garder les fonctions courtes
- aucune logique SQL complexe
- deleguer les regles metier aux services
- reutiliser `sendApiResponse` et `AppError`
