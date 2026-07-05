import { useEffect, useState } from "react";
import type { ToastDetail } from "../toast";

export default function Toasts() {
  const [toasts, setToasts] = useState<ToastDetail[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      setToasts((t) => [...t, detail]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== detail.id));
      }, 3200);
    }
    window.addEventListener("thriveworld:toast", onToast);
    return () => window.removeEventListener("thriveworld:toast", onToast);
  }, []);

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
