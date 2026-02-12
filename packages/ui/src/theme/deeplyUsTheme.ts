import { colors, typography, toggleStates, radii, shadows } from "../../tokens";

const deeplyUsColors = colors.deeplyus ?? {};
const deeplyUsToggles = toggleStates.deeplyus ?? {};

export const deeplyUsTheme = {
  name: "deeplyus" as const,
  colors: {
    background: deeplyUsColors.background ?? "#9966CC",
    primary: deeplyUsColors.garnet ?? "#8B0000",
    secondary: deeplyUsColors.spinel ?? "#FF5CA2",
    accent: deeplyUsColors.tourmaline ?? "#3CB371",
    highlight: deeplyUsColors.citrine ?? "#E4C95D",
    chatSelf: deeplyUsColors.garnet ?? "#8B0000",
    chatPartner: deeplyUsColors.spinel ?? "#FF5CA2",
    chatSystem: deeplyUsColors.tourmaline ?? "#3CB371",
    textPrimary: deeplyUsColors.textPrimary ?? "#FDFDFD",
    textSecondary: deeplyUsColors.textSecondary ?? "#E5E7EB",
  },
  typography,
  toggles: {
    bgDefault: deeplyUsToggles.bgDefault ?? "#2A1240",
    bgActive: deeplyUsToggles.bgActive ?? "#8B0000",
    handle: deeplyUsToggles.handle ?? "#FF5CA2",
    border: deeplyUsToggles.border ?? "#E4C95D",
    textDefault: deeplyUsToggles.textDefault ?? "#FF5CA2",
    textActive: deeplyUsToggles.textActive ?? "#FFFFF2",
  },
  radii: {
    card: (radii.card ?? 16) + 2,
    button: radii.button ?? 999,
    bubble: (radii.bubble ?? 18) + 2,
  },
  shadows: {
    glow: shadows.glow,
  },
};
