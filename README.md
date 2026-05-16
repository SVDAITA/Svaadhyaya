# Svaadhyaya — स्वाध्याय

> Your daily practice. Your life, witnessed.

## Tech Stack
- React 18 + Vite
- Material UI v5 (dark/light theme)
- Supabase (PostgreSQL + Auth + RLS)
- React Router v6
- TanStack Query v5
- Recharts
- vite-plugin-pwa (PWA support)
- Hosted on Hostinger (svaadhyaya.in)

---

## Local Development Setup

### Prerequisites
- Node.js v18+ (download from nodejs.org)
- VS Code
- Supabase account (supabase.com)

### Step 1 — Clone / copy project
Copy this entire folder to your computer.

### Step 2 — Install dependencies
Open terminal in the project folder:
```bash
npm install
```

### Step 3 — Environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```
Find these in: Supabase Dashboard → Settings → API

### Step 4 — Set up database
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase_schema.sql` from this project
3. Copy the entire contents
4. Paste into SQL Editor and click Run
5. You should see "Success" with no errors

### Step 5 — Run development server
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

---

## Supabase Auth Setup

### Enable Email Auth
1. Supabase Dashboard → Authentication → Providers
2. Email provider is enabled by default
3. Optionally disable "Confirm email" for testing (re-enable for production)

### Set Redirect URLs
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://svaadhyaya.in`
3. Redirect URLs: add `https://svaadhyaya.in/auth/reset-password`

---

## Production Build

### Build command
```bash
npm run build
```
This creates a `dist` folder with all static files.

### Preview build locally (optional)
```bash
npm run preview
```

---

## Deployment to Hostinger

### Step 1 — Build
```bash
npm run build
```

### Step 2 — Upload to Hostinger
1. Log into Hostinger hPanel
2. Go to File Manager
3. Navigate to `public_html`
4. Delete any existing files (if fresh install)
5. Upload all contents of the `dist` folder (NOT the dist folder itself, its contents)
6. Also upload `public/.htaccess` to `public_html/.htaccess`

### Step 3 — Verify .htaccess
The `.htaccess` file must be in `public_html/` root.
It handles React Router URLs so refreshing a page doesn't give 404.

### Step 4 — SSL Certificate
1. Hostinger hPanel → SSL
2. Enable free Let's Encrypt certificate for svaadhyaya.in
3. Force HTTPS (already in .htaccess)

### Step 5 — Environment variables on Hostinger
Vite bakes environment variables into the build at build time.
This means your Supabase URL and key are embedded in the JS bundle.
This is SAFE — the anon key is designed to be public.
The security comes from Supabase Row Level Security (RLS), not from hiding the key.

### Step 6 — Update Supabase for production
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://svaadhyaya.in`
3. Additional redirect URLs: `https://svaadhyaya.in/auth/reset-password`

### Step 7 — Test
- Open https://svaadhyaya.in
- Create an account
- Verify email (check inbox)
- Sign in
- Test all navigation
- Test night flow
- Test disruption page

---

## Seed Your Milestones

After creating your account:
1. Supabase Dashboard → Authentication → Users
2. Copy your User UID (looks like: abc123-...)
3. Supabase Dashboard → SQL Editor
4. Go to bottom of `supabase_schema.sql`
5. Uncomment the INSERT statements
6. Replace `YOUR_USER_ID` with your UID
7. Run

---

## Common Errors and Fixes

### "Missing Supabase environment variables"
Your `.env` file is missing or has wrong variable names.
Check: file is named exactly `.env` (not `.env.txt`)
Check: variables start with `VITE_`

### White screen after login
Usually a routing issue. Check browser console for errors.
Most common cause: missing page component. All routes have placeholder pages.

### 404 on page refresh (Hostinger)
The `.htaccess` file is missing from `public_html/`.
Upload it manually from `public/.htaccess`.

### Supabase RLS error: "new row violates row-level security policy"
You are not authenticated. Sign out and sign back in.
Or: you ran the schema SQL before creating your account.
Fix: run the schema SQL again after creating your account.

### Email confirmation not arriving
Check spam folder.
Or: in Supabase Dashboard → Authentication → Email Templates — verify templates are set up.
Or: disable email confirmation temporarily for testing.

### Build error: "Cannot find module './pages/...' "
A page file is missing. All pages should exist as placeholder files.
Run the project — VS Code will show the exact missing file.

---

## Project Structure

```
src/
├── components/
│   ├── auth/          ← ProtectedRoute
│   └── layout/        ← AppLayout (sidebar + nav)
├── hooks/
│   ├── useAuth.jsx    ← Auth state and functions
│   └── useTheme.jsx   ← Dark/light toggle
├── lib/
│   └── supabase.js    ← Supabase client
├── pages/
│   ├── auth/          ← Login, Signup, Password pages
│   ├── svadhyaya/     ← Today, Dashboard, Area pages
│   ├── vision/        ← 10-year goal documents
│   └── tracker/       ← Finance OS, Health OS, Diet etc.
├── theme/
│   └── index.js       ← MUI theme (dark + light)
├── App.jsx            ← Routes
└── main.jsx           ← Entry point
```

---

## Next Build Sessions

### Session 2 — Area pages
Build all 6 Āyāmam pages with goals, micro-targets, logs, insights.

### Session 3 — Finance Tracker
Daily spend logger, loan tracker, corpus tracker, budget vs actual.

### Session 4 — Health Tracker
Weight log, measurements, Fitelo compliance, walk streak graph.

### Session 5 — Vision documents
10-year goal documents for each area. Editable, beautiful, inspiring.

### Session 6 — Diet page
Weekly editable Fitelo plan. Simple food compliance on Svadhyaya Today.

### Session 7 — Career OS
Projects board, certifications, ADRs, Friday notes.

### Session 8 — PWA icons + polish
App icons, splash screen, offline mode, final polish.

---

## The One Rule

**Never miss twice. In any area. Ever.**
