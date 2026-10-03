# Pages sans maquette

Six pages existent déjà en ancien style (classes `card`, `badge`, boutons sans icône) et n'ont pas de maquette Claude Design. Ce document décrit leur refonte dans le style du design system. **Rien n'est codé tant que Gaëtan n'a pas validé.**

Règles communes à toutes les pages :

- En-tête : `BackLink` à gauche, titre `title` en grand, une phrase d'explication en `var(--ink-soft)` 18 px.
- Une action principale par écran ; tous les boutons portent une icône ; jamais d'emoji.
- Lignes de liste : `AppListRow` (ronds ou avatar à gauche, titre, sous-titre, action à droite). Cartes de regroupement : bordure 3 px, rayon 22 px, ombre `var(--shadow)`.
- Cibles tactiles 44 px au minimum, texte 14 px au minimum.
- Thèmes clair et sombre ; texte sur fond coloré en `var(--on-accent)` ; contrastes 4,5:1 (texte) et 3:1 (contours).
- `prefers-reduced-motion` respecté ; focus visible ; libellé d'accessibilité sur chaque bouton icône.
- États communs : chargement (`aria-busy`), vide (`AppEmpty` avec texte et indication), erreur (message `role="alert"` et bouton Réessayer).

## 1. Activité (`/family/activity`)

Journal des actions de la famille (qui a fait quoi), conservé `JOURNAL_RETENTION_MONTHS` mois.

- **Structure** : en-tête, phrase de rétention, filtre par personne (`AppChip` : Tous, puis un par profil), liste groupée par jour (« Aujourd'hui », « Hier », date), bouton « Voir plus ».
- **Ligne** : rond coloré à la couleur de la personne avec son initiale, libellé de l'action, sous-titre « par {nom} · {heure} », pastille d'état seulement si l'issue n'est pas un succès (« Refusé », « Échec »).
- **Composants** : `BackLink`, `AppChip`, `AppListRow`, `AppBadge`, `AppEmpty`, `AppButton`.
- **États** : chargement, vide (« Rien à signaler pour l'instant »), liste partielle (bouton Voir plus), erreur.
- **Accès** : parents seulement.

## 2. Appareils (`/family/devices`)

Appareils connectés par profil, avec retrait.

- **Structure** : en-tête, phrase d'explication, une carte par profil qui a au moins un appareil (avatar, nom), et dans chaque carte une ligne par appareil.
- **Ligne d'appareil** : icône (téléphone, tablette, ordinateur, télévision) dans un rond, libellé de l'appareil, « Dernière activité : … », bouton icône « Déconnecter » (corbeille ou sortie).
- **Confirmation** : `AppBottomSheet` « Déconnecter {appareil} de {nom} ? » avec Annuler et Déconnecter.
- **Composants** : `BackLink`, `AppAvatar`, `AppListRow`, `AppIconButton`, `AppBottomSheet`, `AppEmpty`.
- **États** : vide (« Aucun appareil connecté »), chargement, erreur, appareil courant marqué « Cet appareil » (non retirable ici).
- **Accès** : parents seulement.

## 3. Corbeille (`/family/trash`)

Éléments supprimés restaurables pendant `RESTORE_WINDOW_DAYS` jours (livres, profils, enregistrements).

- **Structure** : en-tête, phrase « Restaurable pendant N jours », filtre par type (`AppChip` : Tout, Livres, Profils, Enregistrements), liste.
- **Ligne** : icône du type dans un rond, nom, détail, « Jusqu'au {date} » (en `var(--danger)` à moins de 3 jours), bouton « Restaurer » (icône `redo`, ton menthe).
- **Composants** : `BackLink`, `AppChip`, `AppListRow`, `AppButton`, `AppEmpty`.
- **États** : vide (« La corbeille est vide »), restauration en cours (bouton désactivé), restauration impossible (message : place manquante au coffre, limite de familles, etc.), erreur.
- **Accès** : parents seulement. Pas de suppression définitive manuelle.

## 4. Stockage hors ligne (`/storage`)

Livres téléchargés sur l'appareil.

- **Structure** : en-tête, carte d'usage (libellé « X Mo utilisés sur Y », `AppProgress`, taille téléchargée), indicateur « Stockage protégé » ou bouton « Protéger le stockage », liste des livres, bouton « Tout supprimer » en secondaire.
- **Ligne** : couverture ou rond coloré, titre, taille, pastille « Incomplet » si besoin, bouton icône « Supprimer ».
- **Confirmation** pour « Tout supprimer » : `AppBottomSheet`.
- **Composants** : `BackLink`, `AppProgress`, `AppBadge`, `AppListRow`, `AppIconButton`, `AppBottomSheet`, `AppEmpty` (type hors ligne).
- **États** : vide (« Aucun livre téléchargé » avec renvoi vers la bibliothèque), quota presque plein (`AppProgress` en ton avertissement), navigateur sans stockage persistant, erreur.
- **Accès** : parents et proches (pas les enfants).

## 5. Grimace (`/grimace`)

Photo de profil prise avec la caméra.

- **Structure** : titre, phrase d'aide, grand cadre rond (la couleur du profil en contour) avec l'aperçu caméra, bouton principal « Prendre la photo » (icône `camera`), bouton secondaire « Plus tard ».
- **Après la prise** : aperçu rond, boutons « Garder » (principal) et « Refaire » (secondaire).
- **Composants** : `PhotoCapture`, `AppAvatar`, `AppButton`.
- **États** : caméra refusée (message avec marche à suivre, bouton « Choisir une photo » en repli), envoi en cours, envoi échoué (bouton Réessayer, la photo reste en mémoire), hors ligne (envoi mis en file).
- **Accès** : tous les profils ; l'enfant voit des textes courts et des boutons de 66 px.

## 6. Traduction (`/books/:id/translate`)

Saisie du texte d'un livre dans une autre langue de la famille.

- **Structure** : en-tête avec retour vers le studio, titre du livre, sélecteur de langue (`AppChip` avec drapeaux, uniquement les langues de la famille), compteur « N/M lignes traduites » avec `AppProgress`, liste des répliques.
- **Réplique** : en-tête « Ligne n · personnage », texte d'origine en lecture seule, champ de traduction (`AppTextarea`), champ d'intonation (`AppInput`).
- **Action principale** : « Enregistrer » collée en bas de l'écran.
- **Aide automatique** : le bouton de suggestion reste masqué tant que l'IA est reportée.
- **Composants** : `BackLink`, `AppChip`, `FlagIcon`, `AppProgress`, `AppTextarea`, `AppInput`, `AppButton`.
- **États** : langue sans traduction (champs vides), enregistrement en cours, enregistré (bouton vert), erreur, livre introuvable.
- **Accès** : parents, et proche pour ses livres solo.

## Questions à valider

1. Activité : faut-il le filtre par personne, ou seulement la liste groupée par jour ?
2. Corbeille : ajoute-t-on une suppression définitive manuelle, ou on laisse la purge automatique seule ?
3. Stockage : les proches y ont-ils accès, ou seulement les parents ?
4. Grimace : propose-t-on le choix d'une photo existante en plus de la caméra ?
5. Traduction : une langue peut-elle être marquée « terminée » pour être proposée aux enfants, ou toute traduction partielle est-elle lisible ?
