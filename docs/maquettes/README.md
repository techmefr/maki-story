# Tantara — maquettes

Les histoires du soir, avec la voix de ceux qu'on aime. Ces maquettes font foi pour la refonte de l'UI. Le prompt de reprise est dans `PROMPT - Appliquer le design Tantara.md`.

## Ouvrir les maquettes

Chaque écran est un fichier `*.dc.html` qui s'ouvre dans le navigateur. Les écrans partagent quelques données de démo enregistrées dans le navigateur (livre du studio, tags, famille, progression). Les enregistrements audio, le scan du code-barre, la recherche de livre en ligne, l'envoi de mails et les sons sont simulés.

## Parcours

| Parcours | Écrans |
| --- | --- |
| Démarrage | `Onboarding`, `Legal`, `Connexion`, `Lien Magique`, `Code Oublie`, `Permissions` |
| Création | `Creer Famille`, `Ajouter Proche`, `Rejoindre`, `Choix Famille`, `Famille`, `Profil Proche`, `Acces Livres`, `Controle Parental`, `Ecran Verrouille`, `Modifier Profil`, `Compte` |
| Choix du profil | `Page Profils`, `Code Chiffres` (adultes), `Code Formes` (enfants), `Menu Profil` |
| Enfant | `Accueil Enfant`, `Lecture` |
| Proche | `Accueil Proche`, `Categorie`, `Bibliotheque`, `Livre Detail`, `Ajouter Livre`, `Tags`, `Studio`, `Enregistrer`, `Message Enfant`, `Coffre Adulte`, `Notifications` |
| Parent | `Revue Parent`, `Famille` |
| Transverse | `Aide`, `Etat Erreur` (hors ligne, mise à jour, erreur, 404, 403, 500) |
| Présentation | `Presentation` (7 diapositives) |
| E-mails | `Mails.html` et `mail-*.html` (9 mails transactionnels) |

## Règles métier

1. Un enfant a un ou plusieurs parents, qui gèrent la famille ensemble.
2. Un proche peut appartenir à plusieurs familles, et être parent d'une famille et proche d'une autre.
3. Un adulte laisse au maximum 5 vocaux au même enfant.
4. Le coffre d'un enfant garde 10 favoris au maximum.
5. Code à chiffres pour les adultes, code à 4 formes pour les enfants.
6. Les tags ont un slug anglais et un nom par langue de la famille.
7. Les adultes ont aussi un coffre (10 souvenirs) et peuvent s'envoyer des messages privés.
8. Un parent peut verrouiller l'app d'un profil à certains jours et heures (une règle par profil).
9. Seuls les parents gèrent les proches, enfants, livres, tags et connexions autorisées.

## Fichiers

- `studio-data.js` : données de démo du livre, partagées par Studio, Enregistrer, Revue Parent et Lecture.
- `logo-maki.png` : logo provisoire, découpé d'une capture. À remplacer par le vrai logo et le favicon.
- `maki-vide.json` : animation Lottie de l'état vide des notifications.
- `deck-stage.js`, `support.js` : outils des maquettes, à ne pas reprendre dans l'app.

## À compléter

- Textes juridiques (`Legal`) à faire valider par un juriste.
- Adresse postale, domaine, contact et variables `{{...}}` des e-mails.
- Vrai logo, favicon et photos de profil.
- Sons : à brancher via soundcn selon la liste du prompt.
