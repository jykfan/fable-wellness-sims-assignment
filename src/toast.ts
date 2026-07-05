// Tiny fire-and-forget toast bus so activity flows can celebrate rewards
// without threading callbacks through the store.

export interface ToastDetail {
  id: number;
  message: string;
}

let nextId = 1;

export function toast(message: string) {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>("thriveworld:toast", {
      detail: { id: nextId++, message },
    })
  );
}
