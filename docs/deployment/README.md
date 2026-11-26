# Deployment and release workflow

[Back to the project README](../../README.md)

## Promote a release

1. Open a pull request from your feature branch into `main`.
2. Open a pull request from `main` into `staging`. Deploy it to the staging environment and run the smoke checks below.
3. Open a pull request from `staging` into `production`. Compare the changes with the staging revision that passed verification, then deploy.
4. Record the production commit and the applied Supabase migrations with the release.

Configure the hosting provider to deploy the appropriate branches. The GitHub branches are source references. The host and its environment settings control what runs online.

Use separate Supabase projects, secrets, sender configuration, and domains for staging and production. Use sample data in staging.

## Configure the host

Use [`.env.example`](../../.env.example) as the template. Supply the values before building with `npm ci` and `npm run build`. On a self-managed Next.js host, start the built app with `npm start`. On a managed host, configure the equivalent Node.js build and start settings.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for this environment. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project’s browser-safe publishable key. |
| `SUPABASE_SECRET_KEY` | Server-only Supabase key for staff management and guest APIs. |
| `APP_URL` | The deployed site origin. Auth invitations use it to build a redirect URL. |
| `CONSULTATION_PRIVACY_CONTROLLER` | Name of the organization or person responsible for consultation data. |
| `CONSULTATION_PRIVACY_EMAIL` | Monitored email address for privacy requests. |
| `CONSULTATION_PRIVACY_RETENTION` | The actual retention policy in plain language. This value is published in the notice. |

Keep real env files and credentials out of Git. Configure a trusted proxy that replaces client-supplied forwarding headers with the verified client address for rate limiting.

The production request form is disabled until all three privacy settings are valid. Set a retention period the team can actually enforce. Update the [notice version](../../lib/consultation-privacy.ts) when the processing terms change.

## Apply database migrations

From an authenticated Supabase CLI session, check the target project before each environment update:

```sh
supabase link --project-ref YOUR_ENVIRONMENT_PROJECT_REF
supabase migration list --linked
supabase db push --dry-run
supabase db push
```

For a new project that needs the published ID catalog, append `--include-seed` to the dry run and push. The seed leaves existing guide rows in place. Check migration history again after the push.

The tracking migration generates a Supabase Vault key on a fresh environment. When moving an existing environment with issued codes, carry over its tracking key under the Vault name `first_id_consultation_tracking` before accepting requests. Replacing the key invalidates those codes.

Review migrations before release. If the Supabase project has migration history absent from this repository, reconcile that history before pushing.

## Configure staff sign-in

Enable email authentication in Supabase and configure custom SMTP. Set the site URL and allow the exact environment URLs for `/staff/login` and `/staff/setup`.

To bootstrap the first administrator, create and confirm the intended Auth user, verify their UUID, and assign the role in the Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where user_id = 'YOUR-AUTH-USER-UUID';
```

The admin can set a password through **Forgot your password?** and sign in at `/staff/login`. The dashboard’s **Add consultant** form collects a full name, nickname, email, and initial password. Share the password separately from the invitation.

Use Brevo SMTP in production if Brevo is your Auth mail provider. App-level `EMAIL_PROVIDER`, `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, and optional `EMAIL_FROM_NAME` configure the separate transactional adapter. Local adapter tests can use Resend via `npm run email:test -- delivered@resend.dev`. Guest tracking codes are shown on-screen. Consultants contact clients manually.

## Verify before going live

- Confirm the homepage, ID finder, directory, and guides load on desktop and mobile.
- Send a sample consultation with consent, save its code, and verify that tracking exposes only status and meeting time.
- Sign in as a consultant, claim the sample ticket, and move it through reached out, meeting scheduled, and closed. Verify that contact details appear only after claim for consultants.
- Sign in as an admin and check pending invitations, pagination, and account controls. Test invitation and password-reset delivery on the deployed domain.
- Verify the published privacy notice and confirm that any demonstration staff accounts have been disabled before opening production to real clients.
