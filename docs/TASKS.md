# Tâches — Tantara

Format : `- [ ]` à faire, `- [x]` fait. Une tâche = une branche. Prendre la première non bloquée.

## Phase 0 — Audit et cadrage

- [x] Audit du dépôt (OSDD et atomic)
- [x] Architecture cible et modèle de données
- [x] Décisions du 2026-10-03 (code enfant, coffre, messages adultes, pages sans maquette, adaptatif)
- [ ] Points ouverts restants de `docs/MEMORY.md`
- [ ] Réécrire `CLAUDE.md` et `docs/` dans le dépôt

## Phase 1 — Spécifications

- [ ] Une spécification par domaine (14) : règles, états, cas limites, tests attendus

## Phase 2 — Fondations

- [ ] Installer `nuxt-osdd`, créer les couches `technical/` et `functional/`, déclarer la config
- [ ] Ranger le code existant par domaine, un domaine à la fois, sans changer le comportement
- [ ] Renommer au singulier, étendre le lint à `any`
- [ ] Migrations : plan des numéros en double, puis `0019` et suivantes
- [ ] Tokens et thème (Theme), clair et sombre, avec passage RGAA des contrastes
- [ ] Contrôle automatique des contrastes dans `scripts/design-audit.ts`
- [ ] 9 atomes
- [ ] 8 molécules
- [ ] Sons soundcn et mouvement
- [ ] Aligner `scripts/design-audit.ts` sur `docs/DESIGN.md`

## Phase 3 — Accès

- [ ] Account : onboarding, légal, connexion, lien magique, code oublié, permissions, compte
- [ ] Profile : codes chiffres (adulte) et formes (enfant, 4 à 6), menu et modification
- [ ] Family : création, choix, gestion
- [ ] Invitation : ajout de proche, rejoindre
- [ ] Lock : contrôle parental, écran verrouillé

## Phase 4 — Cœur enfant

- [ ] Message : envoi par adulte et par enfant, limite de 5, expiration 24 h, purge planifiée
- [ ] Vault : coffre enfant et adulte, limite de 10
- [ ] Reading : lecture multivoix, progression
- [ ] Accueil Enfant

## Phase 5 — Proche et parent

- [ ] Book : bibliothèque, détail, ajout, accès par enfant
- [ ] Tag : tags multilingues
- [ ] Recording : studio page par page, enregistrement
- [ ] Review : revue parent, validation
- [ ] Accueil Proche, Catégorie

## Phase 6 — Finitions

- [ ] Notification : in-app et e-mail quotidien, 9 e-mails
- [ ] Help : aide, états d'erreur, hors ligne
- [ ] Pages sans maquette, dans le même style : activité, appareils, corbeille, stockage, grimace, traduction
- [ ] Builds Capacitor : iOS, Android, PWA, Android TV
- [ ] Poids pour Madagascar
- [ ] Vérification finale écran par écran
