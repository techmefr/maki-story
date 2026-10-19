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
