# Research — décisions de conception

Recherche effectuée le 2026-10-23 dans les sources existantes et la spécification. Elle porte sur le plan, pas sur une implémentation déjà validée.

## R1 — Dimensions orthogonales

**Decision**: conserver le thème de base ; ajouter saison, phase et événement séparément.
**Rationale**: évite 24 interfaces distinctes et garde les mêmes contrôles pour chaque rôle.
**Alternatives considered**: routes ou composants par combinaison, écartés pour duplication et incohérence ; Barba/Motion non nécessaires pour ce décor CSS.

## R2 — Préférences et migration

**Decision**: clé adaptative versionnée séparée ; réglages absents = disabled. Conserver les anciennes clés du thème et clair/sombre.
**Rationale**: readAppearance isole déjà les profils ; saveAppearance écrit aussi un dernier choix appareil pour l’entrée. Ne pas y mélanger les événements personnels.
**Alternatives considered**: migration destructive du simple thème, ou synchronisation serveur, écartées hors périmètre.

## R3 — Horloge et calendrier

**Decision**: convertir la date appareil en contexte civil local une fois, puis injecter year/month/day/hour dans les fonctions pures. Partager la source avec la salutation plutôt que créer des horloges divergentes.
**Rationale**: tests déterministes nord/sud, fuseaux, fin d’année et 04:59/05:00/17:59/18:00 ; aucun appel météo ou géolocalisation.
**Alternatives considered**: UTC pour les fêtes ou date serveur, écartées car peuvent décaler le jour local ; saisons astronomiques reportées.

## R4 — Mode clair/sombre

**Decision**: conserver useTheme seul responsable de la luminosité et des préférences light/dark/auto ; la phase décorative est indépendante.
**Rationale**: une ambiance nuit ne doit pas écraser une préférence explicite d’affichage clair ; inversement les tokens de contraste doivent rester valides dans les deux modes.
**Alternatives considered**: forcer data-theme à chaque coucher du soleil, écarté car contredit le choix manuel.

## R5 — Média et transitions

**Decision**: garde technique générique avec jetons d’activité ; les consommateurs Reading/Recording et messages lui transmettent leur état. Garder desired/applied pour différer les seuls changements automatiques.
**Rationale**: useSoundCues.setBusy sert aux sons et peut omettre pause, preview ou session de lecture. Les racines audio ne doivent pas être recréées par une clé de décor.
**Alternatives considered**: rechargement de l’app, interruption de média ou minuteur indépendant par feuille, écartés.

## R6 — Accessibilité et pause

**Decision**: conserver useFoliageMotion global appareil et prefers-reduced-motion comme priorités. Les thèmes conservent leur centre dégagé et des contrôles opaques lisibles.
**Rationale**: la pause actuelle n’est pas par profil ; l’extension ne doit pas promettre une migration implicite. Les événements restent facultatifs et sans son automatique.
**Alternatives considered**: confettis plein écran et lumières clignotantes, écartés par les exigences.

## R7 — Anniversaire et événements

**Decision**: fournir au résolveur l’indication autorisée de la date déjà connue, sans la persister dans un cache de décor invité ; période locale et priorité déterministes.
**Rationale**: aucune nouvelle collecte enfant et aucune donnée d’un autre profil. Auditer la règle existante du 29 février avant de raccorder le décor ; ne pas modifier le système d’anniversaire métier comme effet secondaire.
**Alternatives considered**: requête de profil supplémentaire ou nouvelle date obligatoire, écartées.

## R8 — Assets et preuve de validation

**Decision**: conserver les 19 PNG comme documentation, produire de petits assets optimisés séparément. Combiner tests de logique, audit des palettes et revue humaine de chaque variante réellement rendue.
**Rationale**: une planche statique ne prouve ni responsive ni contraste calculé ; la session précédente n’avait pas de contrôle navigateur fonctionnel.
**Alternatives considered**: déclarer RGAA conforme à partir des maquettes ou intégrer leur image entière comme page, écartées.
