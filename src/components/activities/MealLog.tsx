import { useState } from "react";
import { useGame } from "../../store/gameStore";
import { mealReward, nextMealStreak } from "../../game/economy";
import { toast } from "../../toast";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack"];

/**
 * Simple meal log: rough category + text description. (The data model
 * reserves a photoUrl field for the backend phase — see DECISIONS.md for
 * why photos aren't persisted in the localStorage prototype.)
 */
export default function MealLog({ onDone }: { onDone: () => void }) {
  const logMeal = useGame((g) => g.logMeal);
  const mealStreak = useGame((g) => g.state.mealStreak);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const upcomingStreak = nextMealStreak(mealStreak, Date.now());
  const reward = mealReward(upcomingStreak.days);

  return (
    <section className="panel activity-flow">
      <h2>🥗 Log a meal</h2>
      <div className="chip-list">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "chip-on" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <label className="field">
        <span>What did you eat?</span>
        <textarea
          rows={2}
          placeholder="e.g. veggie stir-fry with rice"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <p className="muted small">
        Streak: {mealStreak.days} {mealStreak.days === 1 ? "day" : "days"} —
        logging today earns +{reward.sparks} ✨ (includes streak bonus).
      </p>
      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            logMeal(description.trim(), category);
            toast(`✨ +${reward.sparks} Sparks — meal logged`);
            onDone();
          }}
        >
          Log meal · +{reward.sparks} ✨
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Close
        </button>
      </div>
    </section>
  );
}
