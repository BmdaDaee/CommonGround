import { colors, typography, toggleStates, radii, shadows } from "../../tokens";

export const deeplyUsTheme = {
  name: "deeplyus" as const,
  colors: {
    background: colors.deeplyus.background,
    primary: colors.deeplyus.garnet,
    secondary: colors.deeplyus.spinel,
    accent: colors.deeplyus.tourmaline,
    highlight: colors.deeplyus.citrine,
    chatSelf: colors.deeplyus.garnet,
    chatPartner: colors.deeplyus.spinel,
    chatSystem: colors.deeplyus.tourmaline,
    textPrimary: colors.deeplyus.textPrimary,
    textSecondary: colors.deeplyus.textSecondary
  },
  typography,
  toggles: toggleStates.deeplyus,
  radii: {
    card: radii.card + 2,
    button: radii.button,
    bubble: radii.bubble + 2
  },
  shadows: {
    glow: shadows.glow
  }
};
