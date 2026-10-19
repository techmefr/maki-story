# Tâches — Maki Story

Format : `- [ ]` à faire, `- [x]` fait. Une tâche = une branche. Prendre la première non bloquée.

## Phase 0 — Audit et cadrage

- [x] Audit du dépôt (OSDD et atomic)
- [x] Architecture cible et modèle de données
- [x] Décisions du 2026-10-03 (code enfant, coffre, messages adultes, pages sans maquette, adaptatif)
- [ ] Points ouverts restants de `docs/MEMORY.md`
- [ ] Réécrire `CLAUDE.md` et `docs/` dans le dépôt

## Phase 1 — Spécifications

- [x] Une spécification par domaine (14) : règles, états, cas limites, tests attendus

## Phase 2 — Fondations

- [x] Installer `nuxt-osdd`, créer les couches `technical/` et `functional/`, déclarer la config
- [x] Ranger le code existant par domaine, un domaine à la fois, sans changer le comportement
- [x] Renommer au singulier, étendre le lint à `any`
- [x] Migrations : plan des numéros en double, puis `0019` et suivantes
- [x] Tokens et thème (Theme), clair et sombre, avec passage RGAA des contrastes
- [x] Contrôle automatique des contrastes dans `scripts/design-audit.ts`
- [x] 9 atomes
- [x] 8 molécules
- [x] Sons soundcn et mouvement (existants conservés et vérifiés)
- [x] Aligner `scripts/design-audit.ts` sur `docs/DESIGN.md`

## Phase 3 — Accès

- [ ] Account : onboarding, légal, connexion, lien magique, code oublié, permissions, compte
- [ ] Profile : codes chiffres (adulte) et formes (enfant, 4 à 6), menu et modification
- [ ] Family : création, choix, gestion (codé et relu mobile sombre ; clair et large à relire)
- [ ] Invitation : ajout de proche, rejoindre, profil proche (codé et relu mobile sombre ; clair et large à relire)
- [ ] Lock : contrôle parental, écran verrouillé (codé ; écran verrouillé à relire en vrai verrouillage)

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
- [ ] Builds Capacitor : iOS, Android, PWA, Android TV (état et marche à suivre dans `docs/capacitor.md` ; aucun build natif possible dans l'environnement actuel)
- [ ] Poids pour Madagascar (Opus 24 kbit/s, WebP 1200 px et reprise d'envoi déjà en place ; mesures à faire, voir `docs/capacitor.md`)
- [ ] Vérification finale écran par écran
- [x] Création de livre par étapes : couverture, pages avec ou sans voix, voix et personnages créés ensemble, brouillon serveur, vérification et envoi (#169, #180) ; reste : langue par voix, traduction IA à la création
- [x] Mascotte : poses intégrées aux états vides, erreurs, lecteur enfant et envoi
- [x] Limites de l'offre gratuite (12 livres, 8 adultes) ; reste : Stripe, codes promo, parrainage


- [x] 2026-10-16 : maquette adulte navigable responsive, six écrans et profils parent/proche, disponible sous `/maquettes/adultes.html`.

- [x] 2026-10-16 : premier lot visuel adulte intégré ; lint, typage, audits, build, 36 tests unitaires, 8 E2E ciblés et migrations de test validés. Suivi et suite : #189, `docs/ADULT-HANDOFF.md`.

- [x] 2026-10-16 : finitions adultes (messages, coffre, revue) et lot enfant (maquette six vues, accueil, bibliothèque, navigation, coffre, petits écrans de lecture/verrouillage). Validation combinée : 86 scénarios E2E couverts avec reprise du studio, quatre contrôles tactiles supplémentaires et audits/build/unitaires verts. Publication unique suivie dans #191.

## Lot accès — reprise du 2026-10-18

- [x] #146 : codes adultes/enfants, bornes serveur, hachage, limitations et réinitialisation parent ; tests mobile/ordinateur.
- [ ] #145 : compte et authentification, avec Supabase (#193).
- [ ] #147 : validation des cinq écrans de profil.
- [ ] #148 : famille et invitations, corrections et validation des six écrans.
- [ ] #149 : plages de verrouillage dans la journée et de nuit, validation des écrans.

- 2026-10-19 : ordre utilisateur actuel : corrections CI, adultes, écrans communs, enfants. Aucune exécution E2E ; aucune modification, PR ou fusion vers main pendant ce lot. Travail et clôtures par tâche sur dev ; publication regroupée ultérieure. Correction CI suivie dans https://github.com/techmefr/maki-story/issues/195.

- [x] 2026-10-19 : #195 corrections des régressions consignées par la CI (sélecteur de création, largeur du composeur et retour à la ligne des actions). Lint, typage et build réussis. Aucun E2E exécuté sur consigne utilisateur ; leur confirmation reste différée, la CI distante historique n’est pas déclarée verte.

- [x] 2026-10-19 : #159 accueil réel adulte en sections (demandes, propositions, corrections, bibliothèque), flux multi-famille des proches et catégories ; navigation après sélection de famille. Lint, typage, i18n et build réussis ; aucun E2E lancé.

- [x] 2026-10-19 : #155 bibliothèque avec cartes encadrées, couvertures réelles, auteur/statut, recherche/filtres corrigés, détail avec progression et voix, accès enfant par cartes de livres. Création guidée couverture/pages/envoi conservée selon les décisions du 2026-10-15. Lint, typage et build réussis ; aucun E2E exécuté.

- [x] 2026-10-19 : #156 audit de l’existant : TagManager/TagEditorSheet reprennent la maquette, noms par langue de famille et avertissements de traduction ; tagLabel applique langue choisie → anglais → slug, identifiants contrôlés serveur. Fonctions et tests de repli présents. Compilation/typage du lot valident ces composants ; aucun E2E ni nouveau test exécuté.

- [x] 2026-10-19 : #157 studio réel : page/scans et personnages visibles par défaut, carte de prise lisible, identité de la voix, sélection/navigation par page avec verrou pendant l’enregistrement ou une prise non envoyée. Préécoute/envoi/annulation/TTS existants conservés. Lint, typage et build réussis ; aucun E2E lancé.

- [x] 2026-10-19 : #158 revue parent réelle regroupée par pages, résumé/progression visibles, écoute et décisions approuver/refaire accessibles sur chaque réplique. Différences, commentaires, langues et gardes de validation conservés. Lint, typage et build réussis ; aucun E2E exécuté.

- [x] 2026-10-19 : Compte : connexion responsive avec identité Maki et formulaire encadré ; consentement légal sticky avec hauteur bornée. Périmètre visuel vérifié par lint/typage/build. Authentification Supabase reste ouverte dans #193 et #145 ; aucun E2E.

- [x] 2026-10-19 : #148 famille/invitations : choix en grille adaptative, cartes souples et actions de gestion groupées. Création, invitation, jonction et profil proche existants conservés. Gardes serveur relues : refus de suppression de son profil et maintien du dernier parent.

- [x] 2026-10-19 : #149 contrôle parental : panneaux encadrés, onglets enfants espacés, horaires par pas de 30 minutes et fenêtres traversant minuit. Fuseau de règle conservé à la modification et hors ligne ; autorité serveur et déverrouillage parent de 30 minutes existants conservés. 8 tests unitaires horaires réussis, lint/typage/build réussis ; aucun E2E.

- [x] 2026-10-19 : #161 aide et erreurs : FAQ existante, contact conditionnel, six états illustrés avec fond par état et badge HTTP encadré ; bandeau hors ligne dans le flux avant la page, sans recouvrir navigation/envoi, bouton relance tactile. Lint/typage/build réussis ; aucun E2E.
