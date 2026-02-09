import colorsV2 from "../../tokens/colors.v2.json";
import colorsLegacy from "../../tokens/colors.json";
import typography from "../../tokens/typography.json";
import spacing from "../../tokens/spacing.json";
import radius from "../../tokens/radius.json";
import effects from "../../tokens/effects.json";

export const TOKENS = {
  colorsV2,
  colorsLegacy,
  typography,
  spacing,
  radius,
  effects
};

type Variant = "commonground" | "deeplyus";

export function buildTheme(variant: Variant) {
  const legacy: any = TOKENS.colorsLegacy[variant] || {};
  const v2: any = TOKENS.colorsV2[variant] || {};
  const axm: any = TOKENS.colorsV2.axm || TOKENS.colorsLegacy.axm || {};

  const background = v2.backgroundLight || legacy.backgroundLight || (TOKENS.colorsV2.bg && TOKENS.colorsV2.bg.light) || "#FFFFFF";
  const surface = v2.backgroundAlt || legacy.backgroundAlt || (TOKENS.colorsV2.bg && TOKENS.colorsV2.bg.alt) || background;

  const primary = v2.primaryAccent || legacy.primaryAccent || (TOKENS.colorsV2.accent && TOKENS.colorsV2.accent.primary) || "#000000";
  const secondary = v2.secondaryAccent || legacy.secondaryAccent || (TOKENS.colorsV2.accent && TOKENS.colorsV2.accent.secondary) || primary;
  const highlight = v2.highlight || legacy.highlight || primary;
  const text = axm.primaryDark || (TOKENS.colorsV2.text && TOKENS.colorsV2.text.dark) || (TOKENS.colorsLegacy.axm && TOKENS.colorsLegacy.axm.primaryDark) || "#000000";
  const depth = v2.depth || legacy.depth || (TOKENS.colorsV2.deeplyus && TOKENS.colorsV2.deeplyus.depth) || "#000000";

  const gradientStart = (v2.gradient && v2.gradient.emotional && v2.gradient.emotional.start) || legacy.gradientStart || v2.gradientStart || (TOKENS.colorsV2.gradient && TOKENS.colorsV2.gradient.emotional && TOKENS.colorsV2.gradient.emotional.start) || "#FFFFFF";
  const gradientEnd = (v2.gradient && v2.gradient.emotional && v2.gradient.emotional.end) || legacy.gradientEnd || v2.gradientEnd || (TOKENS.colorsV2.gradient && TOKENS.colorsV2.gradient.emotional && TOKENS.colorsV2.gradient.emotional.end) || "#FFFFFF";

  const colors = {
    background,
    surface,

    primary,
    secondary,
    highlight,
    text,
    depth,

    gradientStart,
    gradientEnd,

    // chat specific
    chatSelf: primary,
    chatPartner: secondary,
    chatSystem: highlight,
    chatOther: surface,
    chip: surface,
    textPrimary: text
  };

  const toggles = {
    border: depth,
    bgDefault: surface,
    bgActive: primary,
    textActive: "#FFFFFF",
    textDefault: text
  };

  const radii = {
    bubble: (TOKENS.radius.md as any) || 14,
    card: (TOKENS.radius.lg as any) || 16,
    input: (TOKENS.radius.md as any) || 14,
    button: (TOKENS.radius.md as any) || 14
  };

  return {
    name: variant,
    colors,
    typography: TOKENS.typography,
    space: TOKENS.spacing,
    layout: {
      container: TOKENS.spacing.container || TOKENS.spacing.md
    },
    radius: TOKENS.radius,
    radii,
    toggles,
    shadow: TOKENS.effects.shadows,
    state: TOKENS.effects.state,
    motion: TOKENS.effects.motion,
    component: TOKENS.effects.components
  };
}

export default TOKENS;
