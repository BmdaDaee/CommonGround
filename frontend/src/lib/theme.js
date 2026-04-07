// CommonGround Theme — Electric Neon / Anime x Hip-Hop Urban
export const theme = {
  colors: {
    bg: {
      primary: '#050505',
      secondary: '#121212',
      surface: 'rgba(0,0,0,0.6)',
      depth: '#1A1A1A',
      glass: 'rgba(255,255,255,0.04)',
    },
    accent: {
      primary: '#FF3333',
      secondary: '#FFE600',
      highlight: '#00FF88',
    },
    gradient: {
      emotional: { start: '#FF3333', end: '#FFE600' },
      neon: { start: '#FF3333', end: '#FF0066' },
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8A8A93',
      muted: '#555560',
      accent: '#FF3333',
    },
    border: '#222222',
    // DeeplyUs — crimson infrared
    deep: {
      bg: { primary: '#1A0000', secondary: '#2A0505', surface: 'rgba(40,0,0,0.6)' },
      accent: { primary: '#FF3333', secondary: '#8B0000', highlight: '#FFE600' },
      gradient: { start: '#8B0000', end: '#FF3333' },
      text: { primary: '#FFFFFF', secondary: '#D9A0A0', muted: '#8A5555', accent: '#FF3333' },
    },
  },

  typography: {
    fontFamily: {
      primary: "'Manrope', sans-serif",
      heading: "'Unbounded', 'Manrope', sans-serif",
    },
    size: {
      xs: '11px', sm: '13px', md: '15px', lg: '18px',
      xl: '22px', display: '32px', hero: '48px', mega: '64px',
    },
    lineHeight: { tight: 1.0, normal: 1.25, relaxed: 1.5 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
  },

  spacing: {
    0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px',
    5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px',
  },

  radius: {
    none: '0px', sm: '4px', md: '8px', lg: '12px', xl: '16px', round: '999px',
  },

  shadow: {
    soft: '0 2px 8px rgba(0,0,0,0.4)',
    medium: '0 4px 16px rgba(0,0,0,0.5)',
    card: '0 8px 32px rgba(0,0,0,0.6)',
    brutalist: '4px 4px 0px #FF3333',
    neonGlow: '0 0 20px rgba(255,51,51,0.4), 0 0 60px rgba(255,51,51,0.15)',
    deep: {
      soft: '0 4px 16px rgba(139,0,0,0.3)',
      glow: '0 0 24px rgba(255,51,51,0.5)',
    },
  },

  motion: {
    duration: { fast: '100ms', normal: '200ms', slow: '350ms' },
    easing: { default: 'cubic-bezier(0.4,0,0.2,1)', bounce: 'cubic-bezier(0.34,1.56,0.64,1)' },
  },
};

export const getThemeColors = (mode) => {
  if (mode === 'deeplyus') {
    return {
      bg: theme.colors.deep.bg,
      accent: theme.colors.deep.accent,
      text: theme.colors.deep.text,
      gradient: theme.colors.deep.gradient,
      shadow: theme.shadow.deep,
    };
  }
  return {
    bg: theme.colors.bg,
    accent: theme.colors.accent,
    text: theme.colors.text,
    gradient: theme.colors.gradient.emotional,
    shadow: theme.shadow,
  };
};

export default theme;
