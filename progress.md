# Project Progress and Agent Handoff

Use this document as the current project handoff. Read it before making future changes.

## Project summary

Friend Restaurant Group is an Expo React Native application with Supabase Auth and Supabase database access. It has three account roles:

- `customer`
- `employee`
- `admin`

The app does not use a navigation library. `App.js` keeps the active screen in React state and renders the matching screen component.

## Folder structure

```text
Friend Restaurant group/
  App.js                         # App entry point and role-based screen selection
  app.json                       # Expo app configuration
  babel.config.js                # Expo Babel configuration
  package.json                   # Dependencies and start scripts
  package-lock.json              # Locked dependency versions
  README.md                      # Short project overview
  progress.md                    # This handoff document
  .env.example                   # Required public Supabase variable names
  .gitignore                     # Excludes .env, node_modules, and Expo local state
  CLAUDE.md                      # Older development notes; verify against this document/code
  src/
    components/
      FormInput.js               # Shared text-input component
      PrimaryButton.js           # Shared action button with loading state
    lib/
      supabaseClient.js          # Supabase client configuration
    screens/
      LoginScreen.js             # Login and profile/role lookup
      SignUpScreen.js            # Customer account creation
      CustomerHomeScreen.js      # Customer home, Ramen, rewards, and history
      EmployeeHomeScreen.js      # Employee placeholder page
      AdminHomeScreen.js         # Admin placeholder page
    styles/
      authStyles.js              # Shared React Native styles and colors
    utils/
      roles.js                   # Valid roles: customer, employee, admin
      validation.js              # Basic email validation
```

## How the app currently works

### Authentication and roles

- Login and sign-up use Supabase Auth.
- New accounts create a `profiles` row with role `customer`.
- Login loads the user's profile and sends them to the customer, employee, or admin page based on `profiles.role`.
- Logout calls `supabase.auth.signOut()` and returns to Login.
- The app always starts at Login. `persistSession: false` is configured and `App.js` does not restore a previous session on startup.

### Customer area

The customer home page currently shows, in this order:

1. Current point balance from `profiles.point_balance`.
2. Redeem History button.
3. Restaurant dropdown.
4. Logout button.

Restaurant status:

- **Ramen:** has a mock Ramen page with View Menu, Redeem, Restaurant News, Back, and Logout.
- **Ramen rewards:** the Redeem page loads active Ramen rewards from Supabase, displays item name and required points, and calls the redemption RPC.
- **Ramen Menu / Restaurant News:** mockup text pages only.
- **Sushi / Thai Food:** placeholder restaurant pages only.

### Ramen reward redemption

`CustomerHomeScreen.js` loads rewards from:

```js
supabase
  .from('rewards')
  .select('id, item_name, points_required')
  .eq('restaurant', 'Ramen')
  .eq('is_active', true);
```

When Redeem is pressed, it calls:

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
  new_balance: 0
}
```

On success the app updates only its in-memory point-balance display from `new_balance`. It does **not** directly update `profiles.point_balance`. The selected Redeem button shows a loading state during the request.

### Redeem History

The history page loads the logged-in customer's rows through RLS:

```js
supabase
  .from('redeemhistory')
  .select('id, restaurant, item_name, points_spent, balance_after, redeemed_at')
  .order('redeemed_at', { ascending: false });
```

It displays restaurant, item name, points spent, balance after, and redeemed date/time. It has loading, empty, error, and Back states.

## Supabase database requirements

The app expects these database objects:

| Object | Fields or behavior used by the app |
| --- | --- |
| `public.profiles` | `id`, `account_name`, `email`, `role`, `point_balance` |
| `public.rewards` | `id`, `restaurant`, `item_name`, `points_required`, `is_active` |
| `public.redeemhistory` | `id`, `restaurant`, `item_name`, `points_spent`, `balance_after`, `redeemed_at`; RLS must show only the signed-in customer's rows |
| `public.redeem_reward(p_reward_id)` | Redeems the selected reward and returns JSON with `success`, `message`, and `new_balance` |

Important backend notes:

- The reward table name is **`rewards`** (plural), not `reward`.
- The `redeem_reward` function must reference `public.rewards`. A function that references `public.reward` fails with `relation "public.reward" does not exist`.
- The redemption function or a database trigger must insert a row into `public.redeemhistory`; otherwise the history page will remain empty even after successful redemption.
- Use RLS for `profiles`, `rewards`, and `redeemhistory`. Do not use the Supabase service-role key in the mobile/web app.

## Completed work

- Expo project and shared UI components created.
- Supabase sign-up, login, role lookup, and logout implemented.
- Startup session persistence disabled so Login is always the first screen.
- Customer point-balance read implemented.
- Customer Ramen mockup, rewards list, and redemption RPC connection implemented.
- Customer Redeem History user interface and query implemented.
- Project is connected to GitHub repository `qqadvertisement/friend-restaurant-group-app` on branch `main`.

## Not implemented yet

- Employee customer search is a placeholder and does not query data.
- Admin customer management, employee management, and analysis report are placeholders.
- Sushi and Thai Food have no real pages, menus, rewards, or redemption flows.
- Ramen Menu and Restaurant News are mockup pages only.
- Password reset, social login, account editing, and account deletion are not implemented.
- No automated tests, linting, or TypeScript are configured.
- No navigation library is used; screen transitions are local React state.
- Redeem history record insertion must be confirmed in the database function or trigger.

## Local setup and checks

Create `.env` from `.env.example`:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Start the web app:

```powershell
npx.cmd expo start --web --clear --port 8082
```

There is no test or lint script. For a quick syntax check after editing a JavaScript file:

```powershell
node -e "require('@babel/core').transformFileSync('src/screens/CustomerHomeScreen.js', { presets: ['babel-preset-expo'] })"
```

## Working rules for future changes

- Keep `.env` out of Git. It is already ignored.
- Do not put a Supabase service-role key in the app.
- Limit customer changes to `CustomerHomeScreen.js` unless shared behavior truly requires another file.
- Do not alter employee or admin placeholders unless the task explicitly asks for them.
- When changing Supabase queries or RPCs, verify table/function names against the actual Supabase project before coding.
- Update this document whenever a feature, database dependency, or project structure changes.
