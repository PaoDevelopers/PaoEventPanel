import { useSyncExternalStore } from "react";

export const RELAY_HASH = "#relay";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useIsRelayRoute(): boolean {
  return useSyncExternalStore(subscribe, () => window.location.hash === RELAY_HASH);
}
