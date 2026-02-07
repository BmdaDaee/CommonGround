import colors from "../../tokens/colors.json";
import typography from "../../tokens/typography.json";
import toggleStates from "../../tokens/toggle-states.json";
import radii from "../../tokens/radii.json";
import shadows from "../../tokens/shadows.json";

const colorTokens: any = colors;
const toggleTokens: any = toggleStates;
const radiiTokens: any = radii;
const shadowTokens: any = shadows;

export const commonGroundTheme = {
  name: "commonground" as const,
  colors: {
    background: colorTokens.commonground.background,
    primary: colorTokens.commonground.mintAqua,
    secondary: colorTokens.commonground.sunbeam,
    chatSelf: colorTokens.commonground.mintAqua,
    chatOther: colorTokens.commonground.blushPink,
    chip: colorTokens.commonground.paleMint,
    textPrimary: colorTokens.commonground.textPrimary,
    textSecondary: colorTokens.commonground.textSecondary
  },
  typography,
  toggles: toggleTokens.commonground,
  radii: {
    card: radiiTokens.card,
    button: radiiTokens.button,
    bubble: radiiTokens.bubble
  },
  shadows: {
    soft: shadowTokens.soft
  }
};
