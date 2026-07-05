import { useEffect, useState } from "react";
import { useGame } from "../../store/gameStore";
import { BREATHING_CYCLES_PER_SET, breathingReward } from "../../game/economy";
import { toast } from "../../toast";

const PHASES = [
  { name: "Inhale", seconds: 4 },
  { name: "Hold", seconds: 4 },
  { name: "Exhale", seconds: 6 },
] as const;

/**
 * Visual breathing pacer. One cycle = inhale 4s / hold 4s / exhale 6s;
 * a set is 4 cycles and pays a flat reward per set.
 */
export default function Breathing({ onDone }: { onDone: () => void }) {
  const completeBreathing = useGame((g) => g.completeBreathing);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLeft, setPhaseLeft] = useState<number>(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setPhaseLeft((s) => {
        if (s > 1) return s - 1;
        setPhaseIdx((i) => {
          const next = (i + 1) % PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
        return 0; // replaced by the phase-change effect below
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    setPhaseLeft(PHASES[phaseIdx].seconds);
  }, [phaseIdx]);

  const sets = Math.floor(cycles / BREATHING_CYCLES_PER_SET);
  const phase = PHASES[phaseIdx];

  const finish = () => {
    setRunning(false);
    if (sets >= 1) {
      completeBreathing(sets);
      toast(`✨ +${breathingReward(sets).sparks} Sparks — ${sets} breathing ${sets === 1 ? "set" : "sets"}`);
    }
    onDone();
  };

  return (
    <section className="panel activity-flow">
      <h2>🌬️ Breathing exercise</h2>
      {!running ? (
        <>
          <p className="muted">
            Follow the pacer: inhale 4s, hold 4s, exhale 6s. Each set of{" "}
            {BREATHING_CYCLES_PER_SET} cycles earns{" "}
            {breathingReward(1).sparks} ✨.
          </p>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={() => {
                setCycles(0);
                setPhaseIdx(0);
                setPhaseLeft(PHASES[0].seconds);
                setRunning(true);
              }}
            >
              Start pacer
            </button>
            <button className="btn btn-ghost" onClick={onDone}>
              Close
            </button>
          </div>
        </>
      ) : (
        <div className="meditation-live">
          <div
            className={`pacer pacer-${phase.name.toLowerCase()}`}
            aria-hidden
          />
          <div className="pacer-phase">
            {phase.name} · {phaseLeft}s
          </div>
          <p className="muted">
            Cycles: {cycles} · Completed sets: {sets}
          </p>
          <button className="btn btn-primary" onClick={finish} disabled={sets < 1}>
            {sets < 1
              ? `Finish ${BREATHING_CYCLES_PER_SET} cycles to collect`
              : `Finish & collect +${breathingReward(sets).sparks} ✨`}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setRunning(false);
              onDone();
            }}
          >
            Stop (no reward)
          </button>
        </div>
      )}
    </section>
  );
}
