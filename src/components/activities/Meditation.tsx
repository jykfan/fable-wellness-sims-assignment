import { useEffect, useRef, useState } from "react";
import { useGame } from "../../store/gameStore";
import { meditationReward } from "../../game/economy";
import { toast } from "../../toast";

/**
 * Timer-based guided meditation (1–10 min) with a slow breathing
 * animation. The reward scales with the chosen length and is granted
 * when the timer completes.
 */
export default function Meditation({ onDone }: { onDone: () => void }) {
  const completeMeditation = useGame((g) => g.completeMeditation);
  const [minutes, setMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (!done.current) {
            done.current = true;
            completeMeditation(minutes);
            toast(`✨ +${meditationReward(minutes).sparks} Sparks — meditation complete`);
            onDone();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, minutes, completeMeditation, onDone]);

  const start = () => {
    done.current = false;
    setSecondsLeft(minutes * 60);
    setRunning(true);
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <section className="panel activity-flow">
      <h2>🧘 Guided meditation</h2>
      {!running ? (
        <>
          <label className="field">
            <span>
              Session length: <strong>{minutes} min</strong> → earns{" "}
              {meditationReward(minutes).sparks} ✨
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <p className="muted">
            Sit comfortably, soften your gaze, and follow the circle when you
            start.
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={start}>
              Begin session
            </button>
            <button className="btn btn-ghost" onClick={onDone}>
              Close
            </button>
          </div>
        </>
      ) : (
        <div className="meditation-live">
          <div className="breath-circle" aria-hidden />
          <div className="meditation-timer">
            {mm}:{ss}
          </div>
          <p className="muted">Breathe with the circle. In… and out…</p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setRunning(false);
              onDone();
            }}
          >
            End early (no reward)
          </button>
        </div>
      )}
    </section>
  );
}
