# Assignment Spec: "Thriveworld" — A Wellness-Driven Life Sim

**Assignment type:** Coding task for Fable to build a working prototype
**Scope decisions:** Browser-based now, backend-ready architecture; real monetization *design* (mocked transactions, no live payment processor)

---

## 1. Concept Summary

A Sims-style life simulation where the player's avatar and virtual world only progress when the *player* (not the avatar) completes real, healthy daily activities. Progress is earned through genuine self-care, not idle clicking.

**Core loop:** Complete a real activity → earn currency/XP → spend on decor, clothing, avatar upgrades, or new worlds → unlock more of the game.

---

## 2. Core Activities (the "tasks")

Each activity type should have its own lightweight in-app flow — not just a checkbox — so completion feels earned:

| Activity | Interaction | Suggested reward logic |
|---|---|---|
| Guided meditation | Timer-based session (1–10 min), simple breathing animation | Reward scales with session length, capped daily |
| Breathing exercise | Visual pacer (inhale/hold/exhale cycle) | Flat reward per completed cycle set |
| Meal tracking | Simple log entry (photo optional, text description, rough category) | Reward per entry, small streak bonus |
| Exercise tracking | Log type/duration, or manual entry | Reward scales with duration, daily cap |
| Gratitude journal | Prompt + free text (min length) | Flat reward per entry |
| Worry journal | Prompt + free text, optional "reframe" follow-up prompt | Flat reward per entry |

**No anti-spam caps.** The reward loop is intentionally unrestricted — if a player wants to meditate five times in a day and earn currency each time, that's still five real sessions of a healthy habit, and the app shouldn't get in the way of that. No daily caps, no minimum time-on-task enforcement, no minimum journal length.

**Content-safety note for the journal features:** worry/gratitude journals will occasionally surface distress. Fable should NOT attempt sentiment-based crisis detection or diagnosis in a prototype like this — but the spec should require a visible, static "if you're struggling, here are resources" link/footer near the worry journal, not conditional logic trying to detect crisis language.

---

## 3. Architecture (browser-based, backend-ready)

- Build a persistence abstraction layer now — e.g. a `SaveService` interface with methods like `getState()`, `setState()`, `logActivity()` — implemented today with `localStorage`/in-memory state, but designed so a REST/GraphQL backend adapter can be swapped in later without touching game logic.
- Keep game state (currency, inventory, unlocked worlds, activity log) as a single serializable JSON blob, versioned (`schemaVersion` field) so a future migration to a real DB is straightforward.
- No real user accounts yet — but design the data model with a `userId` field from day one so multi-user backend support isn't a rewrite.
- Suggested stack: React + a state library (Zustand/Redux) + the SaveService abstraction. Avoid tightly coupling UI components to the storage mechanism.

---

## 4. Game Content

- **Worlds:** 3–4 unlockable virtual worlds/environments (e.g. cozy cabin, city loft, garden retreat, beach house), gated behind cumulative XP or currency milestones.
- **Virtual goods:** decor items, clothing/avatar cosmetics, "upgrades" — organize into a simple catalog/JSON data file so new items can be added without code changes.
- **Progression:** define an XP/leveling curve and a currency (e.g. "Sparks") separate from XP, so leveling unlocks *access* and currency drives *purchases*.
- **Avatar:** single persistent avatar shared across all worlds (not one per world).

---

## 5. Monetization Design (real design, mocked transactions)

Since there's no backend or payment processor yet, all real-money transactions should be **simulated** (clearly labeled "Demo Mode — no real charge") — but the design itself should be realistic and complete enough to hand to a payments team later. Two separate monetization mechanisms:

**A. Premium items (one-time purchases)**
- The base virtual-item catalog is earned entirely through completing tasks — players earn virtual currency (Sparks) and spend it on decor/clothing/upgrades they choose.
- A separate premium item catalog exists alongside it, unlocked via one-time real-money purchase. Real money doesn't hand players free stuff or let them skip the earning loop — it simply widens their catalog of *choices*. Progression speed and the core loop are unaffected either way.
- Spec a pricing ladder for premium items (individual item prices and/or bundle packs).

**B. Task subscription (recurring, $10/month)**
- **Free tier:** a fixed set of default tasks, each with a preset virtual-currency payout (e.g. 5-min meditation → 5 Sparks, gratitude journal entry → 5 Sparks, 10-min tracked walk → 5 Sparks). Players can't change these tasks or their payouts.
- **Subscriber tier ($10/mo):** players can create their own custom tasks and set their own payout values (e.g. 10-min meditation → 10 Sparks, 30 min of focused work → 30 Sparks). This is the upsell — flexibility and personalization, not more currency for the same effort.
- Spec the custom-task creation UI (task name, duration/description, self-assigned Spark value) and a subscription status flag in the data model gating access to it.
- Note for later: a real implementation needs a backend for subscription billing/recurring charges and receipt validation, plus a PCI-compliant processor (e.g. Stripe) — flag this as a follow-up phase, not something Fable builds now.

---

## 6. Explicit Out-of-Scope (for this pass)

- Real user auth / accounts
- Real payment processing
- Social/multiplayer features
- Sentiment analysis or crisis-detection logic in journals
- Native mobile builds (web-first)

---

## 7. Deliverables to Request from Fable

1. Working browser-based prototype (playable end-to-end: complete an activity → see reward → spend in a shop → see world/avatar update)
2. The `SaveService` abstraction layer, documented
3. A short README describing the data model, how to swap in a real backend later, and the monetization design decisions
4. The item/world catalog as editable JSON/data files, not hardcoded

---

## Decisions Locked In

- No anti-spam caps on activities — the reward loop is unrestricted by design.
- Single persistent avatar shared across all worlds.
- Monetization: one-time premium item purchases (choice, not power) + $10/mo subscription unlocking custom task creation.

## Open Question Remaining

- For subscriber-created custom tasks, should there be any upper bound on self-assigned Spark values (to keep the in-game economy from becoming meaningless if someone sets "1 minute of anything = 1000 Sparks"), or is that left entirely to the player's discretion?
