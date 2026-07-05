import { useState } from "react";
import tasksData from "../data/tasks.json";
import type { DefaultTaskDef } from "../types";
import { useGame } from "../store/gameStore";
import { toast } from "../toast";
import Meditation from "./activities/Meditation";
import Breathing from "./activities/Breathing";
import MealLog from "./activities/MealLog";
import ExerciseLog from "./activities/ExerciseLog";
import Journal from "./activities/Journal";

const TASKS = tasksData as DefaultTaskDef[];

export default function ActivitiesTab() {
  const [open, setOpen] = useState<string | null>(null);
  const state = useGame((g) => g.state);
  const completeCustomTask = useGame((g) => g.completeCustomTask);

  const close = () => setOpen(null);

  return (
    <div className="activities-tab">
      <div className="activities-main">
        <section className="panel">
          <h2>Daily activities</h2>
          <p className="muted">
            Every activity is a real-world action. Complete one to earn ✨
            Sparks (spend in the shop) and XP (levels unlock new worlds). Do as
            many as you like — there are no daily caps.
          </p>
          <div className="task-grid">
            {TASKS.map((t) => (
              <button
                key={t.id}
                className={`task-card ${open === t.id ? "task-card-open" : ""}`}
                onClick={() => setOpen(open === t.id ? null : t.id)}
              >
                <span className="task-emoji" aria-hidden>
                  {t.emoji}
                </span>
                <strong>{t.name}</strong>
                <span className="task-blurb">{t.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {open === "meditation" && <Meditation onDone={close} />}
        {open === "breathing" && <Breathing onDone={close} />}
        {open === "meal" && <MealLog onDone={close} />}
        {open === "exercise" && <ExerciseLog onDone={close} />}
        {open === "gratitude" && <Journal kind="gratitude" onDone={close} />}
        {open === "worry" && <Journal kind="worry" onDone={close} />}

        <section className="panel">
          <h2>✦ Your custom tasks</h2>
          {!state.subscription.active && state.customTasks.length === 0 ? (
            <p className="muted">
              Subscribers ($10/mo) can create their own tasks with self-set
              Spark payouts — set it up under <em>Account</em>.
            </p>
          ) : state.customTasks.length === 0 ? (
            <p className="muted">
              No custom tasks yet — create one under <em>Account</em>.
            </p>
          ) : (
            <ul className="custom-task-list">
              {state.customTasks.map((t) => (
                <li key={t.id} className="custom-task">
                  <div>
                    <strong>{t.name}</strong>
                    {t.minutes ? <span className="muted"> · ~{t.minutes} min</span> : null}
                    {t.description && <p className="muted small">{t.description}</p>}
                  </div>
                  <button
                    className="btn"
                    disabled={!state.subscription.active}
                    title={
                      state.subscription.active
                        ? undefined
                        : "Re-subscribe to complete custom tasks"
                    }
                    onClick={() => {
                      completeCustomTask(t.id);
                      toast(`✨ +${t.sparks} Sparks — ${t.name}`);
                    }}
                  >
                    Done · +{t.sparks} ✨
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="panel activity-feed">
        <h2>Recent activity</h2>
        {state.activityLog.length === 0 ? (
          <p className="muted">Nothing yet — your story starts today.</p>
        ) : (
          <ul>
            {[...state.activityLog]
              .reverse()
              .slice(0, 15)
              .map((e) => (
                <li key={e.id}>
                  <span>{e.label}</span>
                  <span className="feed-reward">
                    +{e.sparks} ✨ · +{e.xp} XP
                  </span>
                </li>
              ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
