import colors from "../../tokens/colors.json";
import typography from "../../tokens/typography.json";
import toggleStates from "../../tokens/toggle-states.json";
import radii from "../../tokens/radii.json";
import shadows from "../../tokens/shadows.json";

const colorTokens: any = colors;
const toggleTokens: any = toggleStates;
const radiiTokens: any = radii;
const shadowTokens: any = shadows;

export const deeplyUsTheme = {
  name: "deeplyus" as const,
  colors: {
    background: colorTokens.deeplyus.background,
    primary: colorTokens.deeplyus.garnet,
    secondary: colorTokens.deeplyus.spinel,
    accent: colorTokens.deeplyus.tourmaline,
    highlight: colorTokens.deeplyus.citrine,
    chatSelf: colorTokens.deeplyus.garnet,
    chatPartner: colorTokens.deeplyus.spinel,
    chatSystem: colorTokens.deeplyus.tourmaline,
    textPrimary: colorTokens.deeplyus.textPrimary,
    textSecondary: colorTokens.deeplyus.textSecondary
  },
  typography,
  toggles: toggleTokens.deeplyus,
  radii: {
    card: radiiTokens.card + 2,
    button: radiiTokens.button,
    bubble: radiiTokens.bubble + 2
  },
  shadows: {
    glow: shadowTokens.glow
  }
};
