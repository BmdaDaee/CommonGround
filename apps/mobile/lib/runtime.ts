import Constants from "expo-constants";
import { Platform } from "react-native";

function getDevHost(): string | null {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri ||
    null;

  if (typeof hostUri !== "string") return null;

  const host = hostUri.split(":")[0];
  if (!host || host === "localhost") return null;
  return host;
}

const envBase = process.env.EXPO_PUBLIC_CG_API_BASE_URL;

export const apiBaseURL = (() => {
  if (envBase && typeof envBase === "string" && envBase.trim()) return envBase.trim();

  const devHost = getDevHost();
  const host =
    Platform.OS === "android"
      ? "10.0.2.2"
      : devHost || "localhost";

  return `http://${host}:3001`;
})();
