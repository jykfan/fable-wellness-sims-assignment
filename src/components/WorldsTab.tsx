import { useGame } from "../store/gameStore";
import { WORLDS, levelForXp, xpForLevel } from "../game/economy";
import { toast } from "../toast";

export default function WorldsTab({
  onGoToActivities,
}: {
  onGoToActivities: () => void;
}) {
  const state = useGame((g) => g.state);
  const unlockWorld = useGame((g) => g.unlockWorld);
  const setActiveWorld = useGame((g) => g.setActiveWorld);
  const level = levelForXp(state.xp);

  return (
    <div className="worlds-tab">
      <section className="panel">
        <h2>🗺️ Worlds</h2>
        <p className="muted">
          Leveling up unlocks access to new worlds (Sparks are never required
          here — currency buys things, XP opens doors). You are level{" "}
          <strong>{level}</strong>.
        </p>
        <div className="world-grid">
          {WORLDS.map((w) => {
            const unlocked = state.unlockedWorlds.includes(w.id);
            const reachable = level >= w.requiredLevel;
            const active = state.activeWorld === w.id;
            return (
              <div
                key={w.id}
                className={`world-card ${active ? "world-card-active" : ""} ${
                  !unlocked && !reachable ? "world-card-locked" : ""
                }`}
              >
                <div className="world-card-scene" style={{ background: w.sky }}>
                  <span aria-hidden>{w.emoji}</span>
                </div>
                <strong>{w.name}</strong>
                <p className="muted small">{w.description}</p>
                {active ? (
                  <span className="owned-badge">Current world</span>
                ) : unlocked ? (
                  <button className="btn" onClick={() => setActiveWorld(w.id)}>
                    Move in
                  </button>
                ) : reachable ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      unlockWorld(w.id);
                      toast(`🔓 ${w.name} unlocked!`);
                    }}
                  >
                    Unlock (level {w.requiredLevel} reached)
                  </button>
                ) : (
                  <button className="btn" disabled>
                    🔒 Level {w.requiredLevel} · {xpForLevel(w.requiredLevel)} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="muted small">
          Need XP? Every real activity grants it —{" "}
          <button className="linklike" onClick={onGoToActivities}>
            head to Activities
          </button>
          .
        </p>
      </section>
    </div>
  );
}
