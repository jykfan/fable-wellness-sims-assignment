import { useGame } from "../store/gameStore";
import { WORLDS, levelProgress } from "../game/economy";

export default function Hud() {
  const state = useGame((g) => g.state);
  const { level, into, needed, fraction } = levelProgress(state.xp);
  const world = WORLDS.find((w) => w.id === state.activeWorld);

  return (
    <header className="hud">
      <div className="hud-brand">
        <span className="hud-logo" aria-hidden>
          🌱
        </span>
        <div>
          <h1>Thriveworld</h1>
          <p className="hud-tagline">progress powered by real self-care</p>
        </div>
      </div>
      <div className="hud-stats">
        <div className="hud-stat" title="Sparks — earned currency, spent in the shop">
          <span className="hud-stat-value">✨ {state.sparks}</span>
          <span className="hud-stat-label">Sparks</span>
        </div>
        <div className="hud-stat hud-level" title={`${into} / ${needed} XP into level ${level}`}>
          <span className="hud-stat-value">Lv {level}</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${fraction * 100}%` }} />
          </div>
          <span className="hud-stat-label">{state.xp} XP</span>
        </div>
        <div className="hud-stat" title="Current world">
          <span className="hud-stat-value">
            {world?.emoji} {world?.name}
          </span>
          <span className="hud-stat-label">
            {state.subscription.active ? "✦ Subscriber" : "Free tier"}
          </span>
        </div>
      </div>
    </header>
  );
}
