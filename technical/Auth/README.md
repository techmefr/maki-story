# Auth

Type: technical

## Description

Add your layer description here.

## Fournisseur de mots de passe adulte

`AUTH_PROVIDER=legacy` reste le défaut. `AUTH_PROVIDER=supabase` utilise le SDK officiel côté serveur et exige SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY privées. Aucun de ces secrets n'est dans runtimeConfig.public. Un nom de fournisseur inconnu est refusé. L’activation de production reste une étape explicite de la publication ; elle n’est pas déclenchée par le déploiement du code.

Migration progressive à la première connexion réussie : vérifier le hash local sous verrou de compte, créer l'identité avec maki_account_id dans les métadonnées administrateur, conserver accounts.id et toutes ses relations, enregistrer supabase_user_id unique. Après rattachement, aucun repli vers le hash local : le mot de passe Supabase fait autorité. Une création distante dont la réponse a été perdue peut être récupérée uniquement avec le mot de passe et la métadonnée de rattachement correspondante.

Les sessions de l'application restent des cookies HttpOnly signés ; aucun jeton Supabase n'est renvoyé au navigateur ni conservé en localStorage. Les sessions SDK temporaires sont fermées après validation. Changer un mot de passe invalide d'abord les sessions locales, puis met à jour le fournisseur et le hash de repli. Déconnexion et codes de profil conservent leur cycle local. Liens magiques et récupération des codes conservent leur usage unique, but et expiration côté application ; les identités OAuth restent soumises aux contrôles de vérification et fournisseurs autorisés existants.

Inscription : le compte local conserve un hash utilisable pour terminer la migration à la connexion suivante si le fournisseur tombe après création locale ; aucune session n'est ouverte en cas d'échec de rattachement.

Suppression explicitement autorisée par Gaëtan le 2026-10-19 : la suppression locale confirmée inscrit les seules identités rattachées aux comptes effectivement supprimés dans auth_identity_deletions (migration 0070). Une transaction annulée ne crée aucune demande. Le traitement tente la suppression distante immédiatement puis quotidiennement à 03:00 via auth:purge ou /api/cron/auth, protégé par CRON_SECRET. Les erreurs restent en attente ; les identités encore rattachées à un compte actif sont préservées. Le traitement concurrent réserve les lignes et une identité distante déjà absente est considérée supprimée. Aucune identité n’est supprimée lors d’une migration ou connexion.

Validation : tests PostgreSQL réels de rollback, panne, reprise et concurrence ; test SDK simulé ; test réel sur le projet dédié avec une identité jetable sans envoi de mail (création, connexion, protection du rattachement, récupération de création, changement de mot de passe, rejet de l’ancien, suppression et répétition). Le contrôle distant est explicite : SUPABASE_LIVE_CHECK=1 avec les deux variables privées, puis node --experimental-strip-types --test tests/integration/supabase-live.test.ts. Il ne touche pas aux identités existantes.

Les connexions sociales et liens magiques restent sur les parcours locaux existants ; ils ne sont pas migrés vers Supabase. Les protections de fournisseur autorisé, identité vérifiée, état/nonce et finalité des liens sont conservées. Les connexions interactives aux fournisseurs sociaux et les appareils physiques restent à essayer lors de la recette, sans E2E dans ce lot.

Domaine et SMTP sont reportés par Gaëtan (#194). La configuration supabase/config.toml est un projet de configuration sans secrets, non appliqué au projet distant. Avant activation : définir les variables privées du serveur cible, appliquer et vérifier la configuration Auth avec les URLs finales, puis effectuer une connexion de recette. Le fournisseur legacy reste le défaut tant que cette étape n’est pas réalisée.
