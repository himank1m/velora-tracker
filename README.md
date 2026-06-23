# Velora Tracker

## Velora OS Phase 2 setup

Phase 2 adds the Finance & Profit Center, Document Vault, CRM profile fields,
shipment events, and vehicle lifecycle history without removing or renaming any
existing records.

1. Open the Supabase SQL editor for the project.
2. Run [`supabase/phase2-enterprise-core.sql`](supabase/phase2-enterprise-core.sql).
3. Reload Velora Tracker and confirm the compatibility-mode notice disappears.

The migration is additive: it uses `create table if not exists`, `add column if
not exists`, safe indexes, RLS policies, and triggers. It does not drop or
truncate existing tables.

The Document Vault uses the private `velora-documents` Supabase Storage bucket
created by the same migration. Accepted files are PDF, PNG, JPG, CSV, and DOCX,
with a 10 MB limit.

Velora Tracker is a Vite React application for Velora Motors operations. The same React codebase supports the production website, a Capacitor Android app, and a Tauri Windows desktop app.

## Website Build

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build the production website:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The website build still outputs to `dist/`, so Vercel deployment continues to work the same way.

## Capacitor Android Setup

The Capacitor configuration uses:

- App name: `Velora Tracker`
- App ID: `com.velora.tracker`
- Web output directory: `dist`

If Capacitor packages are not installed yet, run:

```bash
npm install
```

Add Android platform files:

```bash
npm run cap:add:android
```

After the Android project exists, sync future web changes into Android:

```bash
npm run cap:sync
```

Open the Android project in Android Studio:

```bash
npm run android
```

## Android APK

After running `npm run cap:sync`, build a debug APK from the Android project:

```bash
cd android
gradlew assembleDebug
```

The debug APK will be created under:

```text
android/app/build/outputs/apk/debug/
```

## Play Store AAB

For a Play Store bundle, open the Android project:

```bash
npm run android
```

Then in Android Studio:

1. Select `Build`.
2. Select `Generate Signed Bundle / APK`.
3. Choose `Android App Bundle`.
4. Follow the signing steps.

You can also build a release bundle from the Android folder after signing configuration is ready:

```bash
cd android
gradlew bundleRelease
```

The AAB will be created under:

```text
android/app/build/outputs/bundle/release/
```

## Supabase Auth For Mobile

The web app continues using the same Vercel environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

For local Android builds, create a project-root `.env` file before building:

```bash
copy .env.example .env
```

Then fill in the real Supabase values:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Vite embeds `VITE_` environment variables at build time. If you create or edit `.env`, rebuild and sync Android again:

```bash
npm run build
npx cap sync android
```

For mobile authentication redirects, add the Android WebView origin to Supabase Auth redirect URLs:

```text
https://localhost/*
```

Also keep your Vercel production URL in the Supabase redirect URL list.

## Google and Microsoft Sign-In

Velora Tracker supports Google and Microsoft through Supabase Auth. The selected
Velora role is used only when a social account signs in for the first time.
Existing users always keep the role stored in their `profiles` row.

In the Supabase Dashboard:

1. Open **Authentication > Providers**.
2. Enable Google and enter the Google OAuth client ID and secret.
3. Enable Azure and enter the Microsoft Entra application client ID and secret.
4. Copy the Supabase callback URL shown on each provider page into the
   corresponding Google Cloud or Microsoft Entra admin portal.
5. Add the deployed Velora URL and local development URL under
   **Authentication > URL Configuration > Redirect URLs**.

Recommended redirect entries:

```text
https://your-vercel-domain.vercel.app/**
http://127.0.0.1:5173/**
https://localhost/**
http://tauri.localhost/**
```

The existing unique database indexes continue limiting the `CEO` and
`Company Manager` roles to one profile each. Google and Microsoft sign-in do not
bypass those constraints or any existing row-level security policy.

## Tauri Windows Desktop

The Windows desktop app uses the same Vite source and production `dist/`
output as the website and Android app.

Desktop configuration:

- App name: `Velora Tracker`
- App identifier: `com.velora.tracker`
- Installer formats: Windows MSI and NSIS setup EXE
- Frontend output: `dist/`

### Windows prerequisites

Install these once on the Windows build machine:

1. Microsoft Visual Studio Build Tools with the **Desktop development with C++** workload.
2. The stable Rust toolchain from [rustup.rs](https://rustup.rs/).
3. Microsoft Edge WebView2 Runtime. It is already included on current Windows 10 and Windows 11 installations.

After installing Rust, restart the terminal and verify:

```bash
rustc --version
cargo --version
```

The Tauri npm scripts use the official Tauri v2 CLI through `npx`, keeping
the existing website dependency lock unchanged.

### Run the desktop app in development

Create the project-root `.env` file as described in the Supabase section,
then run:

```bash
npm install
npm run tauri:dev
```

Tauri starts Vite automatically and opens Velora Tracker in a native Windows
window. Supabase authentication and database access use the same build-time
environment variables as the website and Android app.

### Build Windows installers

Run:

```bash
npm install
npm run tauri:build
```

The build produces both installer types under:

```text
src-tauri/target/release/bundle/msi/
src-tauri/target/release/bundle/nsis/
```

The MSI folder contains the Windows `.msi` installer. The NSIS folder
contains the Windows setup `.exe`.

The standalone application executable is created at:

```text
src-tauri/target/release/velora-tracker.exe
```

For a production release, code-sign the installers with your Windows code
signing certificate before distribution.

## Public Application Downloads

Release installers are hosted directly by the Velora website from:

```text
/downloads/VeloraTracker-1.0.0.msi
/downloads/VeloraTracker-1.0.0-setup.exe
/downloads/VeloraTracker-1.0.0.apk
```

After Vercel deployment, prepend the production domain to obtain direct HTTPS
URLs. For example:

```text
https://your-vercel-domain.vercel.app/downloads/VeloraTracker-1.0.0.msi
```

These are static same-domain responses and do not use GitHub or external
redirects. The MSI URL can therefore be supplied where Microsoft Store
submission requires a direct HTTPS installer URL.

### Replacing release files

When publishing version `1.0.0`, replace the files in `public/downloads/`
with the newly signed artifacts while preserving these filenames:

```powershell
Copy-Item "src-tauri\target\release\bundle\msi\Velora Tracker_1.0.0_x64_en-US.msi" "public\downloads\VeloraTracker-1.0.0.msi" -Force
Copy-Item "src-tauri\target\release\bundle\nsis\Velora Tracker_1.0.0_x64-setup.exe" "public\downloads\VeloraTracker-1.0.0-setup.exe" -Force
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "public\downloads\VeloraTracker-1.0.0.apk" -Force
```

For a new version:

1. Add the new versioned files to `public/downloads/`.
2. Update the three links in `src/main.jsx`.
3. Update the matching download headers in `vercel.json`.
4. Run `npm run build`.
5. Commit the installer binaries and deploy to Vercel.

Always distribute signed production installers. The checked-in APK should be
replaced with a release-signed APK before public production distribution.

## Velora AI Assistant

Velora Tracker includes a role-aware AI assistant backed by the Supabase Edge
Function at:

```text
supabase/functions/ai-assistant
```

The website, Android app, and Windows app all call this same authenticated
function through the existing Supabase client. The Gemini API key is never
included in Vite, Vercel, Capacitor, Tauri, or frontend source code.

### Configure the secure Gemini secret

Install and authenticate the Supabase CLI, link this repository to the correct
Supabase project, create a Gemini API key in Google AI Studio, then set the
secret:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

The function uses the stable, free-tier compatible `gemini-2.5-flash-lite`
model by default. To select another supported Gemini model without changing
source code:

```powershell
supabase secrets set GEMINI_MODEL=gemini-2.5-flash-lite
```

Do not create a `VITE_GEMINI_API_KEY` variable and do not add the Gemini key to
Vercel frontend environment variables.

### Deploy the Edge Function

```powershell
supabase functions deploy ai-assistant
```

Supabase verifies the user JWT, then the function loads the caller's
`profiles.role`. It independently filters the company context by role and
removes financial fields for roles without financial permission before calling
the Google Gemini `generateContent` API.

The assistant can return action proposals, but it does not directly create,
edit, delete, approve, send, or update Supabase records. Suggestions marked as
destructive require an explicit confirmation before the app opens the relevant
module for review.

### Local function development

Store local function-only secrets in an ignored environment file such as
`supabase/.env.local`:

```text
GEMINI_API_KEY=your-local-gemini-key
GEMINI_MODEL=gemini-2.5-flash-lite
```

Then run:

```powershell
supabase functions serve ai-assistant --env-file supabase/.env.local
```

## Playwright Concurrency Test

The production concurrency suite runs ten independent browser tests in parallel
against:

```text
https://velora-tracker.vercel.app
```

It measures website startup, authentication-to-dashboard time, and each
role-permitted module navigation. Results are written to:

```text
test-results/load-summary.json
playwright-report/
```

### Install Playwright

Install dependencies and the Chromium browser once:

```powershell
npm install
npx playwright install chromium
```

### Configure ten test accounts

Copy the credential template:

```powershell
Copy-Item tests\load-users.example.json tests\load-users.json
```

Replace every placeholder with a real, dedicated test account. The file must
contain at least ten unique email addresses and is ignored by Git.

Each account object supports:

```json
{
  "label": "load-user-01",
  "email": "dedicated-test-user@example.com",
  "password": "test-account-password",
  "role": "Inventory Manager",
  "allowOrderCreation": false
}
```

You may alternatively provide the array through
`VELORA_LOAD_TEST_USERS_JSON`, or point `VELORA_LOAD_TEST_USERS_FILE` to
another JSON file.

### Run ten concurrent workers

```powershell
npm run test:load
```

The suite respects Velora RBAC. Every worker loads Command Center, then tests
Inventory, Orders, Shipments, and Reports only when that account's role permits
the module. RBAC-locked modules are recorded as skipped in the load summary.
This preserves the production restriction that only the unique CEO and Company
Manager accounts have access to every requested module.

### Optional test-order creation

Production writes are disabled by default. To create clearly marked
`LOAD-TEST` orders, set both controls:

1. Set `"allowOrderCreation": true` only on a dedicated CEO or Company Manager
   test account.
2. Run:

```powershell
$env:VELORA_LOAD_TEST_CREATE_ORDERS='true'
npm run test:load
```

The suite deletes its test order after verification by default. Set
`VELORA_LOAD_TEST_KEEP_ORDERS=true` only when you intentionally want to inspect
the marked records afterward.

To test another deployment without changing source:

```powershell
$env:VELORA_LOAD_TEST_URL='https://preview.example.com'
npm run test:load
```

## Branding Assets

Placeholder Velora branding assets are included in:

```text
resources/icon.svg
resources/splash.svg
public/app-icon.svg
```

Use `resources/icon.svg` and `resources/splash.svg` as source files when generating native Android launcher and splash assets.

## Velora OS Time Machine

Time Machine reconstructs the company state for a selected date from existing
orders, inventory, customers, shipments, procurement, finance, and workflow
events. It works immediately in compatibility mode and labels dates before the
first exact snapshot as reconstructed estimates.

To enable exact, permission-scoped daily snapshots, run this safe additive
migration in the Supabase SQL Editor:

```text
supabase/phase5-time-machine.sql
```

The migration creates only `public.company_snapshots`. It does not alter,
delete, rename, or duplicate any operational table. One compact snapshot is
stored per authenticated user, day, and role scope, so each role's history
contains only the data that role was permitted to load. RLS also prevents a
user who changes roles from reading snapshots created under a former, broader
role. Time Machine captures today's
snapshot when an authenticated user opens the module.

Historical behavior:

- Exact snapshots are preferred when one exists on or before the selected date.
- Older dates are reconstructed from record timestamps and workflow events.
- Compare mode calculates revenue, profit, inventory, shipment, customer, and
  health movement between two dates.
- Decision Replay links metric changes to the relevant company timeline.
- Digital Twin History Mode loads the reconstructed state into the existing
  operational twin.
- The AI assistant receives a permission-filtered 30-day historical summary
  suitable for future questions about changes, delays, customers, and suppliers.

## Velora OS Strategic War Room

The Strategic War Room is a deterministic future simulation environment built
on the permission-scoped Velora operating baseline. It projects commercial,
inventory, procurement, shipment, customer, payment, and supplier outcomes
without modifying any live company record.

The module works immediately in local simulation mode. To save scenarios across
devices, run this additive migration in the Supabase SQL Editor:

```text
supabase/phase6-strategic-war-room.sql
```

The migration creates only `public.strategic_scenarios`. Saved strategies are
isolated by authenticated user and current RBAC role. Changing roles does not
grant access to simulations created under a former role.

War Room capabilities:

- Monthly, quarterly, and annual projections.
- Sales, procurement, freight, logistics, payment, supplier, market, customer,
  vehicle category, and inventory-buffer assumptions.
- Revenue, expense, profit, outstanding-payment, procurement, freight,
  inventory, shipment, customer, delivery, and composite-risk forecasts.
- Growth, market-entry, freight-shock, supplier-failure, and payment-stress
  presets.
- Side-by-side comparison of up to three saved strategies.
- AI-ready baseline and scenario context for strategic questions.

After adding or changing the strategic AI context, redeploy the existing secure
Edge Function:

```powershell
supabase functions deploy ai-assistant
```

All outputs are planning estimates based on current records and explicit
assumptions. They are not guaranteed financial outcomes and are never
automatically applied to operational modules.

## Velora OS AI COO

The AI COO is Velora's digital executive layer. It continuously converts
permission-scoped company records into:

- A daily executive briefing.
- Critical issues and emerging risk alerts.
- Ranked commercial and operational opportunities.
- Explainable management recommendations.
- Prioritized advisory tasks.
- Customer, supplier, shipment, procurement, and inventory scores.
- Secure executive-chat context.

The monitoring and scoring engine is deterministic and remains available even
when the Gemini service is unavailable. Gemini receives the same filtered,
explainable context for executive conversation; it does not generate hidden
operational facts.

To persist task progress across devices, run:

```text
supabase/phase7-ai-coo.sql
```

The migration creates only `public.ai_coo_tasks`. It grants no delete policy and
does not alter operational tables. Tasks can be opened, started, completed, or
reopened, but the AI COO cannot execute the underlying recommendation.

Redeploy the secure assistant function after installing this phase:

```powershell
supabase functions deploy ai-assistant
```

AI COO safety policy:

- Recommendations always include the reason, evidence, expected impact, and
  confidence level.
- Financial insights remain unavailable to roles without Finance visibility.
- Task and insight history is isolated by authenticated user and current RBAC
  role.
- No procurement, payment, shipment, customer, supplier, order, or inventory
  action is executed autonomously.

## Velora OS Business Ecosystem

The Business Ecosystem layer introduces a scalable multi-company workspace
without replacing or deleting the existing Velora Motors records.

Install the additive migration:

```text
supabase/phase8-business-ecosystem.sql
```

The migration:

- Creates `companies`, `company_memberships`, `ecosystem_relationships`,
  `intercompany_transactions`, and `company_events`.
- Seeds Velora Motors as the primary company.
- Assigns all existing profiles and operational records to Velora Motors.
- Adds a `company_id` boundary to existing operational and intelligence tables.
- Adds restrictive tenant RLS underneath existing role policies.
- Preserves every existing record and table name.
- Prepares memberships for future supplier, customer, logistics, and partner
  portal accounts.

After installation, the company switcher scopes Inventory, Orders, Quotes,
Customers, Shipments, Procurement, Suppliers, Finance, Documents, timelines,
Time Machine snapshots, Strategic War Room scenarios, and AI COO tasks to the
selected company. Before installation, Velora continues in its original
single-company compatibility mode.

The Ecosystem Center provides:

- Cross-company revenue, profit, company, relationship, and health indicators.
- A visual network of companies, suppliers, customers, and logistics partners.
- Relationship scoring and strategic network analysis.
- Explicit inter-company transaction tracking.
- Ecosystem-wide company comparisons and timeline activity.
- AI COO ecosystem context for company, relationship, risk, and value questions.

Redeploy the AI COO function after installing this phase:

```powershell
supabase functions deploy ai-assistant
```

## Safety Notes

- The website remains a normal Vite React app.
- Capacitor is an additional platform target.
- Supabase database tables and data are not changed by the mobile setup.
- The Android app and website share the same Supabase backend.
