# Auth

Type: technical

## Description

Add your layer description here.

## Fournisseur de mots de passe adulte

`AUTH_PROVIDER=legacy` reste le défaut. `AUTH_PROVIDER=supabase` utilise le SDK officiel côté serveur et exige SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY privées. Aucun de ces secrets n'est dans runtimeConfig.public. Un nom de fournisseur inconnu est refusé. Ne pas activer en production avant la fin de #193.

Migration progressive à la première connexion réussie : vérifier le hash local sous verrou de compte, créer l'identité avec maki_account_id dans les métadonnées administrateur, conserver accounts.id et toutes ses relations, enregistrer supabase_user_id unique. Après rattachement, aucun repli vers le hash local : le mot de passe Supabase fait autorité. Une création distante dont la réponse a été perdue peut être récupérée uniquement avec le mot de passe et la métadonnée de rattachement correspondante.

Les sessions de l'application restent des cookies HttpOnly signés ; aucun jeton Supabase n'est renvoyé au navigateur ni conservé en localStorage. Les sessions SDK temporaires sont fermées après validation. Changer un mot de passe invalide d'abord les sessions locales, puis met à jour le fournisseur et le hash de repli. Déconnexion et codes de profil conservent leur cycle local. Liens magiques et récupération des codes conservent leur usage unique, but et expiration côté application ; les identités OAuth restent soumises aux contrôles de vérification et fournisseurs autorisés existants.

Inscription : le compte local conserve un hash utilisable pour terminer la migration à la connexion suivante si le fournisseur tombe après création locale ; aucune session n'est ouverte en cas d'échec de rattachement.

Restent avant activation : suppression distante après suppression confirmée dans l'app (accord explicite demandé), intégration réelle sur le projet dédié, validation des connexions sociales et du cycle complet en mode Supabase. Domaine et SMTP sont reportés par Gaëtan (#194). La configuration supabase/config.toml est un projet de configuration sans secrets, non appliqué au projet distant.
