# Invitation

Type: functional

Spécification du domaine, à valider avant le code (voir `docs/ARCHITECTURE.md` et `docs/RULES.md`).

## Écrans

Ajouter Proche, Rejoindre, Profil Proche (fichiers `docs/maquettes/<Écran>.dc.html`).

## Règles

- Invitation par e-mail ou par code (lien, WhatsApp, SMS) ; le parent choisit le canal par proche.
- Code de 6 caractères, valable 48 h, usage unique.
- Un parent gère le proche invité : rôle, enfants concernés, retrait.
- Un proche peut rejoindre plusieurs familles avec le même profil.

## États

- Envoyée, vue, acceptée, expirée, révoquée.

## Cas limites

- Code saisi deux fois.
- Invité sans compte Google (Madagascar) : passe par le lien magique.

## Données

Invitation, Membership (modèle complet dans `docs/ARCHITECTURE.md`).

## Code existant à reprendre

`server/api/invitations`, `useInvitations`, `useRelativeFlow`

## Tests attendus

- Un code expiré ou déjà utilisé est refusé.
- Rejoindre une seconde famille ajoute un `Membership` sans doublon.

## Validation

- [ ] Relue par Gaëtan
