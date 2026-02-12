import colorsJson from "./colors.json";
import typographyJson from "./typography.json";
import toggleStatesJson from "./toggle-states.json";
import radiiJson from "./radii.json";
import shadowsJson from "./shadows.json";
import spacingJson from "./spacing.json";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeWithDefaults<T extends AnyRecord>(defaults: T, overrides: unknown): T {
  if (!isRecord(overrides)) {
    return defaults;
  }

  const output: AnyRecord = { ...defaults };

  for (const [key, value] of Object.entries(overrides)) {
    const current = output[key];

    if (isRecord(current) && isRecord(value)) {
      output[key] = mergeWithDefaults(current, value);
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

const defaultTokens = {
  colors: {
    commonground: {
      background: "#FFFFF2",
      mintAqua: "#92EAD9",
      sunbeam: "#FFDF7B",
      blushPink: "#FFD0CE",
      paleMint: "#C1FFF0",
      textPrimary: "#1F2933",
      textSecondary: "#4B5563",
    },
    deeplyus: {
      background: "#9966CC",
      garnet: "#8B0000",
      amethyst: "#9966CC",
      spinel: "#FF5CA2",
      citrine: "#E4C95D",
      tourmaline: "#3CB371",
      textPrimary: "#FDFDFD",
      textSecondary: "#E5E7EB",
    },
  },
  typography: {
    fonts: {
      heading: "System",
      body: "System",
      accent: "System",
    },
    sizes: {
      h1: 32,
      h2: 24,
      h3: 20,
      body: 16,
      caption: 13,
    },
  },
  toggleStates: {
    commonground: {
      bgDefault: "#FFFFF2",
      bgActive: "#92EAD9",
      handle: "#FFFFFF",
      border: "#92EAD9",
      textDefault: "#92EAD9",
      textActive: "#FFFFF2",
    },
    deeplyus: {
      bgDefault: "#2A1240",
      bgActive: "#8B0000",
      handle: "#FF5CA2",
      border: "#E4C95D",
      textDefault: "#FF5CA2",
      textActive: "#FFFFF2",
    },
  },
  radii: {
    card: 16,
    button: 999,
    bubble: 18,
  },
  shadows: {
    soft: {
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    glow: {
      shadowColor: "#8B0000",
      shadowOpacity: 0.45,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};

export const colors = mergeWithDefaults(defaultTokens.colors, colorsJson);
export const typography = mergeWithDefaults(defaultTokens.typography, typographyJson);
export const toggleStates = mergeWithDefaults(defaultTokens.toggleStates, toggleStatesJson);
export const radii = mergeWithDefaults(defaultTokens.radii, radiiJson);
export const shadows = mergeWithDefaults(defaultTokens.shadows, shadowsJson);
export const spacing = mergeWithDefaults(defaultTokens.spacing, spacingJson);

export const tokens = {
  colors,
  typography,
  toggleStates,
  radii,
  shadows,
  spacing,
};

export default tokens;
