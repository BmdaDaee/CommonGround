// CommonGround Theme - Pastel Pulse + Gemstone Pulse
export const theme = {
  // === SHARED SPACE (CommonGround) - Pastel Pulse ===
  colors: {
    bg: {
      primary: '#FFF4EC',
      secondary: '#FDE7EF',
      surface: '#FFFFFF',
      depth: '#6E4A7E',
    },
    accent: {
      primary: '#FF6FAE',
      secondary: '#C9A7FF',
      highlight: '#A8F5D5',
    },
    gradient: {
      emotional: {
        start: '#FFB7D5',
        end: '#C7B7FF',
      },
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#4A4A4A',
      muted: '#7A7A7A',
      accent: '#FF6FAE',
    },
    // === INTIMATE SPACE (DeeplyUs) - Gemstone Pulse ===
    deep: {
      bg: {
        primary: '#2A1B3D',
        secondary: '#3B1E5A',
        surface: '#0D0A0F',
      },
      accent: {
        primary: '#FF8FAF',
        secondary: '#4A6CFF',
        highlight: '#F5C76B',
      },
      gradient: {
        start: '#3B1E5A',
        end: '#FF6F8F',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#D9D9D9',
        muted: '#A1A1A1',
        accent: '#FF8FAF',
      },
    },
    // AXM Brand
    axm: {
      black: '#040403',
      red: '#E2130D',
      violet: '#6F42C1',
      platinum: '#EDEDED',
    },
  },
  
  // === TYPOGRAPHY ===
  typography: {
    fontFamily: {
      primary: "'Source Sans 3', 'Segoe UI', sans-serif",
      expressive: "'Source Sans 3', 'Segoe UI', sans-serif",
    },
    size: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      display: '32px',
      hero: '40px',
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.3,
      relaxed: 1.5,
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // === SPACING ===
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  
  // === RADIUS ===
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    round: '999px',
  },
  
  // === SHADOWS ===
  shadow: {
    soft: '0 2px 6px rgba(0,0,0,0.08)',
    medium: '0 4px 12px rgba(0,0,0,0.12)',
    card: '0 6px 20px rgba(0,0,0,0.10)',
    deep: {
      soft: '0 2px 6px rgba(0,0,0,0.25)',
      glow: '0 0 12px rgba(255,143,175,0.35)',
    },
  },
  
  // === MOTION ===
  motion: {
    duration: {
      fast: '120ms',
      normal: '180ms',
      slow: '250ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      emotional: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  },
};

// Helper to get deep theme colors
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
