import colors from "../../tokens/colors.json";
import typography from "../../tokens/typography.json";
import toggleStates from "../../tokens/toggle-states.json";
import radii from "../../tokens/radii.json";
import shadows from "../../tokens/shadows.json";

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
