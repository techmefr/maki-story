# Feature Specification: Ambiances adaptatives Maki Story

**Feature Branch**: `dev` (branche de passation ; aucune implémentation de cette évolution)

**Created**: 2026-10-23

**Status**: Draft — prête pour revue du besoin et planification avec Claude Code

**Input**: « Faire varier les trois thèmes adultes et enfants en fonction des quatre saisons, du jour/nuit et des événements ; conserver les maquettes dans le dépôt et préparer SpecKit pour la reprise. »

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conserver ses repères dans chaque univers (Priority: P1)

Un adulte ou un enfant choisit Forêt douce, Carnet de famille ou Bibliothèque chaleureuse dans son profil. Il retrouve les mêmes personnes, livres, boutons et parcours dans chaque thème, avec un splashscreen assorti. Les variations renforcent ce thème au lieu de le remplacer.

**Why this priority**: La lisibilité et la simplicité priment sur les effets de décor. Les trois thèmes existent déjà ; la suite doit consolider leur fidélité aux maquettes et leur cohérence sur tous les écrans.

**Independent Test**: Pour un même profil fictif, parcourir l’accueil, le coffre, la bibliothèque et la lecture dans les trois thèmes ; comparer les actions, photos et commandes, puis changer de profil et revenir.

**Acceptance Scenarios**:

1. **Given** un profil dans Forêt douce, **When** il choisit Carnet puis Bibliothèque, **Then** seuls l’habillage et son aperçu changent ; les personnes, livres, routes et actions restent équivalents.
2. **Given** deux profils sur le même appareil, **When** chacun choisit une ambiance, **Then** le retour à chaque profil restaure son choix propre sans reprendre celui de l’autre.
3. **Given** une orientation ou une taille de texte différente, **When** une page est affichée, **Then** toutes les actions restent accessibles et aucun texte n’est posé sur un décor qui le rend illisible.

### User Story 2 - Faire évoluer le décor avec les saisons (Priority: P1)

Le profil active des saisons automatiques ou choisit manuellement printemps, été, automne ou hiver. L’app conserve l’identité du thème et adapte le feuillage, les accents et la lumière aux saisons du calendrier choisi.

**Why this priority**: Donner de la vie au décor sans multiplier les interfaces ni imposer les saisons françaises à une famille vivant ailleurs.

**Independent Test**: Choisir chaque saison, puis simuler les dates limites des calendriers nord et sud ; vérifier les mêmes parcours sans connexion.

**Acceptance Scenarios**:

1. **Given** saisons automatiques et calendrier nord, **When** la date locale passe au 1er septembre, **Then** l’ambiance devient automnale au prochain moment approprié, dans les trois thèmes.
2. **Given** la même date et calendrier sud, **When** le profil est ouvert, **Then** l’ambiance correspond au printemps.
3. **Given** une saison manuelle, **When** le mois change, **Then** cette saison reste sélectionnée jusqu’au choix de l’utilisateur.
4. **Given** un profil existant sans nouveau réglage, **When** la fonctionnalité arrive, **Then** son thème et ses préférences actuelles sont conservés ; l’activation des variations lui est laissée.

### User Story 3 - Retrouver une ambiance adaptée à l’heure (Priority: P1)

Le profil peut choisir une ambiance de décor jour, nuit ou automatique. En automatique, elle suit l’heure locale de l’appareil. Les préférences existantes clair/sombre/automatique et la salutation horaire restent compréhensibles et cohérentes.

**Why this priority**: L’app accompagne notamment le coucher ; un changement d’ambiance ne doit ni éblouir ni interrompre une lecture ou un enregistrement.

**Independent Test**: Tester 04:59, 05:00, 17:59 et 18:00, puis revenir dans l’app après un changement de fuseau. Répéter avec un affichage clair ou sombre choisi manuellement.

**Acceptance Scenarios**:

1. **Given** décor jour/nuit automatique, **When** l’heure locale est 18:00, **Then** l’ambiance est nocturne et la salutation affiche Bonsoir ; à 05:00 elle redevient diurne et affiche Bonjour.
2. **Given** une préférence manuelle pour le décor ou la luminosité, **When** l’heure ou la préférence système change, **Then** le choix manuel correspondant reste prioritaire et les textes restent lisibles.
3. **Given** une lecture ou un enregistrement en cours au changement d’heure, **When** la variation devient applicable, **Then** aucun son, rechargement, déplacement de commande ou interruption ne se produit ; le décor peut attendre la prochaine transition de page ou la fin de l’activité.

### User Story 4 - Ajouter les événements que la famille choisit (Priority: P2)

Le profil active ou désactive les décors d’événements proposés et peut prévisualiser une ambiance avant de l’appliquer. Les événements de départ sont anniversaire, Noël et Nouvel An ; aucun décor de fête n’est imposé.

**Why this priority**: Personnaliser les moments importants tout en laissant chaque famille décider des fêtes qui la concernent.

**Independent Test**: Activer une fête, tester avant/pendant/après sa période et sa désactivation ; tester un anniversaire déjà renseigné et un profil sans date de naissance.

**Acceptance Scenarios**:

1. **Given** Noël désactivé, **When** la date correspond à sa période, **Then** aucun décor de Noël n’apparaît.
2. **Given** un événement activé, **When** sa période commence puis se termine, **Then** un décor discret s’ajoute puis disparaît sans changer le thème de base ou les commandes.
3. **Given** un anniversaire connu qui coïncide avec Nouvel An, **When** les deux événements sont actifs, **Then** un seul décor d’événement apparaît, anniversaire prioritaire, sans superposition de messages.
4. **Given** aucune date de naissance renseignée, **When** les ambiances sont consultées, **Then** la prévisualisation reste possible sans demander de nouvelles données à l’enfant.

### Edge Cases

- Date, fuseau ou heure d’été changés pendant que l’app reste ouverte : recalculer au retour et avant une nouvelle page, sans boucle ni rechargement.
- Fête traversant le 31 décembre : dates de début et de fin inclusives, retour au décor normal à la fin de la période locale.
- Naissance le 29 février : anniversaire au 28 février les années non bissextiles, hypothèse à confirmer lors de la revue du besoin.
- Préférence inconnue, illisible ou impossible à enregistrer : appliquer un thème de base lisible pour la session ; expliquer si le choix ne pourra pas être conservé.
- Illustration manquante ou appareil hors connexion : commandes et contenu restent disponibles avec le fond de base.
- Changement de profil rapide : ne pas afficher durablement les préférences ou les données d’un autre profil.
- Grands textes, nom de proche ou titre de livre long, sens de lecture de droite à gauche : conserver l’accès aux actions et les titres bornés sans masquer les informations essentielles.
- Réduction des mouvements activée : décor fixe, sans clignotement, confettis ou particules devant les boutons.
- Mode coucher/lecture nuit : ses protections restent prioritaires ; aucune fête ne les rend plus lumineuses ou bruyantes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L’app DOIT conserver trois thèmes de base disponibles aux adultes et enfants : Forêt douce, Carnet de famille et Bibliothèque chaleureuse ; Forêt douce reste le choix par défaut d’un nouveau profil.
- **FR-002**: Chaque thème DOIT garder une navigation, des commandes et des fonctions équivalentes, sur toutes les pages de son rôle, dont profils, accueil, coffre, bibliothèque, messages et lecture ; les pages d’entrée et le splash doivent rester cohérents avec le dernier univers connu.
- **FR-003**: Les photos réelles des proches, les noms, les livres et les données métier DOIVENT être conservés ; les portraits illustrés et textes fictifs des maquettes ne constituent pas des données à intégrer.
- **FR-004**: Apparence DOIT proposer des aperçus des thèmes, saisons, phases du jour et événements, un retour aux réglages par défaut et une indication claire des modes automatiques/manuels.
- **FR-005**: Les nouvelles préférences d’ambiance DOIVENT être isolées par profil sur l’appareil et restaurées à sa prochaine ouverture ; une erreur de conservation ne doit pas être annoncée comme une sauvegarde réussie.
- **FR-006**: Les profils existants DOIVENT garder leurs préférences lors de l’arrivée de la fonctionnalité ; les nouvelles variations automatiques ne sont pas activées sans choix du profil.
- **FR-007**: Les saisons DOIVENT proposer automatique, printemps, été, automne et hiver ; un choix manuel prime sur le calendrier.
- **FR-008**: Le calendrier DOIT pouvoir être nord ou sud, choisi sans géolocalisation obligatoire ; en automatique il suit la date locale de l’appareil.
- **FR-009**: Le calendrier nord DOIT utiliser printemps mars–mai, été juin–août, automne septembre–novembre et hiver décembre–février ; le calendrier sud inverse les saisons.
- **FR-010**: Le décor DOIT proposer jour, nuit et automatique ; en automatique jour couvre 05:00–17:59 et nuit 18:00–04:59, heure locale.
- **FR-011**: Les choix existants clair/sombre/automatique DOIVENT rester accessibles et indépendants du thème de base ; une préférence de luminosité manuelle prime sur une suggestion automatique.
- **FR-012**: La salutation DOIT afficher Bonjour le jour et Bonsoir la nuit selon l’heure locale, pour adultes et enfants ; elle ne doit pas reprendre Coucou dans les nouvelles variantes.
- **FR-013**: Les décors d’événements DOIVENT être désactivables par profil et désactivés par défaut ; l’événement manuel sélectionné prime sur la sélection événementielle automatique.
- **FR-014**: Le premier catalogue DOIT prévoir anniversaire, Noël et Nouvel An, en conservant une option sans événement.
- **FR-015**: Les périodes automatiques initiales DOIVENT être le jour de l’anniversaire, les 24 et 25 décembre pour Noël, et du 31 décembre au 1er janvier pour Nouvel An ; elles suivent le calendrier local du profil.
- **FR-016**: Un seul événement DOIT être visible à la fois ; après un choix explicite, la priorité automatique est anniversaire, Noël puis Nouvel An ; la saison et la phase jour/nuit restent la base de l’ambiance.
- **FR-017**: Un événement terminé ou désactivé DOIT laisser place à l’ambiance saisonnière et horaire normale sans modifier le thème choisi.
- **FR-018**: Les variations DOIVENT conserver le côté forêt et les trois couches de feuilles indépendantes, de tailles et mouvements variés, sans composition miroir imposée ; le carnet et la bibliothèque en utilisent des touches proportionnées à leur décor.
- **FR-019**: Les décors DOIVENT préserver un espace de lecture clair autour des titres, photos et commandes ; aucun voile beige ne doit couper artificiellement les feuilles.
- **FR-020**: Les changements automatiques DOIVENT être discrets et sans effet sonore ; ils ne doivent jamais interrompre un audio, un micro, une navigation ou une mise à jour de l’app.
- **FR-021**: La réduction des mouvements et la pause du feuillage DOIVENT rester prioritaires dans toutes les variantes, y compris le splashscreen.
- **FR-022**: Toutes les variantes DOIVENT conserver au moins 4,5:1 pour le texte courant et 3:1 pour les composants/repères visuels nécessaires ; les commandes tactiles font au moins 44 px.
- **FR-023**: L’expérience DOIT rester utilisable en portrait, paysage, tablette, ordinateur et téléviseur jusqu’au 4K, avec grands caractères et noms/titres longs, sans contenu définitivement caché sous la navigation.
- **FR-024**: Les calculs de saison, de phase du jour et d’événement DOIVENT fonctionner hors connexion et sans services Google ; un décor indisponible ne doit pas bloquer l’ouverture.
- **FR-025**: Le splashscreen DOIT suivre l’ambiance effective en gardant Maki, le nom de l’app et le chargement lisibles et entièrement accessibles quelle que soit l’orientation ; le comportement actuel des mises à jour reste inchangé.
- **FR-026**: La lecture enfant DOIT continuer d’accompagner un livre papier, sans ajouter le texte ou les images des pages physiques à l’écran.
- **FR-027**: Les libellés DOIVENT être traduits dans les neuf langues existantes et fonctionner dans les deux sens de lecture.
- **FR-028**: La météo réelle, la géolocalisation, de nouveaux fournisseurs externes et une synchronisation des préférences entre appareils sont hors de ce premier lot ; leur éventuelle extension sera spécifiée séparément.

### Key Entities *(include if feature involves data)*

- **Profil** : personne adulte ou enfant, ses réglages propres, éventuellement une date de naissance déjà connue.
- **Préférence d’ambiance** : thème, choix de saison et de calendrier, choix jour/nuit et événements activés ; les réglages existants de luminosité et de mouvement restent leurs contraintes prioritaires.
- **Contexte local** : date, heure et fuseau de l’appareil au moment d’ouvrir ou reprendre l’app.
- **Événement** : type, période active, activation par profil et priorité de présentation.
- **Ambiance effective** : combinaison du thème, de la saison, de la phase du jour et d’au plus un événement, avec les réglages d’accessibilité appliqués.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pour chacun des trois thèmes et des deux rôles, les parcours accueil → bibliothèque → livre et accueil → coffre restent réalisables avec le même nombre d’actions avant et après une variation.
- **SC-002**: Les 24 combinaisons de base (3 thèmes × 4 saisons × 2 phases) sont reconnaissables, et les mêmes contrôles restent accessibles dans les deux rôles ; chaque événement du catalogue est vérifié sur ces 24 bases.
- **SC-003**: Dans 100 % des vérifications aux limites de dates/heures nord/sud, la saison, la phase et la salutation correspondent aux règles définies, y compris hors connexion et après changement de fuseau.
- **SC-004**: À 320×640, 390×844, 844×390, 768×1024, 1024×768, 1440×900 et 3840×2160, avec texte normal puis agrandi à 200 %, aucune commande nécessaire ne reste inaccessible après défilement et aucun débordement horizontal de page n’est causé par le décor.
- **SC-005**: Les textes et composants de toutes les palettes respectent les seuils FR-022 ; les photos, commandes et noms restent identifiables avec les mouvements réduits.
- **SC-006**: À la reprise de trois profils ayant des choix différents, chacun retrouve ses propres réglages ; une fête désactivée n’apparaît dans aucun de ses parcours.
- **SC-007**: Pendant une écoute ou un enregistrement, les passages jour/nuit, saison et événement n’introduisent aucune interruption, perte de progression, démarrage de son ou demande de reconnexion.
- **SC-008**: Le décor n’allonge pas l’attente du splashscreen au-delà de ses délais actuels et son absence ne bloque jamais l’accès au contenu.

## Assumptions

- Le premier lot améliore une application existante, pas ses règles métier ou ses offres commerciales. Les trois thèmes et les salutations horaires sont déjà présents ; la validation visuelle complète reste à reprendre.
- Les saisons sont météorologiques, avec calendrier nord proposé au départ et choix sud explicite ; aucune position précise n’est nécessaire.
- Les événements proposés sont facultatifs. Anniversaire utilise seulement une date déjà renseignée ; aucune nouvelle information n’est exigée d’un enfant pour décorer l’app.
- Les choix de périodes, d’horaires et du 29 février sont des valeurs produit proposées pour rendre la spécification testable ; ils sont à relire avant planification.
- Le choix manuel prime pour son propre réglage ; le thème, la saison, l’horaire et l’événement sont des dimensions combinables, pas quatre refontes concurrentes.
- Les planches sont des références d’intention. La spécification prévaut pour les vraies photos, les intitulés Bonjour/Bonsoir, les contrastes, le contenu réel et l’accessibilité ; les feuilles d’hiver restent une touche du thème, pas un changement d’application.
- La météo a été évoquée comme évolution ultérieure ; ce dossier ne présume aucun fournisseur, autorisation, prix ou appel réseau associé.

## Visual References

- [Galerie complète des planches](../../docs/maquettes/planches/README.md)
- [Trois thèmes adultes — desktop et splash](../../docs/maquettes/planches/2026-10-22/themes-adultes-desktop-et-splash.png)
- [Trois thèmes adultes — tablette et mobile](../../docs/maquettes/planches/2026-10-22/themes-adultes-tablette-et-mobile.png)
- [Trois thèmes enfant — profil fictif Lina](../../docs/maquettes/planches/2026-10-22/themes-enfant-lina-mobile.png)
- [Saisons et jour/nuit — proposition](../../docs/maquettes/planches/2026-10-23/saisons-jour-nuit.png)
- [Événements — proposition](../../docs/maquettes/planches/2026-10-23/evenements-optionnels.png)
