import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

// Calls `onLogout` (during render) when the session ends, so admin dialogs close instead of lingering over a logged-out page
export function useOnLogout(onLogout: () => void) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [wasLoggedIn, setWasLoggedIn] = useState(isLoggedIn);

  if (isLoggedIn !== wasLoggedIn) {
    setWasLoggedIn(isLoggedIn);
    if (!isLoggedIn) onLogout();
  }
}
