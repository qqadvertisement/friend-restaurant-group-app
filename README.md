# Friend Restaurant Group App

Mobile-first React Native app for the Friend Restaurant Group, built with Expo. It has real Supabase Auth login/sign-up and routes each user to a role-specific home page (Customer, Employee, or Admin) read from a `profiles` table.

If `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` aren't set in `.env`, the app shows a "Supabase is not configured yet" message instead of crashing.

## Open The Website Locally

From PowerShell, go to the project folder:

```powershell
cd "C:\Users\Kevin\Desktop\Friend Restaurant group"
```

Install dependencies if needed:

```powershell
npm.cmd install
```

Start the Expo web server:

```powershell
npx.cmd expo start --web --clear --port 8082
```

Open this URL in your browser:

```text
http://localhost:8082
```

Use `npm.cmd` or `npx.cmd` in PowerShell because plain `npm` may be blocked by the Windows execution policy.

If port `8082` is already in use, Expo may suggest another port. Use the port Expo shows and open that matching localhost URL instead.

## Supabase Environment Setup

Create a `.env` file in the project root:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

You can copy the variable names from `.env.example`.

Find these values in Supabase:

- Open your Supabase project dashboard.
- Go to `Project Settings` > `API`.
- Copy the Project URL.
- Copy the publishable key or anon public key.

Do not use the service-role key in this app.

### `public.profiles` table

The app expects a `profiles` table with at least these columns:

- `id` — matches the Supabase Auth user ID (primary key).
- `account_name` — text.
- `email` — text.
- `role` — text, one of `customer`, `employee`, or `admin`.
- `point_balance` — numeric, used on the customer home page.

Row Level Security should allow a signed-in user to read and insert only their own row (`id = auth.uid()`), and should block a user from setting their own `role` to anything other than `customer` on insert, and from updating `role` at all. New accounts created through the app are always inserted with `role: 'customer'` — `employee` and `admin` accounts must be promoted manually (e.g. via the Supabase dashboard/SQL editor), the app itself has no UI for changing roles.

## Stop The Local Website

If the Expo terminal is still open, press:

```text
Ctrl + C
```

If the server is running in the background, find the process using port `8082`:

```powershell
netstat -ano | findstr :8082
```

Then stop it using the PID from the `LISTENING` line:

```powershell
Stop-Process -Id PID_NUMBER -Force
```

Example:

```powershell
Stop-Process -Id 10896 -Force
```

## Important Files

### `package.json`

Defines the project name, npm scripts, and dependencies.

Important scripts:

- `npm.cmd run start`: starts Expo.
- `npm.cmd run web`: starts Expo directly in web mode.
- `npm.cmd run android`: starts Expo for Android.
- `npm.cmd run ios`: starts Expo for iOS.

Important dependencies:

- `expo`: Expo app runtime and development tools.
- `react`: React UI library.
- `react-native`: React Native app framework.
- `react-dom`: required for running React on the web.
- `react-native-web`: maps React Native components to web elements.
- `@expo/metro-runtime`: required by Expo Metro for web bundling.
- `@supabase/supabase-js`: Supabase client (Auth + database queries).
- `@react-native-async-storage/async-storage`: persists the Supabase session between app reloads.

### `package-lock.json`

Locks the exact installed dependency versions. This helps the project install the same package versions on another machine.

### `app.json`

Expo configuration for the app. It sets the app name, slug, version, orientation, splash background color, and web bundler settings.

### `babel.config.js`

Babel configuration used by Expo to transform JavaScript and JSX so the app can run in React Native and on the web.

### `App.js`

Main app entry component. It controls which screen is visible and handles session/role routing:

- On load, checks for an existing Supabase session (`supabase.auth.getSession()`). If one exists, it looks up the user's profile and role and routes straight to that role's home screen, so refreshing the app preserves where you were.
- Shows `LoginScreen` by default.
- Switches to `SignUpScreen` when the user taps `Sign Up`.
- Switches back to `LoginScreen` after account creation, with a confirmation notice, or when the user taps `Log In` from the sign-up screen.
- After a successful login, routes to `AdminHomeScreen`, `EmployeeHomeScreen`, or `CustomerHomeScreen` based on the profile's `role`.
- `handleLogout` calls `supabase.auth.signOut()` and returns to the login screen. Every role screen uses the same logout handler.

### `src/screens/LoginScreen.js`

Login screen UI and logic.

It includes:

- App logo/name area.
- Email input.
- Password input.
- Show/hide password button.
- Login button with loading state.
- Frontend validation (required fields, email format, 8+ character password).
- Calls `supabase.auth.signInWithPassword`.
- On success, fetches `account_name, email, role` from `profiles` by the authenticated user's ID (not by name or email) and validates the role (`isValidRole`) before handing off to `App.js`.
- Shows a clear error message for: bad credentials, a query failure (also logged to the console), a missing profile row, or an unrecognized/missing role.
- Link to the sign-up screen.

### `src/screens/SignUpScreen.js`

Account creation screen UI and logic.

It includes:

- Account name input.
- Email address input.
- Password input.
- Confirm password input.
- Show/hide password buttons.
- Create Account button with loading state.
- Frontend validation (required fields, email format, 8+ character password, matching confirmation).
- Calls `supabase.auth.signUp`, storing the account name in Supabase Auth user metadata.
- Inserts a matching row into `public.profiles` (`id`, `account_name`, `email`, `role: 'customer'`) using the new Auth user's ID.
- Shows a clear error if either the Auth sign-up or the profile insert fails.
- Signs the new user out immediately (if Supabase auto-signed them in) and returns to the login screen with an "Account created successfully" notice.
- Link back to the login screen.

### `src/screens/CustomerHomeScreen.js`

Home page shown after a `customer` logs in. Shows:

- `Welcome, [account name]`.
- Current point balance, loaded from `profiles.point_balance` for the signed-in user's ID. Shows `Loading point balance...` while fetching, `Unable to load point balance.` on failure (error logged to the console), and treats a missing/null balance as `0`. The balance is fetched once when the screen mounts (covers login, page-open, and session-restore) — there's no polling and no way for the customer to edit it.
- A Restaurant dropdown (Ramen, Sushi, Thai Food). Selecting one opens a temporary placeholder page ("Here is the [Restaurant] restaurant page.") with a Back button that returns to the home page.
- Logout button.

### `src/screens/EmployeeHomeScreen.js`

Home page shown after an `employee` logs in. Shows:

- `Welcome, [account name]`.
- Restaurant (static placeholder, "Not selected").
- A "Search Customer Account" input and Search button. Pressing Search shows a temporary message ("Customer search is not connected yet.") — it does not query Supabase.
- Logout button.

### `src/screens/AdminHomeScreen.js`

Home page shown after an `admin` logs in. Shows:

- `Welcome, [account name]`.
- Three buttons: Manage Customers, Manage Employees, App Analysis Report. Each just reveals a temporary "... is not available yet." message — none of them are wired to real data yet.
- Logout button.

### `src/components/FormInput.js`

Reusable form input component used by the auth screens and the employee search box.

It handles:

- Label text.
- Text input.
- Error message display.
- Secure password fields.
- Show/hide password button.
- Keyboard and autocomplete settings.

### `src/components/PrimaryButton.js`

Reusable primary action button, used throughout the auth screens and all three role home screens.

It handles:

- Button press state.
- Disabled loading state.
- Loading spinner.
- Consistent button styling.

### `src/styles/authStyles.js`

Shared styles for the whole app (login, sign-up, and all three home screens).

It defines:

- Color palette.
- Screen layout.
- Logo styling.
- Form card styling.
- Input styling.
- Button styling.
- Error and success message styling.
- Responsive mobile-first spacing.

### `src/utils/validation.js`

Small validation helper file.

Currently includes:

- `isValidEmail(value)`: checks whether an email has a valid basic format.

### `src/utils/roles.js`

Defines the set of valid account roles.

- `isValidRole(role)`: returns `true` only for `admin`, `employee`, or `customer`. Used by `LoginScreen.js` and `App.js` to treat any other value (including `null`/`undefined`) as an error rather than guessing a screen.

### `src/lib/supabaseClient.js`

Creates the Supabase client used throughout the app.

It reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

It also configures React Native auth session storage with AsyncStorage (so sessions survive a page reload), and exports `isSupabaseConfigured` / `supabaseConfigError` so the screens can show a clear message when the `.env` values are missing instead of throwing.

## Current Behavior

- All fields are required on login and sign-up.
- Email must use a valid email format.
- Password must be at least 8 characters.
- Confirm password must match the password.
- Password fields hide text by default and can be toggled visible.
- Login and Create Account buttons show a loading state.
- Login uses Supabase Auth (`signInWithPassword`), then loads the user's profile/role and routes to that role's home page.
- Account creation uses Supabase Auth (`signUp`) plus an insert into `profiles` with `role: 'customer'`, then signs the user out and sends them back to the login screen.
- Passwords are handled by Supabase Auth and are never stored in `profiles`.
- Refreshing the app restores the existing session and routes straight back to the correct role's home page.
- Logout (available on all three home pages) signs out of Supabase and returns to the login screen.
- If Supabase env vars aren't set, the login/sign-up screens show a "Supabase is not configured yet" error instead of attempting the request.

## Notes

- No backend beyond Supabase is included (no custom API/server).
- Social login and password recovery are not included yet.
- The customer, employee, and admin home pages are intentionally simple placeholders — restaurant selection, customer search, and admin management/reporting are not connected to real data yet (see the file descriptions above for exactly what's stubbed).
- Only the app can insert a new `profiles` row, and only with `role: 'customer'`. Promoting an account to `employee` or `admin` is a manual step outside the app.
