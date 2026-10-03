# Help

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Aide, Etat Erreur (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Aide : réponses courtes, sans emoji, accessibles hors ligne.
- États d'erreur : hors ligne, mise à jour, erreur, 404, 403, 500, chacun avec une action claire.
- Les erreurs serveur sont journalisées (journal append-only) sans données personnelles.

## États

- Hors ligne, mise à jour disponible, erreur, introuvable, interdit, serveur.

## Cas limites

- Perte de connexion en plein enregistrement : file d'attente visible.

## Données

journal d'erreurs (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/errors`, `useConnectivity`, `useFeedback`

## Tests attendus

- Chaque code d'erreur affiche son écran.
- Le mode hors ligne reste utilisable pour les livres téléchargés.

## Validation

- [ ] Relue par Gaëtan
