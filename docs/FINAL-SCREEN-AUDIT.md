# Audit final des écrans — 2026-10-19

Référence adulte : maquettes du dépôt. Référence enfant : direction du splashscreen validée par Gaëtan, puis écoute d’un livre papier sans texte ni illustration. Les prototypes ne sont pas pris pour des écrans de production.

Les captures utilisent les pages réelles sur un serveur local et une base isolée avec des données fictives. Formats 320×760, 844×390, 1180×820, 1600×900, plus contrôle enfant 4K de la session précédente. 192 captures de routes, 32 captures enfant reprises avec une voix approuvée, 33 variantes sombre/arabe et huit captures de l’alerte coucher. Les premières captures redirigées vers le choix de profil ont été écartées ; le marqueur de session a ensuite été corrigé dans le seul script d’audit. Aucun débordement horizontal ou erreur JavaScript dans les relevés retenus.

Une ligne « Source » signifie une relecture du composant et des règles, pas une capture de tous ses états ni un test d’interaction. Les confirmations de suppression n’ont pas été exécutées. Aucun E2E lancé et aucune donnée de production utilisée.

| Maquette | Écran réel | Preuve | Vérification / décision |
|---|---|---|---|
| Onboarding | /onboarding | Capture | Diapositives et choix des langues |
| Legal | /legal | Capture | Onglets, texte défilant et consentement |
| Connexion | /login | Capture | E-mail/lien magique et mot de passe ; social facultatif |
| Lien Magique | /magic | Capture + source | Attente, succès, expiration, réutilisation et réseau |
| Code Oublie | /forgot | Capture + source | Récupération par lien à usage unique |
| Permissions | /permissions | Capture + source | Refus ou absence de matériel ne bloque pas la navigation |
| Creer Famille | /families/new | Capture | Formulaire borné et validations |
| Ajouter Proche | /family/add | Capture | Actions et explications |
| Rejoindre | /join/ABC123 | Capture | État de lien invalide ; formulaire relu |
| Choix Famille | /families | Capture | Choix dans une liste adaptative |
| Famille | /family | Capture | Groupes de rôles, noms longs et actions |
| Profil Proche | /family/:id | Capture | Photo, identité et actions parent |
| Acces Livres | /family/books | Capture | Sélection et état vide |
| Controle Parental | /family/parental | Capture + source | Horaires, timezone et demandes |
| Ecran Verrouille | /kid/locked | Source | Nuit, heure de reprise et accès parent ; class kid-world |
| Modifier Profil | /profile/edit | Capture | Identité, langues et compte |
| Compte | /account | Capture + source | Export/suppression avec confirmation ; pas d’action destructive exécutée |
| Page Profils | /profiles | Capture initiale + source | Grille et rôles ; pavés de déverrouillage |
| Code Chiffres | PinPad / ProfileUnlock | Source | 4–8 chiffres, validation explicite, labels, effacement, cibles ≥44 px |
| Code Formes | SymbolPad / ProfileUnlock | Source | Six formes, 4–6 éléments, validation et états désactivés |
| Menu Profil | ProfileMenu | Source | Feuille modale, retour focus, préférences, photo |
| Accueil Enfant | /kid | Capture | DA splash validée : bois/feuillage, contacts et compteurs |
| Lecture | /kid/listen/:id | Capture + source | Livre papier : aucun scan ni réplique ; titre borné, photo/nom, halo suivant, montre coucher |
| Accueil Proche | /relative | Source | Cartes enfant et tâches ; vue parent capturée séparément |
| Categorie | /categories/:slug | Source | Groupe filtré et état vide |
| Bibliotheque | /library et /kid/library | Capture | Cartes, filtres et état vide ; styles distincts adulte/enfant |
| Livre Detail | /books/:id | Capture | Métadonnées, voix, accès et actions |
| Ajouter Livre | /books/new et /books/isbn | Capture | Création manuelle/ISBN, pas de dépendance à Google |
| Tags | /tags | Capture | Liste, filtres et formulaire relu |
| Studio | /books/:id/studio | Capture + source | Grille, voix, langues et lecteur de référence |
| Enregistrer | useRecorder et studio | Source + unité | Opus prioritaire, repli AAC, limite et état microphone |
| Message Enfant | /message/:id et /message/listen/:id | Capture + intégration SQL | Enregistrement, quota, conversation isolée et favoris |
| Coffre Adulte | /vault | Capture + intégration SQL | 10 éléments, actions adulte, état vide et erreur |
| Notifications | /notifications et /notifications/settings | Capture + source | Préférences et repli premier plan sans push |
| Revue Parent | /books/:id/review | Capture | Actions regroupées et état sans prise |
| Aide | /help | Capture | Sections et contact conditionnel |
| Etat Erreur | AppEmpty / pages d’erreur | Source | 403/404/500/hors ligne, relance ; pas d’erreur serveur provoquée en production |
| Creation Livre Couverture | BookCoverStep | Capture étape initiale + source | Titre obligatoire, options facultatives |
| Creation Livre Page | BookPageStep | Source | Étape par page, voix et attribution |
| Creation Livre Page Muette | BookPageStep | Source + unité de progression | Page sans voix et reprise |
| Creation Livre Image | BookImageSheet | Source | Photo et compression 1200 px, repli de décodage |
| Creation Livre Prototype | /books/new | Référence de parcours | Le parcours réel par étapes remplace le prototype autonome |
| Presentation | docs/maquettes/Presentation.dc.html | Hors application | Diaporama de présentation ; pas une route utilisateur à livrer |

Corrections de cette passe : titre du lecteur limité à deux lignes sans fuite du texte ; démarrage visible en paysage avec alerte ; pavé PIN sans cibles rétrécies par la hauteur ; navigation spatiale restreinte aux éléments visibles/actifs ; bois assombri pour les libellés crème. Les routes sans données présentent leur état vide.

Le build Android/TV sans bibliothèques GMS/Firebase, le build iOS simulateur et le paquet PWA sont vérifiés par le workflow Native build. Une compilation ne remplace pas un essai sur matériel : permissions, codecs réellement produits, cookies natifs, fonctionnement des télécommandes et notifications système sans fournisseur push restent à confirmer sur les appareils visés. Les textes juridiques et traductions de brouillon nécessitent toujours les relectures prévues.

## Correctif enfant et accessibilité — 2026-10-19 (#200)
Les captures utilisateur ont révélé une limite de l’audit précédent : les couleurs calculées n’avaient pas été vérifiées et le recadrage mobile du fond panoramique faisait disparaître le feuillage. Nouvelle validation sur le vrai code du dépôt, serveur 4018 et base locale tantara_visual_audit. La prévisualisation 4017 est une ancienne copie et ne doit plus servir de preuve pour les corrections.

Corrections : décor portrait WebP de 80 372 octets ; palette bois assombrie, texte crème sur bois et brun sur crème ; fond d’en-tête égal au token de fond ; icônes d’action dorées ; réserve de navigation mesurée par ResizeObserver, modes grands caractères réorganisés ; noms et titres longs sur deux lignes avec fonds opaques. Les noms accessibles des contacts et du bandeau correspondent désormais aux noms et compteurs visibles. Focus bicolore crème/brun sur les deux types de surfaces.

Preuves locales : /home/gaetan/artifacts/maki-child-corrected-2026-10-19 : capture.mjs, metrics.json, accessibility.mjs, accessibility.json et PNG. Trente rendus sur accueil, bibliothèque avec livre disponible, coffre avec souvenir, contact/messages et lecture : 320×760, 390×844, 844×390, 1180×820, 3840×2160, 390×844 grands caractères. Routes attendues atteintes, aucun débordement horizontal ni erreur JavaScript ; dernier contact entièrement dégagé après défilement. Les identités, médias et livres de ce contrôle sont de démonstration, pas ceux de l’utilisateur.

Axe-core 4.14.0, règles WCAG A/AA 2.0/2.1 : quinze contrôles (cinq pages, mobile, mobile grands caractères, tablette) ; aucun défaut automatique après correction des label-content-name-mismatch. Relevé clavier sur les premières huit tabulations par page, focus visible. Contrastes des couleurs de base : crème/bois le plus clair 6,27:1 ; brun/crème 12,03:1 ; brun/or le plus sombre 6,04:1. Les contrastes sur images/dégradés restent signalés comme incomplets par axe et demandent une interprétation manuelle ; absence de défaut automatique ne vaut pas conformité RGAA.

Références : https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/ et https://accessibilite.numerique.gouv.fr/ressources/kit-audit/ (RGAA 4.1.2). Pas de taux ni de déclaration de conformité globale : échantillon exhaustif, lecteurs d’écran réels et applicabilité/équivalents des contenus audio suivis séparément dans #201. Ce correctif ne déclare pas ce reliquat résolu.

Asset : public/art/child/storybook-portrait.webp, adapté du décor existant avec le skill imagegen et l’outil intégré, export WebP. Prompt retenu : recomposer le fond existant en portrait 9:19.5, conserver crème #fff3d6, feuilles vertes et branches 3D, lumière dorée, petite lanterne en haut à droite, végétation surtout en bordure et 80 % du centre dégagé ; aucun texte, interface, bouton, personnage ou logo. Le fond panoramique existant reste utilisé en paysage et grand écran.

Validation technique : pnpm verify (79 unités, 50 migrations up/down/up), intégration PostgreSQL et build Vercel réussis. Aucun E2E ajouté ou exécuté : contrôle automatique a refusé le lancement en raison de la consigne antérieure ; rendu et audit d’accessibilité locaux exécutés séparément.

## Accueil adulte : titre comprimé — 2026-10-19 (#203)
Capture utilisateur avec salutation verticale caractère par caractère. Le bloc .grow partageait le flex de home__intro avec les deux boutons, ce qui permettait de compresser le titre. Correctif : grille, salutation sur toute la largeur, deux actions dans leur zone distincte et empilées sous 600 px. Taille de police et nom complet conservés.

Rendus locaux sur vrai dépôt/serveur4018, parent et proche, noms longs : 320×760, 390×844, 844×390, 1180×820, 1600×900, 3840×2160 et 390×844 grands caractères. Quatorze rendus : /home atteinte, largeur du titre égale à celle du panneau sur les quatorze configurations, zéro débordement horizontal/erreur JS. À390px, le titre du proche passe de137px sur358px avant correction à358px sur358px ; à320px il dispose de288px sur288px. Preuves : /home/gaetan/artifacts/maki-adult-home-fix-2026-10-19 (capture.mjs, before/after-metrics.json et PNG). Pas d’E2E exécuté.
