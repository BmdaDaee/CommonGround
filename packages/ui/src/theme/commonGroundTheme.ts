import { colors, typography, toggleStates, radii, shadows } from "../../tokens";

export const commonGroundTheme = {
  name: "commonground" as const,
  colors: {
    background: colors.commonground.background,
    primary: colors.commonground.mintAqua,
    secondary: colors.commonground.sunbeam,
    chatSelf: colors.commonground.mintAqua,
    chatOther: colors.commonground.blushPink,
    chip: colors.commonground.paleMint,
    textPrimary: colors.commonground.textPrimary,
    textSecondary: colors.commonground.textSecondary
  },
  typography,
  toggles: toggleStates.commonground,
  radii: {
    card: radii.card,
    button: radii.button,
    bubble: radii.bubble
  },
  shadows: {
    soft: shadows.soft
  }
};
