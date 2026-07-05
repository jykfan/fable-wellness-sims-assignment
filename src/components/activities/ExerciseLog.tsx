import { useState } from "react";
import { useGame } from "../../store/gameStore";
import { exerciseReward } from "../../game/economy";
import { toast } from "../../toast";

const TYPES = ["Walk", "Run", "Bike", "Yoga", "Strength", "Other"];

/** Manual exercise entry: type + duration. Reward scales with duration. */
export default function ExerciseLog({ onDone }: { onDone: () => void }) {
  const logExercise = useGame((g) => g.logExercise);
  const [type, setType] = useState(TYPES[0]);
  const [minutes, setMinutes] = useState(20);

  const reward = exerciseReward(minutes);

  return (
    <section className="panel activity-flow">
      <h2>🏃 Log exercise</h2>
      <div className="chip-list">
        {TYPES.map((t) => (
          <button
            key={t}
            className={`chip ${type === t ? "chip-on" : ""}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label className="field">
        <span>
          Duration: <strong>{minutes} min</strong> → +{reward.sparks} ✨
        </span>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </label>
      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            logExercise(type, minutes);
            toast(`✨ +${reward.sparks} Sparks — ${type.toLowerCase()} logged`);
            onDone();
          }}
        >
          Log · +{reward.sparks} ✨
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Close
        </button>
      </div>
    </section>
  );
}
