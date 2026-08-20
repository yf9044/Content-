# Yallatlob

Delivery app for Lebanon — food, groceries and pharmacy, built with Expo Router,
NativeWind and Supabase.

## Running it

```bash
npm install
cp .env.example .env   # optional, see "Supabase" below
npm run web            # or: npm run ios / npm run android
```

The app boots straight into the phone sign-in screen. Without Supabase
credentials it runs in **demo mode**: SMS is stubbed so any 6-digit code signs
you in, and there is a "Browse as a guest" shortcut on the sign-in screen.

## Supabase

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Then enable **Phone** auth in the Supabase dashboard (Authentication →
Providers) and connect an SMS provider. `src/lib/supabase.ts` exports `null`
when the variables are missing, and `src/lib/session.tsx` falls back to the
local stub, so the UI never crashes on a fresh clone.

## Layout

```
src/
  app/                    expo-router routes
    (auth)/phone.tsx      phone number entry (+961)
    (auth)/otp.tsx        6-digit OTP verification
    (tabs)/index.tsx      home: address, categories, promo, store list
    (tabs)/search.tsx     store and dish search
    (tabs)/orders.tsx     live order tracking + history
    (tabs)/account.tsx    profile, addresses, payment, sign out
    store/[id].tsx        store menu with add-to-basket
    cart.tsx              basket, payment method, checkout
  components/             brand mark, store card, food tile, stepper, cart bar
  data/                   seed catalogue and order history (Supabase stand-in)
  lib/                    supabase client, session, cart, currency helpers
  constants/theme.ts      brand tokens mirroring tailwind.config.js
```

Routing is gated with `Stack.Protected` in `src/app/_layout.tsx`: signed-out
users only see `(auth)`, signed-in users only see the tabs.

## Styling

NativeWind v4 with a warm paper-and-ink palette so food imagery stays dominant.
Tokens live in `tailwind.config.js` and are mirrored in
`src/constants/theme.ts` for props that need raw colour values.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#FDFBF7` | app background |
| `surface` | `#FFFFFF` | cards |
| `ink` | `#1C1917` | primary text |
| `muted` | `#8A8177` | secondary text |
| `stone` | `#E7E1D8` | borders |
| `flame` | `#E4572E` | primary action |
| `cedar` | `#1B7A43` | success, promos |
| `saffron` | `#F4A259` | ratings, warnings |
| `danger` | `#D7263D` | errors |

## Prices

Menu prices are stored in fresh USD and rendered with the LBP equivalent at the
Banque du Liban rate (89,500 LL / $1) — see `src/lib/format.ts`.

## Not built yet

- Supabase tables for stores, menus and orders (`src/data/*` is the stand-in)
- Real store photography (`FoodTile` renders an emoji plate as a placeholder)
- Live courier tracking map, address picker, and card payments
