# First ID PH

A mobile-first guide and searchable directory of Philippine IDs and supporting documents.

## Local development

Use Node.js 20.9 or newer. Run `npm install`, then `npm run dev`. Open http://localhost:3000. The app uses its bundled research catalog when Supabase environment variables are absent.

## Supabase

1. Apply the SQL in `supabase/migrations/20261126000100_create_id_guides.sql` to your Supabase project.
2. Run `supabase/seed.sql` to load the initial directory. Existing entries are preserved if you rerun the seed.
3. Copy `.env.example` to `.env.local` and set the project's URL and publishable key. Restart Next.js.
4. Edit content in Supabase Studio. Only published rows are public. Anonymous and authenticated application users have read-only access. Allow up to an hour for cached pages to refresh.

For a production build, set the same environment variables on a Next.js host, then run `npm run build`. The application does not require a Supabase secret key.

## One-on-one consultations

Apply `supabase/migrations/20261126000200_create_consultation_requests.sql` after the directory migration. In Supabase Auth, enable Email and allow the app's `/consultation` redirect, including the optional ID query parameter. Add the deployed URL to your Auth settings and configure SMTP for production sign-in emails.

Users sign up or sign in through an email link and can submit and view their own consultation requests. Staff can open `consultation_requests` in Supabase Studio, contact the requester by email to arrange a call, and update the status to `scheduled`, `completed`, or `cancelled`. When Supabase is absent the consultation page displays an availability notice.

## Walkthroughs and difficulty

The walkthroughs for the initial catalog live in `lib/walkthroughs.json` and join Supabase directory entries by slug. When adding a catalog entry, add a matching walkthrough there. Difficulty scores are editorial estimates from 1 to 5 based on prerequisites and application steps. Supporting documents have no difficulty score. Keep processing, delivery and pickup notes separate and update the timing source when an agency revises its service charter.

## Transactional email

For local Resend testing, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM_ADDRESS` in your gitignored `.env.local`. With `onboarding@resend.dev`, try `delivered@resend.dev` (a Resend test address) or your Resend account email. Use a verified sending domain when testing with other recipients.

Run `npm run email:test -- delivered@resend.dev` to try an explicit test send. Provider acceptance gives a message ID. Check provider logs or the real test inbox for delivery. The test command requires Node.js 22.9 or newer.

For production, set `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, and optionally `EMAIL_FROM_NAME` in the host's server environment. Configure a Brevo sender on your authenticated sending domain. Keep provider keys server-side and out of Git.

The adapter is ready for the future consultation email outbox. The current consultation form does not send a confirmation yet. Supabase Auth still sends sign-in and invitation links using its own SMTP settings. Set up Resend SMTP on a development Supabase project and Brevo SMTP on the production project if you also want those Auth emails to use these providers. Use SMTP credentials from each provider for that setup.

## Accounts and staff

Apply `supabase/migrations/20261126000300_create_account_profiles.sql` after the consultation migration. Set `SUPABASE_SECRET_KEY` and `APP_URL` on the Next.js server to enable staff administration. The secret key must never use a `NEXT_PUBLIC_` prefix. In Supabase Auth, enable Email, configure SMTP, and allow the app's `/account`, `/consultation`, `/staff/login`, and `/staff/setup` redirect destinations.

To establish the first admin, sign in as that user and verify their Supabase Auth user UUID. In the Supabase SQL Editor, run `update public.profiles set role = 'admin' where user_id = 'YOUR-AUTH-USER-UUID';`. Set a password using **Forgot your password?** on `/staff/login`. Then sign in there with your email and password and use **Manage consultants** to invite new consultant accounts or enable and disable staff access. Existing client accounts require an explicit role change by a database administrator.

Admins enter a full name, nickname, email address, and initial password when inviting a consultant. The invitation verifies the email address and directs the consultant to staff sign-in. Share the initial password separately. Consultants use `/staff/login` for future sign-ins and can reset their password there. Staff actions require a Supabase access token issued from a password sign-in. Clients continue to use email links.

## Guest consultations

Clients can submit at `/consultation` and check their request at `/track` without an account. Set a stable, random server-only `TRACKING_CODE_SECRET` of at least 32 characters. Changing it invalidates existing tracking codes. Apply the guest consultations migration first. On production, use a hosting proxy that replaces client-supplied forwarding headers with a verified client address. The app keeps a second global rate limit as a fallback. Every guest request needs an email address. Clients can add one Facebook or Instagram profile. Staff use these details for manual outreach.

For public consultation submissions, configure `CONSULTATION_PRIVACY_CONTROLLER`, `CONSULTATION_PRIVACY_EMAIL` and `CONSULTATION_PRIVACY_RETENTION` with the real operator, monitored privacy contact, and implemented retention policy. Development can test with sample data. Bump the notice version if its processing terms change. New guest submissions store the version and time of consent.
