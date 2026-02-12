cat > packages/ui/tokens/index.ts <<'EOF'
import colorsJson from "./colors.json";
import typographyJson from "./typography.json";
import toggleStatesJson from "./toggle-states.json";
import radiiJson from "./radii.json";
import shadowsJson from "./shadows.json";

// Defaults (so missing keys don't crash theme usage)
const defaultColors = {
  background: { primary: "#0F0F14", secondary: "#1A1A22", elevated: "#23232E" },
  text: { primary: "#FFFFFF", secondary: "#C7C7D1", muted: "#8E8EA0", inverse: "#0F0F14" },
  accent: { primary: "#8B5CF6", secondary: "#EC4899", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444" },
  border: { subtle: "#2C2C38", strong: "#3A3A4A" }
};

const defaultTypography = {
  fontFamily: { base: "System", heading: "System" },
  fontWeight: { regular: "400", medium: "500", semibold: "600", bold: "700" },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, "2xl": 28 },
  lineHeight: { tight: 16, normal: 22, relaxed: 28 }
};

const defaultToggleStates = {
  opacity: { enabled: 1, disabled: 0.4, pressed: 0.75 },
  scale: { pressed: 0.97 },
  duration: { fast: 100, normal: 200 }
};

const defaultRadii = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

const defaultShadows = {
  none: { shadowColor: "#000000", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  sm: { shadowColor: "#000000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  lg: { shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }
};

// Merge defaults with JSON overrides
export const colors = { ...defaultColors, ...(colorsJson as any) };
export const typography = { ...defaultTypography, ...(typographyJson as any) };
export const toggleStates = { ...defaultToggleStates, ...(toggleStatesJson as any) };
export const radii = { ...defaultRadii, ...(radiiJson as any) };
export const shadows = { ...defaultShadows, ...(shadowsJson as any) };

export default { colors, typography, toggleStates, radii, shadows };
EOF