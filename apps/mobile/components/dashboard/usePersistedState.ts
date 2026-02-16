import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (!alive) return;
        if (raw != null) setValue(JSON.parse(raw));
      } catch {
        // ignore hydration failure
      } finally {
        hydrated.current = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore save failure
      }
    })();
  }, [key, value]);

  return [value, setValue] as const;
}
