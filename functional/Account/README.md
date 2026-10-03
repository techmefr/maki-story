# Account

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Onboarding, Legal, Connexion, Lien Magique, Code Oublie, Permissions, Compte (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Connexion par lien magique (15 min, usage unique, haché) et Google, toujours actifs ; autres fournisseurs selon `AllowedProvider` de la famille.
- Consentements (légal) acceptés avant de continuer ; version et date enregistrées.
- Code oublié : un adulte réinitialise par e-mail ; un enfant par un parent.
- Permissions : micro, notifications, caméra demandées au moment du besoin, jamais avant une action de l'utilisateur.
- Compte : export des données et suppression de la famille entière, décidés par un parent seulement.

## États

- Déconnecté, lien envoyé, lien expiré, lien déjà utilisé, connecté.

## Cas limites

- Lien ouvert sur un autre appareil.
- E-mail verrouillé (`emailLocked`).
- Suppression : confirmation par code, délai de grâce de la corbeille.

## Données

Account, MagicLink, AllowedProvider (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/auth`, `server/api/access`, `useSession`, `useAccess`, `useBiometric`

## Tests attendus

- Un lien magique ne sert qu'une fois et expire à 15 min.
- Un fournisseur non autorisé est refusé côté serveur.
- L'export contient livres, enregistrements et messages de la famille.

## Validation

- [ ] Relue par Gaëtan
