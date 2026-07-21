# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Install dependencies:

```powershell
npm.cmd install
```

Run the app (this project is developed/tested via the web target):

```powershell
npx.cmd expo start --web --clear --port 8082
```

Other platforms (same Expo dev server, different target):

```powershell
npm.cmd run start    # expo start
npm.cmd run android  # expo start --android
npm.cmd run ios      # expo start --ios
```

Use `npm.cmd` / `npx.cmd` in PowerShell — plain `npm`/`npx` can be blocked by the Windows execution policy.

There is currently **no lint, typecheck, or test tooling configured** (no ESLint/Prettier config, no test runner, no scripts for either in `package.json`). Verifying a change means running the app via `expo start --web` and exercising the flow manually, or at minimum transpiling changed files with the project's own Babel config to catch syntax errors:

```powershell
node -e "require('@babel/core').transformFileSync('path/to/File.js', { presets: ['babel-preset-expo'] })"
```

## Architecture

This is an Expo (React Native + react-native-web) app with **no navigation library** — `App.js` is a single component holding a `screen` string in state (`'login' | 'signup' | 'admin' | 'employee' | 'customer'`) and conditionally rendering one screen component at a time. There are no routes/URLs to reason about; "navigating" just means calling a `setScreen(...)` setter passed down as a prop.

### Auth + role routing flow

1. **Supabase Auth** (`src/lib/supabaseClient.js`) is the only backend. The client reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env` and exports `isSupabaseConfigured` — every screen that talks to Supabase checks this first and shows `supabaseConfigError` instead of calling a null client.
2. **`public.profiles`** is the one app table, keyed by the Supabase Auth user ID. Columns in use: `id`, `account_name`, `email`, `role` (`'customer' | 'employee' | 'admin'`), `point_balance`. RLS is assumed to allow a user to read/insert only their own row, to force `role: 'customer'` on self-insert, and to block self-updating `role` at all — the app never writes `role` anywhere except the hardcoded `'customer'` at sign-up, and there is no UI path to change a role. Promoting a user to `employee`/`admin` is a manual, out-of-app step (Supabase dashboard/SQL editor).
3. **`src/utils/roles.js`** (`isValidRole`) is the single source of truth for what counts as a valid role. Both the post-login fetch (`LoginScreen.js`) and the session-restore fetch (`App.js`) run the identical query (`select account_name, email, role ... eq('id', user.id) ... maybeSingle()`) and gate on `isValidRole` — an unrecognized or missing role is always treated as an error, never silently defaulted to a screen.
4. **Session persistence**: `supabaseClient.js` configures AsyncStorage for the Supabase Auth session. `App.js` calls `supabase.auth.getSession()` on mount and re-runs the profile lookup to route straight to the correct role screen on refresh — this restore logic is duplicated (not shared as a hook) with the post-login logic in `LoginScreen.js`, so a change to one path (e.g. new profile fields, new error handling) usually needs the mirrored change in the other.
5. Each role gets its **own screen component** (`AdminHomeScreen.js`, `EmployeeHomeScreen.js`, `CustomerHomeScreen.js`) rather than one shared parameterized screen — this was a deliberate choice once the three roles' content diverged (see git history / prior session context), so new role-specific features belong in that role's file, not a shared component.

### Shared UI layer

- `src/styles/authStyles.js` is a single `StyleSheet` used by *every* screen (login, sign-up, and all three home screens) — there's no per-screen stylesheet. Add new shared visual patterns here rather than inlining styles.
- `src/components/FormInput.js` and `src/components/PrimaryButton.js` are the only reusable UI primitives; both auth screens and the employee search box reuse `FormInput`, and every screen's action buttons (including all three "Logout" buttons) reuse `PrimaryButton`.

### Current placeholder surfaces

The customer/employee/admin home pages are intentionally stubbed beyond what's wired to Supabase:
- **Customer**: point balance is live (`profiles.point_balance`, loaded once on mount); the restaurant dropdown and per-restaurant pages are static local state, not backed by data.
- **Employee**: customer search input/button only sets a canned "not connected yet" message — no query is sent.
- **Admin**: "Manage Customers" / "Manage Employees" / "App Analysis Report" buttons only reveal a canned placeholder message each — no real screens or data behind them.

Don't assume these are unfinished bugs — they're deliberately out of scope until a future task asks for them specifically.
