# First ID PH

First ID PH helps adults 18 and older get a valid Philippine ID. Visitors can answer a short document checklist, compare application routes, and follow the issuing agency’s instructions. If they need help, they can request a consultation and track it with an eight-letter code.

## What’s in the app

| Area | What visitors and staff can do |
| --- | --- |
| ID finder and directory | Compare IDs by the documents already on hand, application effort, processing time, and delivery or pickup. |
| Guest consultations | Submit a request with a document checklist, email address, and an optional Facebook or Instagram profile. Give privacy consent and save the tracking code. |
| Request tracking | See the current stage and any scheduled meeting in Philippine time. |
| Staff dashboard | Admins manage consultants and see the queue. Consultants claim tickets, contact clients manually, and record progress through closure. |

**Stack** is Next.js App Router, TypeScript, Tailwind CSS, and Supabase Postgres and Auth.

## Run locally

Use Node.js 22.9 or later if you plan to run the email test command. The web app can run on Node.js 20.9 or later.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With both public Supabase variables blank, the app reads the bundled ID directory. Staff sign-in and consultation submissions require a configured Supabase project. See [Deployment and release workflow](docs/deployment/README.md) for the full environment list and database setup.

Useful routes:

- `/find-id` for guided ID recommendations
- `/#directory` for the searchable directory
- `/consultation` and `/track` for guest requests
- `/staff/login` and `/staff/dashboard` for staff
- `/privacy` for the consultation privacy notice

## Maintain the directory

The initial catalog lives in [`lib/catalog.json`](lib/catalog.json) and [`supabase/seed.sql`](supabase/seed.sql). Edit published entries in Supabase Studio. The homepage can take up to an hour to show an update.

Walkthroughs live in [`lib/walkthroughs.json`](lib/walkthroughs.json) and match catalog entries by slug. Include the issuing agency’s source, distinguish processing from delivery or pickup, and state when timing depends on the office. Difficulty scores reflect application effort. Supporting documents carry no score.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Default development branch. Merge reviewed changes here. |
| `staging` | Test a release with sample requests and staff accounts before promoting it. |
| `production` | Release branch for the live site. Promote only a revision tested on staging. |

See the [deployment guide](docs/deployment/README.md) for Supabase migrations, staff onboarding, environment settings, and release checks.
