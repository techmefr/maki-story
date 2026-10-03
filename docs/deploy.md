# Mise en production : Neon et Vercel

À suivre le jour de la mise en production, **après** validation de Gaëtan sur la version locale. Rien de ce qui suit n'a été exécuté.

## Principe

- L'application applique elle-même les migrations au premier appel de la base (`server/utils/migrator.ts`, déclenché par `server/utils/db.ts`). Le premier déploiement de `main` migrera donc la base Neon tout seul. Il vaut mieux les appliquer à la main avant, pour voir les erreurs.
- Le contrôle `pnpm check:migrations` (monte, descend, remonte) passe sur une base vide ; il n'a pas été joué sur une copie de la base de production.

## Migrations à appliquer (16)

`0019_message_limit`, `0020_magic_links`, `0030_account_consent`, `0031_export_links`, `0032_magic_link_purpose`, `0033_allowed_providers`, `0045_tags`, `0050_notification_digest_items`, `0051_notification_digests`, `0052_delivery_queued_status`, `0053_book_access`, `0054_member_names`, `0055_book_isbn`, `0056_translated_languages`, `0057_line_previous_text`, `0058_page_title`.

Points d'attention :

- `0019` retire l'index d'unicité des messages (limite de 5 par expéditeur et destinataire).
- `0016` et suivantes sont déjà en production (modèle de données v3) ; ne rien renuméroter.
- Le jeu de formes du code enfant a changé (étoile, rond, cœur, carré, triangle, losange) : à vérifier sur un profil enfant existant avant la bascule.

## Avant

1. Sauvegarde Neon : créer une branche Neon de la base de production (instantané) ou exporter avec `pg_dump`.
2. Copie de test : créer une branche Neon temporaire, y lancer `DATABASE_URL=<branche> pnpm migrate:up`, puis ouvrir l'application dessus.
3. Variables d'environnement Vercel à vérifier ou à ajouter :
   - déjà nécessaires : `DATABASE_URL`, `SESSION_SECRET`, `APP_BASE_URL`, `BREVO_API_KEY`, `MAIL_FROM`.
   - nouvelles ou à confirmer : `SUPPORT_EMAIL` (contact des e-mails), `NUXT_PUBLIC_SUPPORT_EMAIL` (page Aide), `MAIL_POSTAL_ADDRESS` (adresse du pied des e-mails), `MAIL_SUPPORT`.
   - facultatives : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_*`, `VAPID_*`, `FCM_*`, `INSTANCE_ADMIN_EMAILS`.
   - ne pas activer : `AI_PROVIDER` et les clés d'IA (le domaine IA est reporté).
4. Vérifier que les tâches planifiées existent côté Vercel : `messages:purge` et `trash:purge` (03:00), `birthdays:remind` (07:00).

## Le jour J

1. Merge `dev` vers `main` (un seul merge, comme convenu).
2. Surveiller le déploiement Vercel et le journal des migrations.
3. Parcours de contrôle sur la production avec un compte de test :
   - connexion par lien magique (e-mail reçu en HTML),
   - création d'une famille, ajout d'un enfant, code enfant en formes,
   - invitation d'un proche par code de 6 caractères,
   - envoi d'un message vocal d'un adulte à un enfant, compteur n/5,
   - contrôle parental et écran verrouillé,
   - ajout d'un livre par ISBN, filtres de la bibliothèque,
   - page Aide et page d'erreur 404.
4. Commenter les issues #121 à #167 (épique #166).

## Retour arrière

- Code : revenir au déploiement Vercel précédent (promotion de l'ancien déploiement).
- Base : restaurer la branche Neon sauvegardée. Les migrations `down` existent mais détruisent les colonnes ajoutées (`first_name`, `isbn`, `previous_text`, `title`, `translated_languages`, `books_restricted`) : à éviter après des saisies réelles.
