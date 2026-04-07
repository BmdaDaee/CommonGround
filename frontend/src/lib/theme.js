// CommonGround Theme — Black Gold / Iridescent Purple / Red — Anime x Hip-Hop Urban
export const theme = {
  colors: {
    bg: {
      primary: '#050505',
      secondary: '#0C0C0C',
      surface: 'rgba(10,10,10,0.85)',
      depth: '#111111',
      glass: 'rgba(255,255,255,0.03)',
    },
    accent: {
      primary: '#D4AF37',     // Gold
      secondary: '#9D4EDD',   // Iridescent Purple
      highlight: '#E63946',   // Deep Red
    },
    gradient: {
      emotional: { start: '#D4AF37', end: '#9D4EDD' },
      neon: { start: '#9D4EDD', end: '#E63946' },
      iridescent: { start: '#7B2FF7', end: '#C084FC', mid: '#D4AF37' },
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      muted: '#555555',
      accent: '#D4AF37',
    },
    border: '#1F1F1F',
    // DeeplyUs — deep crimson/infrared
    deep: {
      bg: { primary: '#1A0000', secondary: '#2A0505', surface: 'rgba(40,0,0,0.7)' },
      accent: { primary: '#E63946', secondary: '#8B0000', highlight: '#D4AF37' },
      gradient: { start: '#8B0000', end: '#E63946' },
      text: { primary: '#FFFFFF', secondary: '#D9A0A0', muted: '#8A5555', accent: '#E63946' },
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
    soft: '0 2px 8px rgba(0,0,0,0.5)',
    medium: '0 4px 16px rgba(0,0,0,0.6)',
    card: '0 8px 32px rgba(0,0,0,0.7)',
    brutalist: '4px 4px 0px #D4AF37',
    neonGlow: '0 0 20px rgba(212,175,55,0.3), 0 0 60px rgba(157,78,221,0.15)',
    deep: {
      soft: '0 4px 16px rgba(139,0,0,0.3)',
      glow: '0 0 24px rgba(230,57,70,0.5)',
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
