import { useMemo, useState } from "react";
import { useGame } from "../../store/gameStore";
import { journalReward } from "../../game/economy";
import { toast } from "../../toast";

const GRATITUDE_PROMPTS = [
  "What made you smile today, even briefly?",
  "Who is someone you're glad exists?",
  "Name one small comfort you often overlook.",
  "What went better than expected recently?",
];

const WORRY_PROMPTS = [
  "What's weighing on you right now?",
  "What's the worry underneath the worry?",
  "What would you tell a friend carrying this?",
];

/**
 * Gratitude & worry journals. Free text with no minimum length (per the
 * spec's locked decisions). The worry journal shows an always-visible,
 * static support-resources footer — deliberately NOT conditional on
 * content (no sentiment/crisis detection in this prototype, per spec).
 */
export default function Journal({
  kind,
  onDone,
}: {
  kind: "gratitude" | "worry";
  onDone: () => void;
}) {
  const addJournalEntry = useGame((g) => g.addJournalEntry);
  const [text, setText] = useState("");
  const [reframe, setReframe] = useState("");
  const [showReframe, setShowReframe] = useState(false);

  const prompt = useMemo(() => {
    const list = kind === "gratitude" ? GRATITUDE_PROMPTS : WORRY_PROMPTS;
    return list[Math.floor(Math.random() * list.length)];
  }, [kind]);

  const reward = journalReward();
  const title = kind === "gratitude" ? "🙏 Gratitude journal" : "🌧️ Worry journal";

  return (
    <section className="panel activity-flow">
      <h2>{title}</h2>
      <p className="journal-prompt">“{prompt}”</p>
      <label className="field">
        <span>Your entry</span>
        <textarea
          rows={4}
          value={text}
          placeholder="Write as much or as little as you like…"
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      {kind === "worry" && !showReframe && (
        <button className="btn btn-ghost" onClick={() => setShowReframe(true)}>
          Optional: try a reframe →
        </button>
      )}
      {kind === "worry" && showReframe && (
        <label className="field">
          <span>
            Reframe (optional): is there a kinder or more balanced way to see
            this?
          </span>
          <textarea
            rows={3}
            value={reframe}
            onChange={(e) => setReframe(e.target.value)}
          />
        </label>
      )}

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={text.trim().length === 0}
          onClick={() => {
            addJournalEntry(kind, text.trim(), reframe.trim() || undefined);
            toast(`✨ +${reward.sparks} Sparks — entry saved`);
            onDone();
          }}
        >
          Save entry · +{reward.sparks} ✨
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Close
        </button>
      </div>

      {kind === "worry" && (
        <footer className="support-footer">
          <strong>If you're struggling, you deserve support.</strong> These
          are always here, whatever you write above:
          <ul>
            <li>
              US: call or text <strong>988</strong> (Suicide &amp; Crisis
              Lifeline) — 24/7, free
            </li>
            <li>
              US: text <strong>HOME</strong> to <strong>741741</strong>{" "}
              (Crisis Text Line)
            </li>
            <li>
              Elsewhere:{" "}
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
              >
                findahelpline.com
              </a>{" "}
              lists helplines by country
            </li>
          </ul>
          This app is a wellness game, not a substitute for professional care.
        </footer>
      )}
    </section>
  );
}
