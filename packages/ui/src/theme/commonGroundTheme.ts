import { colors, typography, toggleStates, radii, shadows } from "../../tokens";

const commongroundColors = colors.commonground ?? {};
const commongroundToggles = toggleStates.commonground ?? {};

export const commonGroundTheme = {
  name: "commonground" as const,
  colors: {
    background: commongroundColors.background ?? "#FFFFF2",
    primary: commongroundColors.mintAqua ?? "#92EAD9",
    secondary: commongroundColors.sunbeam ?? "#FFDF7B",
    chatSelf: commongroundColors.mintAqua ?? "#92EAD9",
    chatOther: commongroundColors.blushPink ?? "#FFD0CE",
    chip: commongroundColors.paleMint ?? "#C1FFF0",
    textPrimary: commongroundColors.textPrimary ?? "#1F2933",
    textSecondary: commongroundColors.textSecondary ?? "#4B5563",
  },
  typography,
  toggles: {
    bgDefault: commongroundToggles.bgDefault ?? "#FFFFF2",
    bgActive: commongroundToggles.bgActive ?? "#92EAD9",
    handle: commongroundToggles.handle ?? "#FFFFFF",
    border: commongroundToggles.border ?? "#92EAD9",
    textDefault: commongroundToggles.textDefault ?? "#92EAD9",
    textActive: commongroundToggles.textActive ?? "#FFFFF2",
  },
  radii: {
    card: radii.card ?? 16,
    button: radii.button ?? 999,
    bubble: radii.bubble ?? 18,
  },
  shadows: {
    soft: shadows.soft,
  },
};
