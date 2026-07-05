import { useEffect, useState } from "react";
import { useGame } from "./store/gameStore";
import Hud from "./components/Hud";
import Toasts from "./components/Toasts";
import WorldTab from "./components/WorldTab";
import ActivitiesTab from "./components/ActivitiesTab";
import ShopTab from "./components/ShopTab";
import WorldsTab from "./components/WorldsTab";
import AccountTab from "./components/AccountTab";

const TABS = [
  { id: "world", label: "My World", emoji: "🏡" },
  { id: "activities", label: "Activities", emoji: "🧘" },
  { id: "shop", label: "Shop", emoji: "🛍️" },
  { id: "worlds", label: "Worlds", emoji: "🗺️" },
  { id: "account", label: "Account", emoji: "⚙️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function App() {
  const init = useGame((g) => g.init);
  const loaded = useGame((g) => g.loaded);
  const [tab, setTab] = useState<TabId>("world");

  useEffect(() => {
    void init();
  }, [init]);

  if (!loaded) {
    return <div className="loading">Loading your world…</div>;
  }

  return (
    <div className="app">
      <Hud />
      <nav className="tabs" aria-label="Main navigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === "world" && <WorldTab />}
        {tab === "activities" && <ActivitiesTab />}
        {tab === "shop" && <ShopTab />}
        {tab === "worlds" && <WorldsTab onGoToActivities={() => setTab("activities")} />}
        {tab === "account" && <AccountTab />}
      </main>
      <Toasts />
    </div>
  );
}
