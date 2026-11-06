import { useEffect, useState } from "react";

const TOAST_KEY = "foodbridge_pref_toasts";

export function getToastPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(TOAST_KEY) !== "off";
}

/** Whether real-time notifications pop up as toasts. Stored per browser. */
export function useToastPreference() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(getToastPreference()), []);
  const update = (v: boolean) => {
    setEnabled(v);
    window.localStorage.setItem(TOAST_KEY, v ? "on" : "off");
  };
  return [enabled, update] as const;
}
