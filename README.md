# Friend Restaurant Group App

Friend Restaurant Group is a mobile-first Expo React Native app for restaurant customers, employees, and administrators. It uses Supabase for authentication and application data.

## Current features

- Customer sign-up and login with Supabase Auth.
- Role-based home pages for customers, employees, and admins.
- Customer point-balance display.
- Customer restaurant selector for Ramen, Sushi, and Thai Food.
- Ramen mockup pages for Menu and Restaurant News.
- Ramen rewards loaded from Supabase.
- Reward redemption through the Supabase `redeem_reward` function.
- Customer Redeem History page, loaded from Supabase.
- Logout on the main role pages.

The app always opens on the Login screen. A previous login is not restored when the app or website is reopened.

## Run locally

```powershell
cd "C:\Users\Kevin\Desktop\Friend Restaurant group"
npm.cmd install
npx.cmd expo start --web --clear --port 8082
```

Open the URL shown by Expo, normally `http://localhost:8082`.

## Supabase configuration

Create a `.env` file in the project root using `.env.example` as a guide:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use only the public/publishable Supabase key in this app. Do not add a service-role key.

## Project status

Customer Ramen rewards and Redeem History are the current active customer features. Employee tools, admin tools, Sushi, Thai Food, password recovery, and the full restaurant experiences are still placeholders or not yet implemented.

For the complete folder map, database expectations, completed work, and remaining work, read [progress.md](progress.md).
