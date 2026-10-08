# Mémoire du projet — Tantara

Décisions prises et pièges connus. À relire avant une tâche, à compléter en fin de tâche (date, décision, raison).

## Décisions confirmées

- Stack gardée ; structure refaite en OSDD (couches `technical/` et `functional/`) et en atomic design.
- Code enfant : 4 à 6 formes parmi 6 touches, longueur choisie par l'enfant (décidé le 2026-10-03). Adultes : code à chiffres.
- Messages : chaque adulte laisse 5 messages au maximum à un même enfant ; accessible 24 h après la première écoute, puis supprimé sauf mis au coffre.
- Studio : création page par page conservée, certains champs deviennent optionnels.
- IA : reportée à plus tard ; seulement `Book.origin = manuel` prévu.
- Maquettes Claude Design : font foi pour l'interface et les règles métier.
- Un message mis au coffre ne compte plus dans les 5 de l'expéditeur (décidé le 2026-10-03).
- L'enfant peut aussi envoyer des messages audio : 5 au maximum par destinataire, même effacement 24 h après la première écoute sauf mis au coffre (décidé le 2026-10-03).
- Le coffre adulte garde les messages reçus d'un enfant, 10 au maximum (confirmé le 2026-10-03).
- Un enfant peut écrire à tous les adultes de sa famille (confirmé le 2026-10-03).
- Pas de messages entre adultes en dehors des demandes liées au livre (demande d'enregistrement, proposition de livre) ou à la revue (décidé le 2026-10-03).
- Pages sans maquette (activité, appareils, corbeille, stockage, grimace, traduction) : conçues dans le même style que le design system.
- Passage RGAA demandé (2026-10-03) : des couleurs se superposent parfois en clair et en sombre et rendent le texte illisible ; les deux thèmes sont gardés et les contrastes contrôlés (voir `docs/DESIGN.md`).
- Mise en page : vraie version adaptative (téléphone, tablette, ordinateur, Android TV), pas une colonne de 440 px étirée.

## Points ouverts

- Fuseau horaire du verrouillage : on reprend le fuseau par règle du dépôt actuel.
- Liste des champs optionnels du studio à valider.
- Écrans adaptatifs : points de rupture et navigation tablette, ordinateur et TV à dessiner (issue de mise en page).
- Migrations : les 18 existantes gardent leur nom (le migrateur suit le nom complet, pas le numéro, donc les 4 numéros en double sont sans effet). Aucune renumérotation. À partir de `0019`, chaque numéro est unique, contrôlé par `scripts/check-migrations.ts`.
- À compléter : vrai logo et favicon, textes juridiques à valider par un juriste, domaine, adresse postale, contact des e-mails.

## Pièges connus

- `nuxt-osdd` : couches à la racine (`/functional`, `/technical`), chacune avec son `app/` et son `server/`. Le README du paquet parle d'« Open Source Driven Development », la description npm d'« Operating System Dependency Design » : ne pas figer l'expansion du sigle.
- Les maquettes de `docs/maquettes/` remplacent celles de `design/` (Kalli). `deck-stage.js` et `support.js` servent seulement à ouvrir les maquettes, ne pas les reprendre dans l'app. Le logo `logo-maki.png` est provisoire.
- Vercel : un seul merge `dev` vers `main` par lot, sinon les déploiements se bloquent. Tout le reste va dans `dev`.
- GitHub : 100 push par jour au maximum. Pousser par tâche terminée, pas par petit changement.
- L'ancien `CLAUDE.md` était obsolète (Supabase, compte partagé, un seul message actif) ; il est remplacé.
- `server/utils/ai/` et 5 routes `server/api/ai` existent mais `aiCreationEnabled` est faux en production : isoler le domaine IA derrière son drapeau.
- 34 commits sur 52 contiennent un `Co-Authored-By` d'IA, contraire à `docs/RULES.md` ; ne pas en ajouter, ne pas réécrire `main` sans accord.
- `scripts/design-audit.ts` vérifie encore l'ancien design (voir `docs/DESIGN.md`).

## Journal

- 2026-10-03 : limite de 5 messages actifs par expéditeur et destinataire (adulte vers enfant, enfant vers adulte de la famille) dans une transaction avec verrou ; un message au coffre ne compte plus ; migration 0019 retire l'index d'unicité. Coffre adulte : une table `treasures` unique, `child_id` désigne le propriétaire du coffre (enfant ou adulte), 10 maximum, un adulte ne lit et ne supprime que le sien.
- 2026-10-03 : jetons clair/sombre, Nunito retirée (Fredoka seule ; le dépôt n'a que les graisses 500/600/700, pas la 400), audit de contraste.
- 2026-10-03 : audit refait avec le référentiel nuxt-osdd ; création de `CLAUDE.md` et `docs/`.
- 2026-10-03 : molécules génériques ajoutées (AppTabs, AppListRow, AppBottomSheet) ; ProfileCard, BookCard et le pavé de code restent dans leurs domaines (Profile, Book) car ils portent des données métier ; la feuille du bas passe à 32 px de rayon.
- 2026-10-03 : connexion refaite d'après la maquette (lien magique par défaut, mot de passe en second onglet) ; lien magique 15 min, usage unique, haché, migration 0020 ; « mot de passe oublié » renvoie vers le lien magique. Textes de connexion traduits en fr et en seulement, les autres langues retombent sur le français. Code oublié (profil) reste à faire avec le domaine Profile.
- 2026-10-03 : code enfant refait d'après la maquette : 6 formes (étoile, rond, cœur, carré, triangle, losange), 4 à 6 choisies par l'enfant puis OK ; numéros 0 (étoile) et 2 (cœur) conservés pour les codes existants, les autres formes remplacent lune, soleil, nuage, fleur.
- 2026-10-03 : sons et mouvements existants conservés tels quels (useSoundCues, useSoundSetting, réduction des animations respectée dans 104 fichiers) ; pas de refonte.
- 2026-10-03 : Family : écran Choix Famille (`/families`), assistant Creer Famille (`/families/new`, `POST /api/family`, nom du parent tiré de l'e-mail faute de champ dans la maquette), écran Famille regroupé par rôle avec retrait confirmé et connexions autorisées (`allowed_providers`, appliquées au retour OAuth ; Google reste toujours actif). Retrait de son propre profil refusé.
- 2026-10-03 : Invitation : valable 48 h (spec) au lieu de 72 h ; rôle parent ou proche choisi à l'invitation (colonne `invitations.role` existante) ; à l'inscription par invitation un code de profil de 4 à 8 chiffres est demandé ; la membership d'un parent invité porte `member_id` (permet de changer son rôle). Profil Proche : compteurs n/5 par enfant, familles, effacement du code, passage parent/proche, retrait. Un parent créé à l'inscription n'a pas de `member_id` dans `memberships` : son rôle ne peut pas être changé depuis Profil Proche.
- 2026-10-03 : Lock : la maquette décrit une plage de verrouillage (jours, de, jusqu'à, passe minuit) alors que le stockage garde des fenêtres ouvertes par jour ; `shared/utils/lockRule.ts` convertit dans les deux sens (testé), le serveur ne change pas. La fin du verrouillage doit être avant le début (passage minuit).
- 2026-10-03 : AppChip : l'état sélectionné était écrasé par `.chip` de main.css (même spécificité, ordre) ; corrigé avec `.chip.chip--on` scopé. Bouton Déconnexion de la page Profils : texte illisible en sombre (même cause), corrigé.
- Écart signalé : la maquette Rejoindre parle d'un code de 6 caractères ; le code d'invitation du dépôt en compte 10 (`INVITE_CODE_LENGTH`, partagé avec le partage de livres) : non modifié.
- Piège : `package.json` demande `pnpm@12.8.1` qui n'existe pas sur le registre ; lancer pnpm avec `npm_config_manage_package_manager_versions=false` (pnpm 10 local) ; ne pas commiter le `pnpm-lock.yaml` réécrit par cette installation.
- 2026-10-03 : lecteurs sans bouton pause (lecture d'histoire, écoute de message, lecture de livre, trésor) : le bouton principal est désactivé pendant l'écoute et sert à reprendre ou relire ; le test e2e 05-kid vérifie l'absence du bouton Pause. Coffre adulte : page `/vault` (accessible depuis Famille et depuis l'espace proche) sur la table `treasures`. Filtres de la bibliothèque : feuille « Filtres » avec compteur ; le filtre Statut de la maquette n'existe pas encore.
- Vérifié par lecture : la tâche `messages:purge` (03:00) existe et applique la règle des 24 h ; son déclenchement sur Vercel n'est pas vérifié.
- Base de test locale : PostgreSQL 14 (binaires système) dans le dossier temporaire de la session sur le port 5544, à recréer à chaque session (`initdb`, `createdb tantara_e2e`).
- 2026-10-03 : Accès Livres : migration 0053 (`members.books_restricted`, table `book_access`), routes `/api/members/:id/book-access`, filtre appliqué dans `bookScope` pour l'enfant (sans sélection : tous les livres validés ; avec sélection : seulement ceux-là). Écran `/family/books`. Ajouter Livre (ISBN, scan, recherche en ligne) pas fait : demande une source externe de métadonnées (par ex. Open Library) à valider.
- 2026-10-03 : Studio : le serveur refuse (400) une langue de voix que personne de la famille ne parle (création et modification d'un livre) ; la langue écrite reste libre. Titre, couleur du personnage et texte des répliques étaient déjà imposés par le serveur. Même contrôle non appliqué aux tags : leur slug anglais exige une entrée en anglais même si la famille ne le parle pas (à trancher). Les specs e2e 23-birth-date et 26-review-stale-languages déclarent maintenant les langues parlées.
- 2026-10-03 (décisions de Gaëtan) : recherche ISBN par Open Library (page `/books/isbn`, route `/api/books/isbn/:isbn`, migration 0055 `books.isbn` et `cover_url`, scan par BarcodeDetector quand le navigateur le gère, saisie manuelle en repli) ; code d'invitation ramené à 6 caractères (valable 48 h, usage unique ; les anciens codes de 10 restent valides) ; le premier parent saisit prénom, nom et nom affiché (migration 0054) ; tag : le nom dans la langue choisie, sinon le nom anglais, sinon le slug (déjà le comportement) ; la bibliothèque se filtre par nos tags et par statut.
- Demande de Gaëtan non exécutée : récrire l'historique (retirer les Co-Authored-By d'IA, tous les commits au nom de techmefr, push forcé). L'environnement a bloqué la commande ; à lancer par Gaëtan, voir le compte rendu de session.
- 2026-10-03 : e-mails : modèles HTML de `technical/Mail` branchés sur welcome (inscription), code_reset (nouveau code), account_deleted (suppression) en plus de magic_link, invitation et du récapitulatif (new_voice, review_request, corrections). Pas branché : export_ready, car l'export est un téléchargement direct sans lien daté. Variables : `SUPPORT_EMAIL` (e-mails) et `NUXT_PUBLIC_SUPPORT_EMAIL` (page Aide ; sans valeur, le bouton « Écrire au support » est masqué). Domaine, adresse postale et contact restent à fournir.
- 2026-10-03 : traductions : les 454 clés récentes sont traduites dans les 7 autres langues (ar, de, es, it, mg, pt, zh) et `pnpm i18n:check` passe. Ce sont des traductions de brouillon à faire relire par des locuteurs, en particulier le malgache et l'arabe ; les textes juridiques traduits (CGU, confidentialité, CGV) restent des brouillons à valider par un juriste. Le mot de confirmation de suppression de compte est DELETE dans toutes les langues autres que le français (le serveur n'accepte que SUPPRIMER et DELETE). Le mail d'export utilise maintenant le modèle HTML `export_ready` (l'export par lien existait déjà) ; les anciens textes de mail `export`, `codeReset` et `deleted` sont supprimés.
- 2026-10-03 : adaptatif : rail latéral à partir de 1024 px (`SideRail`), barre du bas en dessous, classe `tv` par largeur ou appareil (voir `docs/adaptatif.md`). Pages sans maquette refaites (activité avec filtre par personne, appareils, corbeille 30 jours, stockage ouvert aux proches, traduction avec langue « terminée » : migration 0056 `books.translated_languages`, filtre côté enfant dans `loadPlaybackPlan`).

- Book creation is a single accordion screen (pages, lines, characters) with a device-local draft (localStorage, key tantara-book-draft). A book can be saved with pages only: lines of reference are generated per page or panel unless flagged without words. Dev runs under docker compose (app + postgres).

- Dev feedback widget (technical/DevFeedback): shown only with NUXT_PUBLIC_APP_ENV=development-local, stores remarks in .design-feedback/<branch>.json (git-ignored); e2e force the variable to empty.

- Book access rule: when a book first becomes ready (approveBook, completeIfAllApproved), every restricted child of the family gets a book_access row automatically; a parent can still remove it from the child selection afterwards. A ready book without an approved recording stays hidden from children until a voice is approved.

- 2026-10-06 : mode « appareil personnel » (issue #177). Un parent le coche dans le menu profil ; un appareil partagé garde le comportement actuel (choix de profil, code). Mécanisme : une ligne `member_devices` avec `is_personal` (migration 0059) dont le secret est gardé en localStorage (`tantara-personal-device`). Au chargement, le middleware d'authentification rouvre le profil avec la preuve d'appareil (sans code) ; pour changer de profil ou ouvrir `/family`, la feuille de déverrouillage du profil (code ou biométrie) s'affiche et ne s'ouvre qu'après le code ; après l'inactivité, le profil personnel est rétabli. Sécurité : jamais pour un enfant (403 côté serveur), révocable depuis la page appareils de la famille ou en un geste dans le même réglage, une preuve rejetée (403/404) efface le mode local, la déconnexion le retire. Limite connue : le secret est en localStorage (pas dans le coffre biométrique), donc quiconque déverrouille le téléphone et garde la session ouverte accède au profil parent, c'est le but du mode ; un parent peut le révoquer à distance. La révocation côté serveur à la déconnexion n'a lieu que si une session de profil existe encore.

- 2026-10-08 : visite guidée des adultes (issue #117), domaine `functional/Tour`. Nouvelle dépendance : `driver.js` 1.9.0 (visite guidée, sans framework, installée avec pnpm sans toucher à `minimumReleaseAge`). État par membre sur le serveur : colonne `members.tour_status` (`pending` après `/welcome`, `done` après la fin ou le saut), migration 0063 ; `GET` et `PUT /api/tour` refusent un enfant (403). La visite se lance seule uniquement si le statut est `pending` (donc après `/welcome`), pour ne pas gêner les parcours existants ; elle se rejoue depuis la feuille des réglages sans changer le statut. Les proches n'ont pas d'armement automatique (ils la lancent depuis les réglages) : à brancher sur la fin de l'invitation si besoin. Les étapes sont dans `functional/Tour/app/utils/tour-steps.ts` et visent des `data-testid` ; une ancre absente fait sauter l'étape.
