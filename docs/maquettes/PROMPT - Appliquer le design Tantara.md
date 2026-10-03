# Prompt : appliquer le design Tantara à toute l'app

Colle ce prompt tel quel à ton agent de code. Les maquettes de référence sont les fichiers `.dc.html` du projet : lis-les pour les valeurs exactes.

## 1. Design commun (toutes les pages)

- **Police :** Fredoka (400, 600, 700). Titres de page 32-34 px en 700. Texte courant 16-19 px. Jamais de texte sous 14 px.
- **Couleurs :** fond `#FFF3DC`, encre et contours `#1E1A3F`, texte secondaire `#3b3466`, blanc `#fff`.
  Accents : jaune `#FFC933` (action principale, sélection), bleu clair `#CFE5FF` (retour, fermer, secondaire), menthe `#4AD3A5` / `#ADE6C4` (valider, succès), corail `#FF7766` (enregistrer, alerte), rose `#FF8FC9`, violet `#B28DFF`, bleu `#6DB5FF`, gris `#E5E3F0`, danger doux `#FFD9D3`.
- **Style :** formes plates, contour 3 px encre, ombre décalée pleine `4px 5px 0 #1E1A3F` (petits éléments : `3px 4px 0`). Cartes : rayon 24-26 px. Boutons et chips : pilule (999 px). Feuilles du bas : rayon 32 px en haut, sans bordure basse.
- **États :** appui = translation `(3px, 4px)` et ombre `1px 1px 0`. Sélectionné = fond jaune + ombre. Désactivé = gris `#E5E3F0`, bordure `#9a9390`, opacité réduite.
- **Disposition :** une colonne, largeur max 440 px, marges 20 px. Barre du bas (Accueil / Coffre) pour l'enfant uniquement.
- **En-tête :** logo carré à gauche (arrondi 10 px, bordure 2 px), titre « Tantara ». Pas de roue de réglages : les réglages sont dans le menu profil. Bouton retour : pilule bleu clair avec flèche.
- **Icônes :** traits arrondis 2-2,5 px, couleur encre, pas d'emoji.
- **Pas de bouton pause** dans les lecteurs audio.
- **Boutons :** chaque page garde un bouton d'action principal bien visible, en couleur (jaune ou menthe), avec une icône. Tous les boutons ont une icône.
- **À conserver de l'app existante :** transitions, animations et sons (ding, sons des boutons). Seul le look change. L'architecture peut être refaite à partir de ces maquettes.
- **Logo et favicon :** le maki avec casque sur fond rouge remplace le carré rouge des maquettes (en-tête 44 px, arrondi 10 px, bordure 2 px).

## 2. Règles métier (à vérifier dans toute l'app)

1. Un enfant a un ou plusieurs parents, qui gèrent la famille ensemble.
2. Un proche peut appartenir à plusieurs familles. Une même personne peut être parent d'une famille et proche d'une autre.
3. Un adulte laisse au maximum **5 vocaux** au même enfant. La carte de l'adulte affiche une bulle de conversation avec le nombre. À 0, pas de bulle et la carte est grisée.
4. Le coffre d'un enfant contient au maximum **10 favoris**. Au-delà, le cœur est bloqué (« coffre plein »).
5. Les adultes ont un code à **chiffres** (pavé 0-9). Les enfants ont un code à **6 formes de couleur**.
6. L'ajout d'un proche ou d'un enfant n'est pas dans la page de choix de profil : il se fait côté parent.
7. Les tags ont un identifiant stable en anglais (slug) et un nom par langue. Les livres ne stockent que le slug. Repli : langue choisie, puis anglais, puis slug.
8. Seules les langues de la famille sont proposées (avec drapeau) dans les tags, les pages du studio et les lecteurs.
9. Un parent peut verrouiller l'app d'un profil à des jours et des heures choisis, chaque profil ayant sa règle. Le verrouillage s'applique même en cours d'écoute.
10. Seuls les parents créent ou modifient les tags et valident un livre.

## 3. Page par page

**Code Formes** (`Code Formes.dc.html`) : écran enfant. Bouton « Changer de profil » en haut à gauche, avatar, « Entre ton code », 4 cases, 6 touches (rond, carré, étoile, triangle, losange, cœur) avec leur nom en dessous, un seul bouton OK (icône + texte, centré, foncé quand le code est complet). Pas de bouton effacer sous le code, pas de bouton rond en haut à droite.

**Code Chiffres** (`Code Chiffres.dc.html`) : même structure pour les adultes. 8 points, pavé 1-9, 0 centré, flèche d'effacement en bas à gauche, coche de validation en bas à droite.

**Page Profils** (`Page Profils.dc.html`) : titre « Qui est-ce ? », grille 2 colonnes de cartes (avatar rond coloré, nom, rôle). Bouton « Déconnexion » en haut à droite. Aucun bouton d'ajout.

**Menu Profil** (`Menu Profil.dc.html`) : feuille du bas ouverte par l'avatar. En-tête (avatar, nom, rôle, croix), sections repliables avec la valeur choisie : Notifications (6 types × Notification / E-mail), Langues parlées, Langue de l'appli (avec drapeaux), Taille du texte, Thème. Sons avec interrupteur, volume visible seulement si les sons sont actifs. Boutons « Changer de profil » et « Quitter », lien « Donner mon avis » en bas. Les infos du profil viennent de paramètres (nom, initiale, rôle, couleur).

**Notifications** (`Notifications.dc.html`) : liste de cartes (avatar, titre, texte, heure, bulle de compteur type « 3 / 5 »). « Tout effacer ». État vide : animation du maki avec enveloppe (`maki-vide.json`), bulle « Tout est lu ! », titre « Rien de nouveau ! ». Aucun réglage ici.

**Accueil Proche** (`Accueil Proche.dc.html`) : ordre fixe : Mes enfants (cartes avec famille, bulle n/5, bouton Message), À enregistrer, Mes propositions, À corriger, Bibliothèque. Chaque catégorie n'affiche que 2 éléments. La ligne titre + total + flèche ouvre la page de la catégorie. En-tête : cloche avec compteur, avatar.

**Catégorie** (`Categorie.dc.html`) : liste complète de la catégorie (À enregistrer, Propositions, À corriger), bouton retour, total en haut.

**Bibliothèque** (`Bibliotheque.dc.html`) : recherche, bouton « Filtres » avec pastille du nombre de filtres actifs, grille 2 colonnes de livres (couverture colorée par tag principal, titre, badge de statut). Feuille de filtres : Univers (cartes à icône : western avec chapeau, océan, forêt, espace, château, animaux), Ambiance, Statut, « Réinitialiser » et « Voir N livres ». À terme, les filtres sont les tags.

**Tags** (`Tags.dc.html`) : liste (icône dans un rond coloré, nom dans la langue, slug, pastille « N à traduire »), sélecteur de langue avec drapeaux, « Nouveau tag ». Feuille d'édition : un champ par langue de la famille, 14 icônes, 6 couleurs, Enregistrer / Supprimer. Slug généré depuis le nom anglais, sinon français.

**Ajouter un livre** (`Ajouter Livre.dc.html`) : 3 étapes. 1) Scanner le code-barre ou saisir l'ISBN. 2) Titre et auteur modifiables, sujets trouvés en ligne, tags suggérés cochés avec la mention « auto », tous les tags disponibles, « + Nouveau tag ». Si introuvable : saisie manuelle. 3) Confirmation. Brancher Google Books / Open Library et faire correspondre les sujets anglais aux slugs.

**Accueil Enfant** (`Accueil Enfant.dc.html`) : « Coucou Mattéo ! », grandes cartes rondes des adultes avec bulle de conversation contenant le nombre de messages. Un clic ouvre l'écoute en plein écran : fond de la couleur de la carte, photo de la personne dans un rond entouré d'un blob qui bouge, barres de son animées, boutons Précédent / cœur (au centre) / Suivant, « n/10 souvenirs », Fermer. Pas de pause. Coffre : « Mon trésor » avec retour, compteur n/10, une ligne par souvenir avec bouton lecture. Coffre vide : grand coffre et phrase d'explication. En-tête : bouton d'avis (temporaire pour la démo, enregistre la page concernée), cloche, avatar qui ouvre le menu profil.

**Studio** (`Studio.dc.html`) : titre du livre, bande de pages numérotées avec « + ». Par page : photo (prise ou importée), onglets de langue avec drapeau et onglet « + » pour ajouter une langue, titre et description par langue, personnages (nom, couleur parmi 6, qui fait la voix, texte, description, suppression) et « Ajouter un personnage ».

**Enregistrer** (`Enregistrer.dc.html`) : vue de la personne qui fait la voix : progression, photo, onglets de langue, titre et description de la page, lignes des personnages (les siennes en avant, les autres atténuées) avec texte et description. Boutons Enregistrer, Arrêter (barres animées et chrono), Réécouter, Réenregistrer, numéro de prise et durée. Précédente / Suivante, puis « Envoyer pour relecture ».

**Revue Parent** (`Revue Parent.dc.html`) : revue de code simplifiée. Résumé (approuvés / à corriger / en attente) et barre de progression. Chaque page se déplie comme un fichier, avec un état. Chaque ligne : texte (ancien texte barré en rouge, nouveau en vert), lecteur audio, Approuver, Demander un changement avec commentaire. Bas d'écran : « Valider le livre » (actif quand tout est approuvé) ou « Renvoyer N corrections ».

**Lecture** (`Lecture.dc.html`) : lecture d'une histoire par l'enfant. Fond plein de la couleur de la personne qui lit, qui change en douceur à chaque réplique. Barre du haut : un segment par page (plein = passée, clair = en cours). Photo de la page, lectrice ou lecteur avec blob et barres de son, texte de la réplique. « Ding » à la fin des répliques d'une page, bouton « Page suivante » qui pulse. Page suivante / précédente : bouton, moitié droite ou gauche de l'écran, flèches du clavier. Progression mémorisée par livre et par enfant. Écran de fin avec « Relire ».

**Connexion** (`Connexion.dc.html`) : logo, deux modes (lien magique / mot de passe), « Continuer avec Google » toujours visible, bouton « Autres connexions » qui déplie Apple, Microsoft, Facebook. Un fournisseur désactivé par un parent est grisé avec « Désactivé ». Après l'envoi : écran « Regarde tes e-mails ! ».

**Lien magique** (`Lien Magique.dc.html`) : page d'arrivée du lien : vérification (3 points qui sautent), succès, ou lien expiré (15 min, usage unique) avec « Recevoir un nouveau lien ».

**Onboarding** (`Onboarding.dc.html`) : 3 écrans (bienvenue, chacun prête sa voix, l'enfant écoute et garde), « Passer », points de progression, « Commencer » vers la connexion.

**Legal** (`Legal.dc.html`) : onglets CGU, Confidentialité, CGV et deux cases obligatoires (acceptation, parent ou tuteur légal). Textes en brouillon à faire valider par un juriste, passages entre crochets à compléter.

**Famille** (`Famille.dc.html`) : réservé aux parents. Sections Parents, Enfants, Proches, Livres avec corbeille et feuille de confirmation. On ne retire pas son propre profil ni le dernier parent. Interrupteurs des connexions autorisées (Apple, Microsoft, Facebook ; lien magique et Google toujours actifs). Bouton principal « Ajouter un proche ».

**Ajouter un proche** (`Ajouter Proche.dc.html`) : onglets e-mail / code, rôle Proche ou Parent, code de 6 caractères valable 48 h à usage unique, écran de confirmation.

**Créer ma famille** (`Creer Famille.dc.html`) : première connexion d'un parent, 4 étapes avec barre de progression : nom de la famille, premier enfant (photo grimace, prénom, âge), code à 4 formes de l'enfant, code à chiffres du parent (4 à 8). Écran final qui mène à « Inviter un proche ».

**Autorisations** (`Permissions.dc.html`) : micro, caméra et photos, notifications, chacune avec son pourquoi et un bouton « Autoriser ». On peut continuer sans tout autoriser.

**Mon compte** (`Compte.dc.html`) : export des données (RGPD) et suppression du compte avec confirmation par saisie du mot « SUPPRIMER ».

**États d'erreur** (`Etat Erreur.dc.html`, 6 variantes) : hors ligne, mise à jour requise, erreur générale, page introuvable (404), accès refusé (403, avec pastille du code) et erreur serveur (500, avec pastille du code). Chacune avec une grande icône et une action principale.

**Aide** (`Aide.dc.html`) : questions fréquentes dépliables, contact du support, liens vers les conditions et le compte.

**Code oublié** (`Code Oublie.dc.html`) : réinitialisation par e-mail pour les adultes. Un enfant passe par un parent.

**Message à un enfant** (`Message Enfant.dc.html`) : choix du destinataire (enfants avec n/5, ou un adulte en privé), gros bouton Enregistrer / Arrêter avec chrono et barres, Réécouter, Réenregistrer, Envoyer. À 5/5, message d'alerte et bouton pour retirer le plus ancien. Un message privé va dans le coffre de l'adulte.

**Coffre adulte** (`Coffre Adulte.dc.html`) : même principe que le coffre enfant, 10 souvenirs maximum, filtres Tous / Enfants / Privés, lecture et retrait, état vide, bouton « Envoyer un message en privé ».

**Détail d'un livre** (`Livre Detail.dc.html`) : couverture, langues, tags, avancement de l'enregistrement par voix, boutons Lire (menthe), Enregistrer (corail), Modifier.

**Livres des enfants** (`Acces Livres.dc.html`) : parent seulement. Par enfant, « Tous les livres » ou une sélection de livres cochés.

**Profil d'un proche** (`Profil Proche.dc.html`) : parent seulement. Messages laissés par enfant (n/5), familles, réinitialiser son code, passer parent ou proche, retirer.

**Rejoindre avec un code** (`Rejoindre.dc.html`) : code de 6 caractères, création du profil (photo, prénom), code à chiffres, puis autorisations.

**Choix de la famille** (`Choix Famille.dc.html`) : pour une personne dans plusieurs familles, avec son rôle (Parent / Proche) dans chacune et « Rejoindre avec un code ».

**Modifier mon profil** (`Modifier Profil.dc.html`) : photo, prénom, e-mail verrouillé si connexion Google, changer le code, accès au compte.

**Contrôle parental** (`Controle Parental.dc.html`) : parent seulement. Un onglet par enfant (pastille cadenas si actif), interrupteur de verrouillage, jours de la semaine (raccourcis Semaine, Week-end, Tous), heures de début et de fin réglables par pas de 30 min (la fin tombe le lendemain), phrase de résumé, bouton Enregistrer. Une règle par profil.

**Écran verrouillé** (`Ecran Verrouille.dc.html`) : affiché à l'enfant pendant le verrouillage : lune qui flotte, « L'app dort », heure de réveil, bouton « Je suis un parent » qui demande le code parent (déverrouillage de 30 minutes).

## 3 bis. E-mails transactionnels

9 e-mails HTML prêts à l'envoi (`mail-*.html`, index dans `Mails.html`), même identité visuelle : carte crème, contours encre, bandeau coloré avec glyphe, bouton jaune. Variables entre doubles accolades à remplacer par le moteur de templates. Liens, domaine, adresse postale et contact sont des `[crochets]` à compléter. Le logo est un carré « T » en attendant une image hébergée en https.
- Lien magique (15 min, usage unique), invitation proche ou parent (lien + code 48 h), réinitialisation du code, bienvenue.
- Notifications (désactivables dans le menu profil) : relecture demandée au parent, corrections demandées au proche, nouvelle voix pour l'enfant.
- Export de données (lien 7 jours), confirmation de suppression du compte.
Prévoir l'envoi d'un seul e-mail récapitulatif par jour plutôt qu'un par événement pour les notifications.

## 4. Sons, animations, transitions (à conserver)

L'app existante a déjà des transitions, des animations et des sons : **les garder tous**, en changeant seulement l'apparence. Les sons passent par **soundcn** (bibliothèque de sons d'interface). Associer un son par événement et garder un réglage global (interrupteur + volume du menu profil) :
- appui sur un bouton : clic léger ;
- sélection d'un chip, d'un tag, d'une forme du code : tic ;
- code valide : succès ; code faux : erreur douce ;
- ding de fin de page (lecture) ;
- cœur ajouté au coffre : pop ; coffre plein : refus ;
- enregistrement démarré / arrêté : deux bips différents ;
- notification reçue.
Aucun son ne démarre avant une action de l'utilisateur. Respecter « réduire les animations » du système.

## 5. Règles d'ergonomie

- Chaque écran a **une action principale bien visible**, en couleur pleine (jaune, ou menthe pour valider, corail pour enregistrer ou retirer).
- **Tous les boutons ont une icône**, en plus du texte quand la place le permet.

## 6. Méthode de refonte

Les maquettes font foi. Reprendre l'UI écran par écran en gardant la logique existante, puis simplifier l'architecture (spécifications d'abord, en OSDD), puis remettre en production.

## 7. Vérification finale

Pour chaque page : mêmes couleurs, contours, ombres et rayons que les maquettes. Contraste du texte suffisant sur tous les fonds. Zones tactiles d'au moins 44 px. États vides prévus (notifications, coffre, bibliothèque filtrée). Les règles de la section 2 sont respectées.
