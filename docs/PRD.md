# PRD — Maki Story

## Objectif

Garder le lien avec la famille éloignée (notamment à Madagascar) : des livres et BD photographiés, lus à voix haute par les proches, que l'enfant écoute à son rythme, avec la voix de ceux qu'il aime.

## Utilisateurs

| Rôle | Peut faire |
| --- | --- |
| Parent | Gère la famille, les proches, les enfants, les livres, les tags, les connexions autorisées ; valide les livres ; verrouille l'app d'un profil |
| Proche | Ajoute des livres, enregistre des voix, laisse des messages vocaux aux enfants, a un coffre pour les messages reçus des enfants (10 au maximum) |
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

## Création d'un livre

Parcours guidé (maquettes `Creation Livre *.dc.html` du 2026-10-13, issues #169 et #180) : une étape de couverture, puis une étape par page jusqu'à « Livre fini », puis une vérification et l'envoi. Un brouillon est enregistré à chaque « Page suivante ». Détail des écrans, états et règles dans `docs/pages/books-new.md`.

- **Couverture** : titre obligatoire ; description facultative (consignes de jeu ou contexte) ; type de livre en pastilles (livre par défaut, bande dessinée, sans texte, écrit par l'enfant) ; image de couverture vierge ou avec photo ; « Plus de détails » (langue du texte, langues des voix, ambiances, thèmes, étiquettes, sous-titre, auteur, dessinateur, âges, voix de synthèse, scan ISBN) : tout y est facultatif et ne bloque jamais la création.
- **Page** : image vierge ou photo ; voix « Avec voix » ou « Sans voix ». Une page sans voix est muette : aucune demande n'est envoyée. Un livre sans aucune voix est un livre muet, valide.
- **Voix et personnages** sont créés ensemble. Un personnage n'existe pas sans sa voix et n'a qu'un lecteur. Un adulte peut lire plusieurs voix. Un personnage « adulte et enfant » se modélise par deux personnages. Le narrateur est une voix comme les autres (rôle propre), créée par défaut et supprimable.
- **Qui la lit ?** Un proche qui parle la langue du livre ; une traduction par l'IA suivie d'une attribution (seulement quand l'IA est activée) ; une proposition ouverte à tous les adultes de la famille qui parlent la langue ; ou « plus tard ».
- **Envoi** : liste des personnages avec leur lecteur et nombre de voix « à attribuer » ; les demandes d'enregistrement aux proches partent à l'envoi.
- **Limites de l'offre gratuite** : un brouillon ne compte pas dans les 12 livres ; le livre compte à l'envoi.

## Plateformes

iOS, Android, PWA, Android TV via Capacitor.

## Hors périmètre

IA de création de livre. Voir `docs/MEMORY.md` pour les points encore ouverts.
