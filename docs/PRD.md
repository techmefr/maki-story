# PRD — Tantara

## Objectif

Garder le lien avec la famille éloignée (notamment à Madagascar) : des livres et BD photographiés, lus à voix haute par les proches, que l'enfant écoute à son rythme, avec la voix de ceux qu'il aime.

## Utilisateurs

| Rôle | Peut faire |
| --- | --- |
| Parent | Gère la famille, les proches, les enfants, les livres, les tags, les connexions autorisées ; valide les livres ; verrouille l'app d'un profil |
| Proche | Ajoute des livres, enregistre des voix, laisse des messages vocaux aux enfants, a un coffre |
| Enfant | Écoute les livres validés, reçoit des messages, en envoie aussi (5 au maximum par destinataire), garde des favoris dans son coffre |

Un enfant a un ou plusieurs parents. Une personne peut être parent d'une famille et proche d'une autre.

## Périmètre

41 écrans et 9 e-mails des maquettes, repris écran par écran (voir `docs/maquettes/README.md`). IA reportée : le livre porte seulement une origine `manuel`.

## Règles métier

1. Un expéditeur (adulte ou enfant) laisse au maximum 5 messages vocaux actifs à un même destinataire ; un message mis au coffre ne compte plus.
2. Un message, d'un adulte ou d'un enfant, reste accessible 24 h après la première écoute par son destinataire, puis est supprimé, sauf s'il est mis au coffre. Le décompte ne repart pas à la réécoute. Un message jamais écouté n'expire pas.
3. Coffre : 10 favoris par enfant, 10 souvenirs par adulte. Le 11e ajout est refusé.
4. Code adulte : 4 à 8 chiffres. Code enfant : 4 à 6 formes parmi 6 touches, longueur choisie par l'enfant.
5. Tags : slug anglais, nom par langue de la famille, repli langue choisie puis anglais puis slug.
6. Seules les langues de la famille sont proposées.
7. Verrouillage : une règle par profil (jours, heures par pas de 30 min, fuseau), déverrouillage parent de 30 minutes, coupe aussi une écoute en cours.
8. Livre sans voix caché ; validation parent avant l'enfant ; un livre dans 10 familles au maximum.
9. Un seul e-mail récapitulatif par jour, selon les préférences.
10. Hors ligne et poids réduit : audio Opus 16 kHz, images WebP 1200 px, envoi repris après coupure.

## Messages entre adultes

Il n'y a pas de messages libres entre adultes (un enfant peut en envoyer à un adulte, et inversement). Seules circulent les demandes liées au livre (demande d'enregistrement, proposition de livre) et à la revue (corrections, commentaires).

## Studio

Création page par page. Optionnels : photo de page, titre et description de page, description de personnage, auteur, couverture, ISBN. Obligatoires : titre du livre, au moins une langue, et pour chaque personnage nom, couleur et texte dans la langue déclarée.

## Plateformes

iOS, Android, PWA, Android TV via Capacitor.

## Hors périmètre

IA de création de livre. Voir `docs/MEMORY.md` pour les points encore ouverts.
