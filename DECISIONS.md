# Design decisions & reasoning

The spec locked several choices (no anti-spam caps, single shared avatar,
the two monetization mechanisms) and I followed those as written. Below are
the calls the brief left to judgment, and why I made them the way I did.

## 1. The open question: cap on self-assigned Spark values → **yes, a soft cap of 50**

The spec asks whether subscriber-created tasks should bound their
self-assigned payouts. I capped them at **50 Sparks per completion**, with
the slider and clamp in one shared constant (`CUSTOM_TASK_MAX_SPARKS`).

Reasoning:

- A player who sets "1 minute of anything = 1000 Sparks" doesn't just affect
  their own save — it collapses the *meaning* of every price in the catalog,
  which is the thing the subscription's own value proposition rests on. A
  shop where everything is trivially affordable is a shop that isn't fun to
  earn toward, and a subscriber who burns out the loop in a week churns.
- 50 is still 10× the richest default payout (5 ✨), so the cap reads as
  generous personalization ("my hour of deep work is worth 50") rather than
  distrust. The UI states the ceiling and the reason in plain language.
- Crucially, I paired it with a second rule that does more work than the cap
  itself: **custom tasks always grant a flat 10 XP** regardless of their
  Spark value. Sparks are purchasing power (self-scoped, low stakes); XP
  gates world unlocks (the game's progression spine). Players can inflate
  their own wallet somewhat, but they cannot self-assign their way past the
  progression curve. This keeps the spec's "leveling unlocks access,
  currency drives purchases" separation intact even under player-set values.

## 2. Honoring "no anti-spam caps" — and where the trade-off lives

Implemented as specified: no daily caps, no minimum journal length, no
minimum time-on-task, repeat completions always pay. Two things worth noting
for a future pass:

- The *flows themselves* provide gentle friction where it's intrinsic to the
  activity: the meditation reward lands only when the chosen timer actually
  finishes, and the breathing pacer pays per genuinely-elapsed cycle set.
  Logs and journals are honor-system by design — the spec's philosophy is
  that a player gaming a wellness app is only cheating themselves.
- If the economics ever need revisiting, every payout rule lives in one pure
  module (`src/game/economy.ts`), so caps could be added server-side later
  without touching UI.

## 3. XP curve and world gating

- Curve: cumulative XP to reach level L is `20·(L−1)·L` (L2=40, L3=120,
  L5=400, L7=840). Gentle quadratic: early levels come fast (a few days of
  light activity), later ones reward consistency rather than grinding.
- Worlds unlock at levels 1 / 3 / 5 / 7 by XP only — never purchasable with
  Sparks — enforcing the spec's access-vs-purchases split. Unlocking is an
  explicit "claim" click (a small celebration beat) rather than automatic.
- Sizing sanity check: a modest real day (one 5-min meditation, two meals,
  one journal entry, a 20-min walk) is roughly 25–30 XP, putting Garden
  Retreat (~120 XP) at the end of week one — a deliberately reachable first
  milestone.

## 4. Meal photos are a field, not a feature

The spec marks photos "optional." I left photo *capture* out and kept the
log to category + description, because base64 images in localStorage would
blow the ~5 MB quota after a few dozen meals and give a false sense of a
working feature. The activity entry's `meta` payload is where a `photoUrl`
goes once a backend with object storage exists; nothing in the data model
needs to change.

## 5. Emoji-and-CSS art direction

Items, worlds, and cosmetics render as emoji/CSS-gradient scenes plus one
inline-SVG avatar. This was a deliberate scope call: it keeps the entire
content pipeline inside editable JSON (deliverable #4 — adding a shop item
is literally adding a JSON object, no asset upload step), ships zero binary
assets, and still demonstrates every system (placement slots, equip slots,
world theming). A real art pass swaps the `emoji` field for a sprite URL in
the same catalog schema.

## 6. Mocked-payment honesty

Every simulated money surface — premium checkout, bundles, subscription —
carries a persistent "🧪 Demo Mode — no real charge" banner, and mock
purchases are recorded as receipt-like rows (sku, cents, timestamp) visible
under Account. That mirrors the real data a payments backend would own, and
makes it unmistakable to any tester that no charge occurred. The README
flags the phase-2 requirements (Stripe-class processor, server-authoritative
entitlements granted by webhook).

## 7. Subscription cancellation semantics

Cancelling keeps the player's custom tasks but disables completing them
until re-subscribing. Deleting user-authored content on churn would be
hostile; letting lapsed subscribers keep earning from subscriber tooling
would erase the tier boundary. Keep-but-gate is the standard SaaS pattern
and the state model (`subscription.active` separate from `customTasks`)
makes it one boolean.

## 8. Worry-journal safety, exactly as specified

The support-resources footer (988, Crisis Text Line, findahelpline.com) is
**static and always visible** on the worry journal — no sentiment analysis,
no conditional triggering, per the spec's explicit instruction. It also
states plainly that the app is not a substitute for professional care.

## 9. Prototype-only conveniences

An Account-page "Prototype tools" panel grants +100 ✨/XP and resets the
save, so a reviewer can see level-7 content and a stocked shop in minutes
instead of weeks. It's clearly labeled as removed-for-production; everything
it does flows through the same store actions as real play.

## 10. Stack

React + Zustand + Vite + TypeScript, as the spec suggested. Zustand over
Redux for the tiny API surface: the store is one file, and, importantly, it
is the *only* module that talks to `SaveService`, so the storage boundary
the spec asked for is structural, not conventional. State updates persist
through the service on every action; the UI never touches localStorage.

## Verification

Beyond `tsc`/`vite build`, a Playwright script drives the production build
end-to-end: complete four activities → verify Spark/XP math in the HUD →
buy an earned item and a premium (demo) item → place both in the world →
reload and confirm persistence → subscribe, create and complete a custom
task → confirm world gating and unlock. All checks pass.
