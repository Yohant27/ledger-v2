# Uni Finance

Phases 1–6 from the spec, plus: Settings page (editable daily target/warning), full current-month transaction list with Excel export, previous months with per-month Excel export, first-launch tutorial + backfill/skip onboarding, replay-tutorial button, delete-all-data with confirmation, and free cloud backup with a recovery code.

Same navy/paper Ledger design system. All data is local-first (IndexedDB via Dexie) — the cloud backup is a background convenience, not a requirement, and the app works fully offline either way.

## Deploying (same as before)
1. GitHub: new **private** repo, upload the *contents* of this folder to the repo root (not nested in a subfolder).
2. Vercel: Add New Project → import the repo → select **Vite** manually if it doesn't auto-detect → Deploy.
3. Send the Vercel URL to your friends. Each person who opens it gets their own completely separate local data — nothing is shared between different people just because they use the same link.

## Setting up cloud backup (optional but recommended — ~10 minutes, free)

Without this step, the app still works exactly as before, just local-only (like the current version). To enable backup + recovery codes:

1. **Create a free Supabase account:** go to https://supabase.com, sign up, click "New Project". Pick any name/region, set a database password (you won't need it again — Supabase asks for one during setup regardless).
2. **Create the backup table:** once the project's ready, open the **SQL Editor** (left sidebar) and run this:
   ```sql
   create table backups (
     recovery_code text primary key,
     data jsonb not null,
     updated_at timestamptz default now()
   );
   alter table backups enable row level security;
   create policy "anyone with the anon key can read/write"
     on backups for all
     using (true)
     with check (true);
   ```
   **Honest note on security:** this makes each backup readable/writable by anyone who both has your deployed app's public key AND guesses/knows a specific recovery code. The recovery code itself (a random 8-character string) is what actually protects each person's data — similar to a "anyone with this link" Google Doc, not a full login system. That's an appropriate tradeoff for a personal spending tracker shared among friends, but worth knowing plainly: this is not bank-grade access control.
3. **Get your keys:** in Supabase, go to Settings → API. Copy the **Project URL** and the **anon public** key (NOT the service_role key — never use that one here).
4. **Add them to Vercel:** in your Vercel project, go to Settings → Environment Variables. Add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
   Then go to Deployments → redeploy (or push any small change to trigger a fresh build — env vars only take effect on a new build).

Once this is live, every user gets a recovery code automatically the first time they use the app (shown in Settings), and their data backs up silently in the background whenever they're online.

## What's genuinely new here vs. Phase 1–6
- `src/components/Settings.jsx` — daily target/warning editing, navigation to history views, backup UI, delete-all
- `src/components/Onboarding.jsx` + `Tutorial.jsx` — first-launch flow and its replay button
- `src/components/MonthTransactions.jsx`, `PreviousMonths.jsx` — full history + Excel export (`src/exportExcel.js`)
- `src/supabase.js`, `src/sync.js`, `src/recoveryCode.js` — the cloud backup system
- `src/logic.js` — extended with a backfill amount and a starting-date override for someone's first month, tested against the spec's own worked example plus new edge cases

## Updating later
Same workflow as before: edit files on GitHub → "Create a new branch and start a pull request" → check the Vercel preview link → merge.
