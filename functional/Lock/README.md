# Lock

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Controle Parental, Ecran Verrouille (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Une règle de verrouillage par profil : jours, début et fin par pas de 30 minutes ; si la fin est avant le début elle tombe le lendemain.
- Fuseau horaire par règle (déjà géré par le dépôt) ; l'heure du serveur fait foi.
- Le verrou coupe une écoute en cours, après la fin de la page si prévu.
- Déverrouillage parent de 30 minutes (`unlockedUntil`) avec code.
- Les autres profils ne sont pas touchés.

## États

- Libre, verrouillé, déverrouillé temporairement.

## Cas limites

- Famille entre France et Madagascar.
- Application hors ligne : règle appliquée localement.

## Données

LockRule (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`useParental`, `useLockAfterPage`, `server/api/access`

## Tests attendus

- Fin avant début passe minuit.
- Le verrou coupe une écoute.
- Déverrouillage expiré après 30 minutes.

## Validation

- [ ] Relue par Gaëtan
