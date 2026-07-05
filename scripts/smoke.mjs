// End-to-end smoke test of the core loop against the production build:
// complete activities -> earn Sparks -> buy in shop -> place in world ->
// persistence across reload -> subscription + custom task -> premium buy.
//
// Usage:
//   npm run build && npm run preview &   # serves dist/ on :4173
//   CHROMIUM_PATH=/path/to/chrome node scripts/smoke.mjs
//
// CHROMIUM_PATH is optional if a Playwright-managed Chromium is installed.
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const SHOT_DIR = process.env.SHOT_DIR ?? null;
let failures = 0;

function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

async function shot(page, name) {
  if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => {
  failures++;
  console.log("FAIL  pageerror:", e.message);
});

await page.goto(BASE);
await page.waitForSelector(".hud");
check(
  "app loads with HUD at 0 sparks",
  await page.locator(".hud-stat-value").first().textContent().then((t) => t.includes("0"))
);

// --- Activities: meal, gratitude, exercise, worry -------------------------
await page.click("text=Activities");
await page.click(".task-card:has-text('Meal Tracking')");
await page.fill("textarea", "veggie stir-fry");
await page.click("button:has-text('Log meal')");
await page.waitForSelector(".toast");

await page.click(".task-card:has-text('Gratitude Journal')");
await page.fill(".activity-flow textarea", "grateful for quiet mornings");
await page.click("button:has-text('Save entry')");

await page.click(".task-card:has-text('Exercise Tracking')");
await page.click("button:has-text('Log · +10')"); // default 20 min -> +10

await page.click(".task-card:has-text('Worry Journal')");
check(
  "worry journal shows static support footer",
  await page.locator(".support-footer:has-text('988')").isVisible()
);
await page.fill(".activity-flow textarea", "worried about deadlines");
await page.click("button:has-text('Save entry')");

const sparksText = await page.locator(".hud-stat-value").first().textContent();
check(`earned 24 sparks from 4 activities (got: ${sparksText.trim()})`, sparksText.includes("24"));
check("recent activity feed has 4 entries", (await page.locator(".activity-feed li").count()) === 4);
await shot(page, "02-activities");

// --- Shop: earned purchase + premium demo checkout -------------------------
await page.click("text=Shop");
await page.click(".item-card:has-text('Potted Plant') button");
await page.waitForSelector(".item-card:has-text('Potted Plant') .owned-badge");
check(
  "bought potted plant, sparks deducted",
  (await page.locator(".hud-stat-value").first().textContent()).includes("14")
);

await page.click(".item-card:has-text('Zen Rock Garden') button");
check(
  "demo checkout modal labeled no-real-charge",
  await page.locator(".modal .demo-banner:has-text('no real charge')").isVisible()
);
await page.click("button:has-text('Confirm demo purchase')");
await page.waitForSelector(".item-card:has-text('Zen Rock Garden') .owned-badge");
check("premium item owned after mock purchase", true);
await shot(page, "03-shop");

// --- World: place decor ------------------------------------------------------
await page.click("text=My World");
await page.click(".chip:has-text('Potted Plant')");
await page.click(".chip:has-text('Zen Rock Garden')");
check("two items placed in scene", (await page.locator(".scene-item").count()) === 2);
await shot(page, "01-world");

// --- Persistence across reload ------------------------------------------------
await page.reload();
await page.waitForSelector(".hud");
check(
  "sparks persist after reload",
  (await page.locator(".hud-stat-value").first().textContent()).includes("14")
);
check("placements persist after reload", (await page.locator(".scene-item").count()) === 2);

// --- Subscription + custom task -------------------------------------------------
await page.click("text=Account");
await page.click("button:has-text('Subscribe ·')");
await page.waitForSelector(".sub-status");
await page.fill("input[placeholder*='focused reading']", "30 min reading");
await page.click("button:has-text('Create task')");
check(
  "custom task created",
  await page.locator(".custom-task:has-text('30 min reading')").isVisible()
);
await shot(page, "04-account");

await page.click("text=Activities");
await page.click(".custom-task button:has-text('Done')");
check(
  "custom task completion pays out",
  (await page.locator(".hud-stat-value").first().textContent()).includes("24")
);

// --- World gating + unlock -------------------------------------------------------
await page.click("text=Worlds");
check(
  "garden retreat locked below level 3",
  await page.locator(".world-card:has-text('Garden Retreat') button:disabled").isVisible()
);
await page.click("text=Account");
await page.click("button:has-text('Grant +100')");
await page.click("text=Worlds");
await page.click(".world-card:has-text('Garden Retreat') button:has-text('Unlock')");
await page.waitForSelector(".world-card:has-text('Garden Retreat') .owned-badge");
check("garden retreat unlocked and active after XP grant", true);
await shot(page, "05-worlds");

await browser.close();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
