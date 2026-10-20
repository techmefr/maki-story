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

- [x] Notification : in-app et e-mail quotidien, 9 e-mails ; activation fournisseur/cron et domaine suivis dans #194.
- [x] Help : aide, états d’erreur, hors ligne
- [x] Pages sans maquette, dans le même style : activité, appareils, corbeille, stockage, grimace, traduction
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
- [x] #145 : sept écrans de compte intégrés ; migration Supabase distincte encore ouverte (#193).
- [x] #147 : cinq écrans de profil intégrés et contrôlés hors E2E.
- [x] #148 : famille et invitations intégrées sur dev.
- [x] #149 : verrouillage intégré, passage de minuit et fuseau corrigés.

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

- [x] 2026-10-19 : #145 Écrans Account intégrés : connexion et confirmation d’envoi encadrées ; lien magique avec attente animée, succès et action Continuer, expiration, lien déjà utilisé et erreurs réseau distinctes. Titres de succès dans les neuf langues. Onboarding, légal/consentements, code oublié, permissions et compte/export/suppression existants audités et conservés. La clôture concerne les sept écrans et le backend actuel ; la migration Supabase reste explicitement ouverte dans #193, sans activation de production.

- [x] 2026-10-19 : #147 Cinq écrans Profile audités : grille de choix avec rôles/couleurs, menu de préférences existant, édition du profil, pavé chiffres et pavé formes. E-mail et lien de compte visibles directement dans l’édition ; lien /account accessible aussi au proche. Formes et emplacements flexibles sur petit écran, déverrouillage centré et borné. Codes, hachage, biométrie et gardes serveur existants conservés.

- [x] 2026-10-19 : #162 Composition des pages annexes consignée dans cette issue avant intégration : en-tête à pictogramme pastel, titres Fredoka, cartes papier, filtres en pastilles et confirmations en feuille. Appliquée à l’activité famille/livre, appareils, corbeille, stockage, grimace et traduction. Le parcours grimace utilise maintenant le service photo du profil, bloque les doubles envois et affiche l’échec ; aucune modification des règles de restauration, révocation ou traduction.

- [x] 2026-10-19 : #160 Notifications : liste lisible avec métadonnées sur une seconde ligne, page /notifications/settings réelle, canaux dans l’application/push/e-mail, sauvegardes sérialisées et erreurs visibles. Liste et compteur de cloche filtrés par préférence IN_APP ; push indépendant. Digest quotidien ajouté : réservation SQL unique par compte et jour UTC avant tout appel fournisseur, relecture des préférences et des appartenances actives, rétention, groupement et limite de dix lignes. Tâche Nitro et cron Vercel à 07:00 UTC protégés par CRON_SECRET. Neuf mails transactionnels + digest contrôlés en HTML/texte français et anglais ; aucun mail réel envoyé. Activation du cron et du fournisseur à configurer lors de la publication future ; domaine/expéditeur restent dans #194. Les tests unitaires couvrent la concurrence du moteur et le rendu ; aucun test E2E ou intégration avec un fournisseur réel.

- [x] 2026-10-19 : #153 écoute enfant pour livre papier : portrait réel et nom seul, sans texte ni image du livre ; reprise page/ligne/audio normalisée, halo du bouton suivant en fin de page, titre borné, choix des langues et minuterie conservés.
- [x] 2026-10-19 : #154 nouvelle DA enfant validée depuis le splashscreen, appliquée au shell, accueil/contacts, bibliothèque, coffre, messages et verrouillage. Décor dédié, bois et actions dorées, poses Maki ; alerte du coucher avec montre. Vérifications portrait/paysage et de 320 px à 4K sur captures de composants réels avec données de démonstration ; aucun E2E.
- [ ] #150/#152 : correctifs messages/coffre inclus et unités réussies ; validation d'intégration PostgreSQL des transactions concurrentes encore à faire (base locale indisponible). Garder ces issues ouvertes jusqu'à cette vérification.

- [x] 2026-10-19 : #150/#152 vérification PostgreSQL réelle : douze connexions concurrentes, exactement cinq messages par conversation dans chaque sens et dix favoris par personne ; suppression du plus ancien et mise au coffre libèrent une place. Messages expirés exclus même avant purge.
- [x] 2026-10-19 : #163 audit des formats portrait/paysage, titres/noms longs et focus ; corrections lecteur et pavé PIN. Voir docs/adaptatif.md.
- [x] 2026-10-19 : #165 checklist écran par écran dans docs/FINAL-SCREEN-AUDIT.md ; preuves source/capture distinguées, aucun E2E.
- [x] 2026-10-19 : #164 projets Android/TV et iOS créés, compilations Android sans GMS/Firebase et iOS simulateur réussies, PWA générée ; reprise d'upload vérifiée et finalisation idempotente, repli AAC et décodage photo, médias multivoix hors ligne. Lot final vérifié dans Native build 39260176371, intégralement réussi.
- [x] #193 : adaptateur Supabase serveur préparé et testé avec le SDK simulé, migration progressive et rattachement sûr. Fournisseur legacy toujours actif par défaut. Suppression distante autorisée le 2026-10-19 et implémentée avec file transactionnelle/reprise quotidienne. Test réel Supabase réussi sur identité jetable (création, connexion, changement de mot de passe, suppression répétable). Livré sur dev (6ee2a03), builds 39263493179 réussis, issue fermée ; activation de production distincte et toujours désactivée.
- [ ] #194 : domaine et e-mails reportés explicitement par Gaëtan ; ne pas relancer ce chantier avant sa demande.

- [x] 2026-10-19 : #166 clôturée après vérification de la fermeture des 45 sous-issues #121–#165 et synchronisation des cases. #194 reste reportée ; les idées ultérieures restent ouvertes.

- [x] #198 : correctif du chemin de génération du service worker Vercel ; trois tests de régression passent, build Vercel corrigé passe ; MR #199 publiée, Vercel success et HTTP public/worker vérifiés.
- [ ] #197 : lot E2E/Driver.js séparé après publication ; 14 tests de visite mobile/desktop réussis, suite globale encore à vérifier.

- [x] #200 : corrections enfant publiées par MR #202 (main 0619cff8) ; Vercel success, asset portrait et styles publics vérifiés. Contrôles ciblés documentés ; audit RGAA complet #201 toujours ouvert.
- [ ] #201 : audit RGAA complet, lecteur d’écran et applicabilité/alternatives audio ; ne pas annoncer de conformité globale avec les seuls tests automatiques.

- [x] #203 : salutation adulte pleine largeur et actions distinctes ; quatorze rendus validés, MR #204 publiée, Vercel success et stylesheet public vérifié.

- [ ] #205 : forêt conservée +six nouvelles feuilles Ravenala indépendantes ; pause/persistance/réduction des mouvements et30rendus vérifiés, sauvegarde surdev et aperçu animé ; revue visuelle avant publication.


## 2026-10-20 — Authentication presentation (#206)
Shared responsive AuthShell for login/register: cream and gold illustrated brand panel, white form panel, persistent login labels, mobile single column. Authentication behavior unchanged. Local guest preview http://localhost:4023/login and /register. Ten actual renders (320, landscape 844, desktop 1440, 4K, max text) without horizontal overflow or JavaScript errors. Lint/typecheck and 79 unit tests pass. Visual review pending; no main release. Artifacts: /home/gaetan/artifacts/maki-auth-2026-10-20.

- [x] #207 — Local isolated demo seeder, five-profile dropdown, server guard and child preview validated.

- [x] #208 — 268 page/state renders and 15 accessibility checks, auth entry screens coherent, child photo forest, accessible keyboard tabs; full verify + Vercel build pass. Publication authorized, grouped release pending.
