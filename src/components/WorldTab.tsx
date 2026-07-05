import { CATALOG, PREMIUM_ITEMS, useGame } from "../store/gameStore";
import { WORLDS } from "../game/economy";
import Avatar, { findCosmetic } from "./Avatar";
import type { ItemSlot } from "../types";

const SKIN_TONES = ["#f6d7b0", "#e8b98a", "#c98d5e", "#9c6b43", "#6e4a2f"];
const HAIR_COLORS = ["#2b2118", "#4a3728", "#8a5a2b", "#b5651d", "#c9c1b6", "#7a4988"];

export default function WorldTab() {
  const state = useGame((g) => g.state);
  const togglePlacement = useGame((g) => g.togglePlacement);
  const equip = useGame((g) => g.equip);
  const setAvatarColors = useGame((g) => g.setAvatarColors);
  const setAvatarName = useGame((g) => g.setAvatarName);

  const world = WORLDS.find((w) => w.id === state.activeWorld) ?? WORLDS[0];
  const placed = state.placements[world.id] ?? [];

  const ownedDecor = state.inventory
    .map((id) => CATALOG.find((i) => i.id === id) ?? PREMIUM_ITEMS.find((i) => i.id === id))
    .filter((i) => i && (i.category === "decor" || i.category === "upgrade"));

  const ownedClothing = state.inventory
    .map((id) => CATALOG.find((i) => i.id === id) ?? PREMIUM_ITEMS.find((i) => i.id === id))
    .filter((i) => i && i.category === "clothing");

  return (
    <div className="world-tab">
      <section className="scene-card">
        <div className="scene" style={{ background: world.sky }}>
          <div className="scene-ground" style={{ background: world.ground }} />
          <div className="scene-world-emoji" aria-hidden>
            {world.emoji}
          </div>
          {placed.map((itemId, i) => {
            const slot = world.slots[i];
            const item =
              CATALOG.find((c) => c.id === itemId) ??
              PREMIUM_ITEMS.find((c) => c.id === itemId);
            if (!slot || !item) return null;
            return (
              <span
                key={itemId}
                className="scene-item"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                title={item.name}
              >
                {item.emoji}
              </span>
            );
          })}
          <div className="scene-avatar">
            <Avatar size={92} />
          </div>
        </div>
        <div className="scene-caption">
          <strong>
            {world.emoji} {world.name}
          </strong>
          <span>{world.description}</span>
        </div>
      </section>

      <div className="world-panels">
        <section className="panel">
          <h2>🪑 Decorate this world</h2>
          {ownedDecor.length === 0 ? (
            <p className="muted">
              No decor yet — earn Sparks in <em>Activities</em>, then visit the{" "}
              <em>Shop</em>.
            </p>
          ) : (
            <ul className="chip-list">
              {ownedDecor.map((item) => {
                const isPlaced = placed.includes(item!.id);
                return (
                  <li key={item!.id}>
                    <button
                      className={`chip ${isPlaced ? "chip-on" : ""}`}
                      onClick={() => togglePlacement(world.id, item!.id)}
                    >
                      {item!.emoji} {item!.name} {isPlaced ? "· placed" : ""}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="muted small">
            Placements are saved per world ({placed.length}/{world.slots.length}{" "}
            slots used).
          </p>
        </section>

        <section className="panel">
          <h2>👤 Wardrobe</h2>
          <label className="field">
            <span>Name</span>
            <input
              value={state.avatar.name}
              maxLength={20}
              onChange={(e) => setAvatarName(e.target.value)}
            />
          </label>
          <div className="swatch-row">
            <span>Skin</span>
            {SKIN_TONES.map((c) => (
              <button
                key={c}
                className={`swatch ${state.avatar.skinTone === c ? "swatch-on" : ""}`}
                style={{ background: c }}
                aria-label={`Skin tone ${c}`}
                onClick={() => setAvatarColors(c, state.avatar.hairColor)}
              />
            ))}
          </div>
          <div className="swatch-row">
            <span>Hair</span>
            {HAIR_COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${state.avatar.hairColor === c ? "swatch-on" : ""}`}
                style={{ background: c }}
                aria-label={`Hair color ${c}`}
                onClick={() => setAvatarColors(state.avatar.skinTone, c)}
              />
            ))}
          </div>
          {(["top", "hat", "accessory"] as ItemSlot[]).map((slot) => {
            const options = ownedClothing.filter((i) => i!.slot === slot);
            const equipped = findCosmetic(state.avatar.equipped[slot]);
            return (
              <div key={slot} className="wardrobe-slot">
                <span className="wardrobe-slot-name">{slot}</span>
                <div className="chip-list">
                  <button
                    className={`chip ${!equipped ? "chip-on" : ""}`}
                    onClick={() => equip(slot, null)}
                  >
                    none
                  </button>
                  {options.map((item) => (
                    <button
                      key={item!.id}
                      className={`chip ${state.avatar.equipped[slot] === item!.id ? "chip-on" : ""}`}
                      onClick={() => equip(slot, item!.id)}
                    >
                      {item!.emoji} {item!.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {ownedClothing.length === 0 && (
            <p className="muted small">Clothing you buy appears here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
