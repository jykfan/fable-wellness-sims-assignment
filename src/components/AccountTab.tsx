import { useState } from "react";
import { useGame } from "../store/gameStore";
import {
  CUSTOM_TASK_MAX_SPARKS,
  SUBSCRIPTION_PRICE_CENTS,
} from "../game/economy";
import { toast } from "../toast";

export default function AccountTab() {
  const state = useGame((g) => g.state);
  const subscribe = useGame((g) => g.subscribe);
  const cancelSubscription = useGame((g) => g.cancelSubscription);
  const addCustomTask = useGame((g) => g.addCustomTask);
  const deleteCustomTask = useGame((g) => g.deleteCustomTask);
  const grantDemoResources = useGame((g) => g.grantDemoResources);
  const resetSave = useGame((g) => g.resetSave);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [sparks, setSparks] = useState(10);
  const [confirmReset, setConfirmReset] = useState(false);

  const sub = state.subscription;
  const price = `$${(SUBSCRIPTION_PRICE_CENTS / 100).toFixed(0)}/month`;

  const createTask = () => {
    if (!name.trim()) return;
    addCustomTask(
      name,
      description,
      minutes.trim() ? Math.max(1, Number(minutes)) : null,
      sparks
    );
    toast(`✦ Custom task “${name.trim()}” created`);
    setName("");
    setDescription("");
    setMinutes("");
    setSparks(10);
  };

  return (
    <div className="account-tab">
      <section className="panel">
        <div className="demo-banner">
          🧪 Demo Mode — subscription billing is simulated. No real charge.
        </div>
        <h2>✦ Thriveworld Plus — {price}</h2>
        <p className="muted">
          Free players get the six default activities with fixed payouts.
          Subscribers can create <strong>custom tasks</strong> with their own
          Spark values — personalize the loop around the habits that matter to
          you. Subscribing never changes default payouts or progression speed.
        </p>
        {sub.active ? (
          <div className="sub-status">
            <span className="owned-badge">Active</span>
            <span className="muted small">
              (mock) renews {sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : "—"}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                cancelSubscription();
                toast("Subscription cancelled — custom tasks kept, but gated");
              }}
            >
              Cancel subscription
            </button>
          </div>
        ) : (
          <button
            className="btn btn-premium"
            onClick={() => {
              subscribe();
              toast("✦ Subscribed (demo) — custom tasks unlocked");
            }}
          >
            Subscribe · {price} (demo)
          </button>
        )}
      </section>

      <section className={`panel ${sub.active ? "" : "panel-gated"}`}>
        <h2>Create a custom task</h2>
        {!sub.active && (
          <p className="muted">🔒 Subscriber feature — subscribe above to unlock.</p>
        )}
        <fieldset disabled={!sub.active} className="custom-task-form">
          <label className="field">
            <span>Task name</span>
            <input
              value={name}
              maxLength={60}
              placeholder="e.g. 30 min focused reading"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input
              value={description}
              maxLength={140}
              placeholder="What counts as done?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Duration in minutes (optional)</span>
            <input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <label className="field">
            <span>
              Spark payout: <strong>{sparks} ✨</strong> per completion
            </span>
            <input
              type="range"
              min={1}
              max={CUSTOM_TASK_MAX_SPARKS}
              value={sparks}
              onChange={(e) => setSparks(Number(e.target.value))}
            />
          </label>
          <p className="muted small">
            You choose the payout, up to {CUSTOM_TASK_MAX_SPARKS} ✨ — a soft
            ceiling that keeps earned Sparks meaningful. Custom tasks always
            grant a standard 10 XP so world progression stays fair.
          </p>
          <button className="btn btn-primary" onClick={createTask} disabled={!name.trim()}>
            Create task
          </button>
        </fieldset>
        {state.customTasks.length > 0 && (
          <ul className="custom-task-list">
            {state.customTasks.map((t) => (
              <li key={t.id} className="custom-task">
                <div>
                  <strong>{t.name}</strong>{" "}
                  <span className="muted small">+{t.sparks} ✨ / 10 XP</span>
                </div>
                <button className="btn btn-ghost" onClick={() => deleteCustomTask(t.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Purchase history (mock)</h2>
        {state.premiumPurchases.length === 0 ? (
          <p className="muted">No demo purchases yet.</p>
        ) : (
          <ul className="purchase-list">
            {state.premiumPurchases.map((p) => (
              <li key={p.id}>
                <span>{p.sku}</span>
                <span className="muted small">
                  ${(p.usdCents / 100).toFixed(2)} · {new Date(p.at).toLocaleString()} · demo
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Prototype tools</h2>
        <p className="muted small">
          For reviewing the prototype only — lets you preview higher levels and
          the shop without days of real activities. A production build ships
          without this section.
        </p>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => {
              grantDemoResources();
              toast("🧪 +100 Sparks, +100 XP (demo grant)");
            }}
          >
            Grant +100 ✨ / +100 XP
          </button>
          {!confirmReset ? (
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
              Reset save…
            </button>
          ) : (
            <>
              <button
                className="btn btn-danger"
                onClick={() => {
                  void resetSave();
                  setConfirmReset(false);
                  toast("Save wiped — fresh start");
                }}
              >
                Really reset (deletes everything)
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                Keep my save
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
