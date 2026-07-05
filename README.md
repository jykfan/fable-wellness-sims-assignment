# 🌱 Thriveworld

A Sims-style life sim where your world only grows when **you** do real,
healthy things. Complete a meditation, log a meal, write a gratitude entry →
earn ✨ Sparks and XP → buy decor and clothing, unlock new worlds, dress your
avatar. Built from `wellness-sims-assignment-spec.md`.

The design rationale for every judgment call the spec left open is in
[**DECISIONS.md**](./DECISIONS.md).

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

**End-to-end smoke test** (drives the whole loop in a headless browser —
earn → buy → place → persist → subscribe → custom task → world unlock):

```bash
npm run build && npm run preview &          # serve dist/ on :4173
CHROMIUM_PATH=/path/to/chrome npm run test:e2e   # CHROMIUM_PATH optional if
                                                 # Playwright's Chromium is installed
```

**Deploying:** the build is a fully static site with relative asset paths
(`base: "./"`), so `dist/` deploys as-is to Netlify, Vercel, GitHub Pages,
Cloudflare Pages, or any static file host — no server, no environment
variables. E.g. `npx vercel deploy dist` or point Netlify at
`npm run build` / publish directory `dist`.

A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) deploys to
GitHub Pages automatically on every push to `main` (it also self-enables the
Pages site on first run). Once this branch merges, the app goes live at
`https://<owner>.github.io/fable-wellness-sims-assignment/`.

## What's in the prototype

- **Six activity flows**, each a real interaction, not a checkbox: timed
  meditation with a breathing animation, a breathing pacer
  (inhale 4s / hold 4s / exhale 6s), meal log with daily-streak bonus,
  exercise log, and gratitude/worry journals with prompts (the worry journal
  has an optional "reframe" step and an always-visible, static support-
  resources footer — no sentiment detection, per spec).
- **Economy:** Sparks (currency, buys things) and XP (levels, unlocks worlds)
  are deliberately separate. No daily caps or minimum lengths anywhere,
  per the spec's locked decisions.
- **4 worlds** (Cozy Cabin → Garden Retreat → City Loft → Beach House) gated
  by level, each with decor slots you fill from your inventory.
- **One persistent avatar** (SVG) shared across worlds, with skin/hair
  customization and equippable clothing from the catalog.
- **Shop:** the earned-Sparks catalog plus a premium catalog and bundles
  behind a clearly-labeled **Demo Mode** mock checkout.
- **Subscription (mocked, $10/mo):** unlocks custom task creation with
  self-assigned Spark payouts (clamped to 50 — see DECISIONS.md).
- **Prototype tools** under *Account* (grant resources / reset save) so a
  reviewer can preview late-game content quickly; stripped for production.

## Data model

All persistent data is one serializable JSON blob — `GameState` in
[`src/types.ts`](./src/types.ts):

| Field | Purpose |
|---|---|
| `schemaVersion` | Versioned for forward migrations (`migrate()` in `gameStore.ts`) |
| `userId` | Single local user today; a backend swaps in real account ids |
| `sparks`, `xp` | The two-track economy (currency vs. progression) |
| `inventory`, `premiumPurchases` | Owned item ids + mock real-money receipts |
| `unlockedWorlds`, `activeWorld`, `placements` | World progress and per-world decor layout |
| `avatar` | Name, colors, equipped cosmetics (one avatar, all worlds) |
| `subscription` | `{ active, renewsAt, startedAt }` — gates custom tasks |
| `customTasks` | Subscriber-created tasks (name, description, minutes, sparks) |
| `activityLog` | Rolling window of recent activity for the UI |
| `mealStreak` | Last log date + consecutive-day count |

Alongside the state blob, every completed activity is also appended to a
**durable append-only activity stream** via `SaveService.logActivity()` —
that's the record a backend would ingest for analytics and receipts.

Game content is **pure data**, editable without code changes:

- [`src/data/catalog.json`](./src/data/catalog.json) — earned-currency items
- [`src/data/premium.json`](./src/data/premium.json) — premium items + bundles (USD cents)
- [`src/data/worlds.json`](./src/data/worlds.json) — worlds, unlock levels, scene colors, decor slots
- [`src/data/tasks.json`](./src/data/tasks.json) — the fixed free-tier task list

## The SaveService abstraction

Every read/write of persistent state goes through one interface
([`src/services/SaveService.ts`](./src/services/SaveService.ts)):

```ts
interface SaveService {
  getState(userId): Promise<GameState | null>;
  setState(state): Promise<void>;
  logActivity(entry): Promise<void>;      // append-only stream
  getActivityLog(userId): Promise<ActivityLogEntry[]>;
  reset(userId): Promise<void>;
}
```

Two implementations ship today: `LocalStorageSaveService` (default) and
`InMemorySaveService` (fallback when storage is unavailable, and for tests).
All methods are async even though the local ones are synchronous underneath,
so call sites are already shaped for network latency and errors.

**Swapping in a real backend** is one new class and a one-line change in
[`src/services/index.ts`](./src/services/index.ts):

```ts
class RestSaveService implements SaveService {
  constructor(private base: string) {}
  getState(userId)   { return fetchJson(`${this.base}/users/${userId}/state`); }
  setState(state)    { return putJson(`${this.base}/users/${state.userId}/state`, state); }
  logActivity(entry) { return postJson(`${this.base}/users/${entry.userId}/activities`, entry); }
  // ...
}
export const saveService = new RestSaveService(import.meta.env.VITE_API_URL);
```

No game logic or component changes: the Zustand store
(`src/store/gameStore.ts`) is the only caller. The `schemaVersion` field and
the `migrate()` hook mean the same migration steps can later run server-side
against a real database.

## Monetization design

Both mechanisms are fully designed but **transaction-mocked** — every
purchase surface carries a "Demo Mode — no real charge" banner and records a
mock receipt in `premiumPurchases`.

**A. Premium items (one-time).** Real money widens the catalog of *choices*;
it never grants Sparks, XP, or progression speed. Pricing ladder (in
`premium.json`, editable): small items **$0.99**, standard **$1.99**,
signature pieces **$2.99**; bundles at ~25–30% off their contents
(Serenity Starter $2.99, Collector's $5.49).

**B. Thriveworld Plus — $10/month.** Free tier: six fixed tasks with fixed
payouts. Subscribers unlock **custom task creation** (name, description,
optional duration, self-assigned payout up to 50 ✨). The upsell is
personalization, not a better exchange rate — default payouts and world
progression are identical for everyone (custom tasks grant a flat 10 XP).
Cancelling keeps your custom tasks but gates completing them until you
re-subscribe.

**Phase-2 flags for a payments team** (out of scope now, per spec):
subscription billing and receipt validation need a backend; use a
PCI-compliant processor (e.g. Stripe Checkout + Billing) so card data never
touches our servers; entitlements (`subscription.active`, premium ownership)
must become server-authoritative, granted by webhook after payment
confirmation, not client-set flags as in this demo.

## Project layout

```
src/
  types.ts               data model (shared-shape for a future backend)
  data/*.json            editable content catalogs
  services/              SaveService interface + localStorage/in-memory impls
  game/economy.ts        pure reward/XP/leveling rules
  store/gameStore.ts     Zustand store — the only SaveService caller
  components/            UI (tabs, activity flows, shop, worlds, account)
```
