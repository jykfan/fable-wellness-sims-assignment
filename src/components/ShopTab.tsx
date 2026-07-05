import { useState } from "react";
import {
  CATALOG,
  PREMIUM_BUNDLES,
  PREMIUM_ITEMS,
  useGame,
} from "../store/gameStore";
import { toast } from "../toast";
import type { PremiumBundle, PremiumItem } from "../types";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type CheckoutTarget =
  | { kind: "item"; item: PremiumItem }
  | { kind: "bundle"; bundle: PremiumBundle };

export default function ShopTab() {
  const state = useGame((g) => g.state);
  const buyItem = useGame((g) => g.buyItem);
  const mockPurchaseItem = useGame((g) => g.mockPurchaseItem);
  const mockPurchaseBundle = useGame((g) => g.mockPurchaseBundle);
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);

  const owned = (id: string) => state.inventory.includes(id);

  const confirmCheckout = () => {
    if (!checkout) return;
    if (checkout.kind === "item") {
      mockPurchaseItem(checkout.item.id);
      toast(`🎁 ${checkout.item.name} added — demo purchase, no real charge`);
    } else {
      mockPurchaseBundle(checkout.bundle.id);
      toast(`🎁 ${checkout.bundle.name} added — demo purchase, no real charge`);
    }
    setCheckout(null);
  };

  return (
    <div className="shop-tab">
      <section className="panel">
        <h2>✨ Sparks Shop</h2>
        <p className="muted">
          Everything here is earned — spend the Sparks your real activities
          generated. You have <strong>{state.sparks} ✨</strong>.
        </p>
        <div className="item-grid">
          {CATALOG.map((item) => (
            <div key={item.id} className="item-card">
              <span className="item-emoji" aria-hidden>
                {item.emoji}
              </span>
              <strong>{item.name}</strong>
              <span className="muted small">{item.description}</span>
              <span className="item-category">{item.category}</span>
              {owned(item.id) ? (
                <span className="owned-badge">Owned ✓</span>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={state.sparks < item.sparks}
                  onClick={() => {
                    if (buyItem(item.id)) {
                      toast(`🛍️ Bought ${item.name} for ${item.sparks} ✨`);
                    }
                  }}
                >
                  {item.sparks} ✨
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel premium-panel">
        <div className="demo-banner">
          🧪 Demo Mode — premium purchases are simulated. No real charge.
        </div>
        <h2>💎 Premium Collection</h2>
        <p className="muted">
          Exclusive designs unlocked with a one-time purchase. Premium widens
          your catalog of choices — it never speeds up progression or replaces
          the earning loop.
        </p>
        <div className="item-grid">
          {PREMIUM_ITEMS.map((item) => (
            <div key={item.id} className="item-card item-card-premium">
              <span className="item-emoji" aria-hidden>
                {item.emoji}
              </span>
              <strong>{item.name}</strong>
              <span className="muted small">{item.description}</span>
              <span className="item-category">{item.category}</span>
              {owned(item.id) ? (
                <span className="owned-badge">Owned ✓</span>
              ) : (
                <button
                  className="btn btn-premium"
                  onClick={() => setCheckout({ kind: "item", item })}
                >
                  {usd(item.usdCents)}
                </button>
              )}
            </div>
          ))}
        </div>

        <h3>Bundles</h3>
        <div className="bundle-list">
          {PREMIUM_BUNDLES.map((bundle) => {
            const allOwned = bundle.itemIds.every(owned);
            const items = bundle.itemIds
              .map((id) => PREMIUM_ITEMS.find((i) => i.id === id))
              .filter(Boolean);
            return (
              <div key={bundle.id} className="bundle-card">
                <div>
                  <strong>{bundle.name}</strong>
                  <p className="muted small">{bundle.description}</p>
                  <span className="bundle-items">
                    {items.map((i) => `${i!.emoji} ${i!.name}`).join(" · ")}
                  </span>
                </div>
                {allOwned ? (
                  <span className="owned-badge">Owned ✓</span>
                ) : (
                  <button
                    className="btn btn-premium"
                    onClick={() => setCheckout({ kind: "bundle", bundle })}
                  >
                    {usd(bundle.usdCents)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {checkout && (
        <div className="modal-backdrop" onClick={() => setCheckout(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Demo checkout"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-banner">🧪 Demo Mode — no real charge</div>
            <h3>Confirm purchase</h3>
            <p>
              {checkout.kind === "item"
                ? `${checkout.item.emoji} ${checkout.item.name}`
                : `📦 ${checkout.bundle.name}`}
              {" — "}
              <strong>
                {usd(
                  checkout.kind === "item"
                    ? checkout.item.usdCents
                    : checkout.bundle.usdCents
                )}
              </strong>
            </p>
            <p className="muted small">
              In production this screen hands off to a PCI-compliant processor
              (e.g. Stripe Checkout) with server-side receipt validation. The
              prototype simply records a mock transaction.
            </p>
            <div className="btn-row">
              <button className="btn btn-premium" onClick={confirmCheckout}>
                Confirm demo purchase
              </button>
              <button className="btn btn-ghost" onClick={() => setCheckout(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
