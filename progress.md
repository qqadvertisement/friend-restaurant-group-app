# Project Progress and Agent Handoff

This file is the authoritative handoff for the current codebase. Read it before changing the project, and update it whenever application behavior, project structure, or a Supabase dependency changes.

## Project overview

Friend Restaurant Group is a mobile-first Expo React Native application that also runs on the web through React Native Web. Supabase provides authentication, database access, RPC calls, and public menu, reward, and news image storage.

Supported account roles:

- `customer`
- `employee`
- `admin`

The app does not use React Navigation or URL routes. `App.js` stores the active top-level screen in React state and conditionally renders the matching component.

## Current repository state

- Git branch: `main`
- Current committed revision: `be710d5` (`origin/main`)
- The restaurant-table migration, reusable restaurant screens, menu, reward, and news image UIs, related styles, and documentation updates are currently uncommitted working-tree changes.
- `CLAUDE.md` is deleted in the current working tree.
- Do not discard or overwrite existing working-tree changes when starting another task.

## Work completed on August 6, 2026

- Added reward images to the reusable redeem page. The rewards query now selects `image_path`, generates public URLs from the `reward-images` bucket, and renders mobile reward cards with a fixed 180-pixel `contain` image area.
- Added reward-image fallback behavior. Null paths, missing public URLs, and image load failures display an `Image unavailable` placeholder without affecting redemption.
- Preserved reward filtering by `restaurant_id` and kept the existing `redeem_reward(p_reward_id)` RPC, point-balance updates, and redemption behavior unchanged.
- Replaced the inline Restaurant News mockup with reusable `RestaurantNewsScreen.js`, connected through the existing Restaurant News button and selected `restaurantId`/`restaurantName` state.
- Connected Restaurant News to `public.restaurant_news`. The query returns active rows for the selected `restaurant_id` only when `published_at` is current or past and `expires_at` is null or still in the future, ordered newest-first.
- Added public news images from the `news_images` bucket and scrollable mobile news cards showing the title, content, published date, optional expiration date, and a fixed 200-pixel `contain` image area.
- Added Restaurant News loading, query-error, empty, missing-image, image-load-error, and Back states.
- Updated `README.md` and this handoff for the new reward-image and Restaurant News behavior.
- Validated all JavaScript files with Babel, completed production Expo web exports, ran Expo's dependency compatibility check, and passed `git diff --check`. The project still has no configured lint or type-check commands.
- No Supabase schema, RLS, Storage configuration, authentication, reward redemption, or point logic was modified.

## Runtime and dependencies

- Expo SDK 51
- React 18.2
- React Native 0.74
- React Native Web 0.19
- Supabase JavaScript client 2.x
- Babel with `babel-preset-expo`

`package.json` only defines `start`, `android`, `ios`, and `web` scripts. There is no configured lint script, type checker, formatter, or automated test runner.

## Project structure

```text
Friend Restaurant group/
  App.js                         # Top-level screen state, role routing, and logout
  app.json                       # Expo application configuration
  babel.config.js                # Expo Babel preset
  package.json                   # Scripts and direct dependencies
  package-lock.json              # Locked dependency tree
  README.md                      # Short project overview and setup
  progress.md                    # Detailed project handoff
  .env.example                   # Required public Supabase variables
  .gitignore                     # Ignores secrets, dependencies, and Expo output
  src/
    components/
      FormInput.js               # Shared labeled input and password visibility UI
      PrimaryButton.js           # Shared button with pressed/loading behavior
    lib/
      supabaseClient.js          # Environment validation and Supabase client
    screens/
      LoginScreen.js             # Login, profile lookup, and role validation
      SignUpScreen.js            # Customer Auth signup and profile creation
      CustomerHomeScreen.js      # Customer dashboard, restaurant state, balance, history
      RestaurantHomeScreen.js    # Shared restaurant landing page
      RestaurantMenuScreen.js    # Shared restaurant menu-image page
      RestaurantNewsScreen.js    # Shared current restaurant-news page
      RestaurantRewardsScreen.js # Shared reward loading and redemption page
      EmployeeHomeScreen.js      # Employee placeholder UI
      AdminHomeScreen.js         # Admin placeholder UI
    styles/
      authStyles.js              # Shared colors and styles for every screen
    utils/
      roles.js                   # Valid-role check
      validation.js              # Basic email-format check
```

## Environment and Supabase client

The app expects these public Expo variables in `.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

`src/lib/supabaseClient.js` exports:

- `isSupabaseConfigured`: true only when both variables exist.
- `supabaseConfigError`: the message shown when configuration is missing.
- `supabase`: a configured client, or `null` when configuration is missing.

Auth options are:

```js
{
  autoRefreshToken: true,
  persistSession: false,
  detectSessionInUrl: false,
}
```

Because `persistSession` is false and `App.js` has no session-restoration effect, every fresh application load starts on Login.

Only the public/publishable Supabase key belongs in this client. Never add a service-role key to the application.

## Navigation and state flow

### Top-level navigation

`App.js` owns:

- `screen`: one of `login`, `signup`, `customer`, `employee`, or `admin`.
- `profile`: the profile returned after login.
- `loginNotice`: the success message shown after account creation.

Important functions:

- `showLogin(notice)`: clears the profile, stores an optional notice, and renders Login.
- `showSignUp()`: clears the notice and renders Sign Up.
- `handleLoginSuccess(profile)`: stores the profile and uses `profile.role` as the next screen.
- `handleLogout()`: calls `supabase.auth.signOut()` when configured, then returns to Login.

### Customer restaurant navigation

`CustomerHomeScreen.js` owns the customer sub-navigation with local state:

- `selectedRestaurant`: the `{ id, name }` record selected from Supabase.
- `restaurantPage`: `menu`, `redeem`, `news`, or `null` for the restaurant landing page.
- `showRedeemHistory`: switches between the dashboard and history.

Back behavior:

1. History returns to the customer dashboard.
2. Menu, rewards, or news returns to the selected restaurant landing page.
3. The restaurant landing page returns to the customer dashboard.

There are no route URLs, deep links, or browser-history entries for these transitions.

## Authentication behavior

### Login

`LoginScreen.js`:

1. Validates that email and password are present.
2. Uses the shared email validator and requires an eight-character password.
3. Calls `supabase.auth.signInWithPassword()`.
4. Loads `account_name`, `email`, and `role` from `public.profiles` using the authenticated user ID.
5. Rejects missing profiles and roles outside `customer`, `employee`, and `admin`.
6. Passes the loaded profile to `App.js` for role-based rendering.

### Sign up

`SignUpScreen.js`:

1. Validates account name, email, password, and matching confirmation.
2. Calls `supabase.auth.signUp()` and stores `account_name` in Auth metadata.
3. Inserts a `public.profiles` row with the Auth user ID, account name, email, and hardcoded role `customer`.
4. Signs out when Supabase returns an immediate session.
5. Returns to Login with an account-created message.

Employee and admin roles cannot be chosen during signup. They must be assigned outside this client under appropriate backend controls.

## Customer features

### Customer dashboard

The dashboard displays, in order:

1. Welcome text using `profiles.account_name` from login.
2. Current point balance.
3. Redeem History button.
4. Restaurant loading/result UI.
5. Logout button.

### Point balance

On mount, `CustomerHomeScreen.js`:

1. Reads the current Auth session.
2. Gets the authenticated user ID.
3. Queries `profiles.point_balance` with `.eq('id', user.id).maybeSingle()`.
4. Displays loading, value, or failure text.

After a successful redemption, the returned `new_balance` replaces only the in-memory display value. The client does not directly update `profiles.point_balance`.

### Active restaurant loading

Restaurants are no longer hardcoded in JavaScript. On mount the customer screen runs:

```js
supabase
  .from('restaurants')
  .select('id, name')
  .eq('is_active', true)
  .order('id', { ascending: true });
```

The selector has loading, error, empty, closed, and expanded-list states. Selecting a row retains both `restaurant.id` and `restaurant.name`. Those values drive navigation, titles, menu queries, and reward queries. The UI contains no fixed restaurant IDs and no hardcoded restaurant names.

Expected restaurant records in the current Supabase design (only rows with `is_active = true` appear in the app):

| ID | Name |
| --- | --- |
| 1 | Friends Ramen |
| 2 | Friends Sushi on Rush |
| 3 | Muan Jai Thai Kitchen |
| 4 | Friends Sushi Izakaya |

The names above are backend data, not application constants. Changing an active restaurant name in Supabase changes the displayed name without a code change.

### Shared restaurant landing page

`RestaurantHomeScreen.js` receives `restaurantId` and `restaurantName`. It uses the name as the title and the ID in its test identifier. It provides four callbacks:

- View Menu
- Redeem
- Restaurant News
- Back

The same component is used for every selected restaurant.

### Restaurant News

`RestaurantNewsScreen.js` receives `restaurantId`, `restaurantName`, and `onBack`. `CustomerHomeScreen.js` renders it when the existing Restaurant News button sets `restaurantPage` to `news`.

When mounted or when the restaurant changes, it captures the current time and loads currently visible news:

```js
const now = new Date().toISOString();

supabase
  .from('restaurant_news')
  .select(`
    id,
    restaurant_id,
    title,
    content,
    image_path,
    published_at,
    expires_at
  `)
  .eq('restaurant_id', restaurantId)
  .eq('is_active', true)
  .lte('published_at', now)
  .or(`expires_at.is.null,expires_at.gt.${now}`)
  .order('published_at', { ascending: false });
```

The query uses `restaurant_id`, never a restaurant name. It excludes inactive, future, and expired rows. Each non-empty `image_path` is converted with `supabase.storage.from('news_images').getPublicUrl(image_path)`. News renders newest-first in scrollable mobile cards with a fixed image area using `resizeMode="contain"`, title, content, published date, and optional expiration date. Missing image paths, missing public URLs, and image load failures show an `Image unavailable` placeholder. The page also includes loading, query error, empty, and Back states.

## Restaurant menus

`RestaurantMenuScreen.js` receives `restaurantId`, `restaurantName`, and `onBack`.

When mounted or when the restaurant changes, it loads:

```js
supabase
  .from('menus')
  .select('id, restaurant_id, image_path, display_order')
  .eq('restaurant_id', restaurantId)
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

Menu behavior:

- The old `menus.restaurant` text column is not selected or filtered.
- Every `image_path` is converted with `supabase.storage.from('menu-images').getPublicUrl(...)`.
- Images render vertically in database `display_order` inside a scrollable page.
- Each image uses the available width and `resizeMode="contain"`.
- The initial aspect ratio is `3 / 4`; `onLoad` replaces it with the image's actual width/height ratio.
- The page has loading, query/processing error, empty, per-image error, and Back states.
- An `isMounted` guard prevents state updates after unmount.

### Storage path fallback

Supabase Storage object keys are case-sensitive. `getMenuPathCandidates()` produces URL candidates in this order:

1. The exact `menus.image_path` value.
2. The same path with the first folder's initial character capitalized.
3. When a word in `restaurantName` matches the folder case-insensitively, the same path using that word's casing.

`MenuImage` tries the next candidate after an image load error. It shows “Unable to load this menu image” only after all candidates fail. This preserves existing menu objects whose folder casing differs from the database path; it does not search Storage or modify any object.

Storage requirements:

- Bucket: `menu-images`
- Access: public
- `menus.image_path`: relative object path only, never a hardcoded full URL

## Restaurant rewards and redemption

`RestaurantRewardsScreen.js` receives `restaurantId`, `restaurantName`, `onPointBalanceChange`, and `onBack`.

When mounted or when the restaurant changes, it loads:

```js
supabase
  .from('rewards')
  .select('id, restaurant_id, item_name, points_required, image_path, is_active')
  .eq('restaurant_id', restaurantId)
  .eq('is_active', true);
```

The old `rewards.restaurant` text column is not selected or filtered. For every non-empty `image_path`, the client generates a public URL with `supabase.storage.from('reward-images').getPublicUrl(reward.image_path)`. Reward cards use a fixed 180-pixel image area with `resizeMode="contain"`, followed by the item name, points required, and Redeem button. A missing path, missing public URL, or image load failure displays an `Image unavailable` placeholder. The page has loading, error, empty, reward-list, redemption-message, and Back states.

Pressing Redeem calls the existing RPC with exactly one argument:

```js
supabase.rpc('redeem_reward', {
  p_reward_id: reward.id,
});
```

Expected RPC result:

```js
{
  success: true | false,
  message: '...',
  new_balance: 0,
}
```

Redemption behavior:

- Only one redemption can run at a time in the mounted rewards screen.
- The selected reward button displays its loading spinner.
- A successful result calls `onPointBalanceChange(data.new_balance)` and shows a success message.
- Known insufficient-points messages are normalized to a customer-friendly failure message.
- Reward-query and RPC errors are logged and converted to user-facing messages; thrown redemption errors are also caught and logged.
- The RPC or a backend trigger is responsible for atomically changing points and inserting history.

Do not change the RPC name or add restaurant arguments. The supported signature is `public.redeem_reward(p_reward_id bigint)`.

## Redeem History

History is loaded only when the customer opens the page. Each reopen triggers a new query:

```js
supabase
  .from('redeemhistory')
  .select(
    'id, restaurant_id, restaurant, item_name, points_spent, balance_after, redeemed_at'
  )
  .order('redeemed_at', { ascending: false });
```

There is no client-side user-ID filter; the app relies on RLS to return only the signed-in customer's rows.

Displayed fields:

- `restaurant`: intentionally retained historical name snapshot
- `item_name`
- `points_spent`
- `balance_after`
- `redeemed_at`, formatted with the device/browser locale

`restaurant_id` is selected for the relationship migration but is not currently displayed. The page includes loading, error, empty, list, and Back states.

## Employee and admin areas

### Employee

`EmployeeHomeScreen.js` shows the account name, an unselected restaurant label, a customer-search input, Search, and Logout. Search does not query Supabase; it only displays “Customer search is not connected yet.”

### Admin

`AdminHomeScreen.js` shows three actions:

- Manage Customers
- Manage Employees
- App Analysis Report

Each action only displays a placeholder message. No admin database operations are implemented.

## Shared UI and utilities

- `FormInput` renders a label, `TextInput`, optional error, and optional password Show/Hide control.
- `PrimaryButton` disables itself only while `loading` is true and replaces its title with an activity indicator.
- `authStyles` defines the shared cream/green restaurant theme, cards, inputs, buttons, messages, and responsive menu-image containers.
- `isValidEmail()` performs a basic email-pattern check.
- `isValidRole()` accepts only `customer`, `employee`, and `admin`.

## Supabase contract

| Object | Fields or behavior used by the app |
| --- | --- |
| `public.profiles` | `id`, `account_name`, `email`, `role`, `point_balance` |
| `public.restaurants` | `id`, `name`, `is_active`; active rows drive customer selection and navigation |
| `public.menus` | `id`, `restaurant_id`, `image_path`, `display_order`, `is_active`; filtered by `restaurant_id` |
| `public.restaurant_news` | `id`, `restaurant_id`, `title`, `content`, `image_path`, `published_at`, `expires_at`, `is_active`; filtered to currently visible rows by `restaurant_id` |
| `public.rewards` | `id`, `restaurant_id`, `item_name`, `points_required`, `image_path`, `is_active`; filtered by `restaurant_id` |
| `public.redeemhistory` | `id`, `restaurant_id`, `restaurant`, `item_name`, `points_spent`, `balance_after`, `redeemed_at` |
| `public.redeem_reward(p_reward_id bigint)` | Performs redemption and returns `success`, `message`, and `new_balance` |
| Storage bucket `menu-images` | Public menu objects referenced by relative `menus.image_path` values |
| Storage bucket `news_images` | Public news objects referenced by relative `restaurant_news.image_path` values |
| Storage bucket `reward-images` | Public reward objects referenced by relative `rewards.image_path` values |

Migration notes:

- `menus.restaurant` and `rewards.restaurant` still exist temporarily but are unused by the client.
- `redeemhistory.restaurant` remains in active use as a historical snapshot.
- `restaurant_id` is the active relationship used for menus and rewards.
- The app assumes RLS permits authenticated users to read active restaurants, active menus, active rewards, their own profile, and their own redemption history.
- Signup also assumes the new user can insert the required customer profile row.
- Never remove old database columns merely because the client no longer queries them; coordinate schema cleanup separately.

## Completed work

- Expo application scaffold and shared visual system.
- Customer signup and login through Supabase Auth.
- Profile creation, profile lookup, role validation, and role-based top-level screens.
- Explicit logout and non-persistent startup behavior.
- Customer point-balance loading.
- Supabase-backed active restaurant selector.
- Reusable restaurant landing screen.
- Reusable `restaurant_id`-based menu screen with public Storage images.
- Responsive, scrollable menu images with aspect-ratio and path-case handling.
- Reusable current Restaurant News screen with public Storage images and fallbacks.
- Reusable `restaurant_id`-based rewards screen with public Storage images and fallbacks.
- Existing `redeem_reward(p_reward_id)` integration and in-memory balance refresh.
- Redeem History query and UI with historical restaurant snapshots.
- Loading, error, and empty states for restaurants, menus, news, rewards, and history.

## Not implemented or not verified

- Employee customer search is a placeholder.
- Employee restaurant assignment/selection is not connected.
- Admin customer management is a placeholder.
- Admin employee management is a placeholder.
- Admin analysis reporting is a placeholder.
- Password reset, social login, profile editing, and account deletion are absent.
- No navigation library, deep links, or URL routing.
- No automated tests, linting, formatting, or TypeScript configuration.
- The repository contains no Supabase migrations or SQL definitions, so RLS policies and the implementation of `redeem_reward` cannot be verified from source.
- History insertion must be performed by `redeem_reward` or a database trigger; otherwise successful redemptions will not appear in the history UI.

## Local setup and validation

Install and run the web target from PowerShell:

```powershell
npm.cmd install
npx.cmd expo start --web --clear --port 8082
```

Available package scripts:

```powershell
npm.cmd run start
npm.cmd run android
npm.cmd run ios
npm.cmd run web
```

Quick Babel syntax check for one file:

```powershell
node -e "require('@babel/core').transformFileSync('src/screens/CustomerHomeScreen.js', { presets: ['babel-preset-expo'] })"
```

Production web bundle validation:

```powershell
npx.cmd expo export --platform web --output-dir .expo-validation
```

Remove the temporary validation directory after checking the export. There is no lint, type-check, or test command to run until those tools are added.

## Working rules for future changes

- Preserve `.env` secrecy and keep it out of Git.
- Never use a Supabase service-role key in the client.
- Preserve unrelated working-tree changes.
- Keep restaurant pages reusable; pass database `restaurantId` and `restaurantName` instead of creating restaurant-specific copies.
- Filter menus and rewards by `restaurant_id`, never by the legacy restaurant-name text columns.
- Keep `redeem_reward` calls limited to `p_reward_id`.
- Keep displaying `redeemhistory.restaurant` as the historical snapshot unless the product requirement changes.
- Verify table, column, bucket, and RPC names before changing Supabase calls.
- Do not modify employee or admin placeholders unless a task explicitly targets them.
- Update this handoff after each feature, backend dependency, or structural change.
