/**
 * NotrailNote Theme Specification
 * ================================
 * このファイルはプロジェクト作成時に src/theme/index.ts へコピーして使用します。
 * HTMLモックアップから抽出したデザイントークンを定義しています。
 *
 * 使用方法:
 * import { theme } from '@/theme';
 * backgroundColor: theme.colors.primary
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Primary Brand Color
  primary: '#137fec',
  primaryLight: '#137fec15', // 8% opacity for backgrounds
  primaryHover: '#0e6bc9',

  // Backgrounds
  background: {
    light: '#f6f7f8',
    dark: '#101922',
  },

  // Surfaces (Cards, Modals, Inputs)
  surface: {
    light: '#FFFFFF',
    dark: '#1a2332',
  },

  // Text Colors
  text: {
    primary: '#111418',
    secondary: '#617589',
    muted: '#4e5e6e',
    inverse: '#FFFFFF',
    // Dark mode variants
    primaryDark: '#FFFFFF',
    secondaryDark: '#9ca3af',
    mutedDark: '#6b7280',
  },

  // Borders
  border: {
    light: '#E5E5EA',
    medium: '#d1d5db',
    dark: '#374151',
  },

  // Semantic Colors
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  error: '#ef4444',
  errorLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',

  // Diff Colors
  diff: {
    addedBg: '#ecfdf5',
    addedBorder: '#10b981',
    addedText: '#065f46',
    removedBg: '#fef2f2',
    removedBorder: '#ef4444',
    removedText: '#991b1b',
  },

  // Sync Status Colors
  sync: {
    synced: '#10b981',      // Green - cloud_done
    pending: '#f59e0b',     // Orange - sync (spinning)
    local: '#9ca3af',       // Gray - cloud_off
    error: '#ef4444',       // Red - error
  },

  // Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: 'Inter',
    sansJP: 'Noto Sans JP',
    mono: 'SF Mono',
    system: 'system-ui',
  },

  // Font Sizes (in px, convert to RN units as needed)
  fontSize: {
    micro: 10,
    xs: 11,
    sm: 12,
    caption: 13,
    body2: 14,
    body: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.6,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.02,
    tight: -0.015,
    normal: 0,
    wide: 0.015,
    wider: 0.05,
    widest: 0.1,
  },

  // Preset Text Styles
  presets: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    h2: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 1.3,
      letterSpacing: -0.015,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.4,
      letterSpacing: -0.01,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    small: {
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      letterSpacing: 0.015,
    },
    micro: {
      fontSize: 10,
      fontWeight: '700' as const,
      lineHeight: 1.2,
      letterSpacing: 0.05,
    },
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,    // xs
  1.5: 6,
  2: 8,    // sm
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,   // md (default)
  5: 20,
  6: 24,   // lg
  7: 28,
  8: 32,   // xl
  9: 36,
  10: 40,
  11: 44,
  12: 48,  // 2xl
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// Semantic spacing aliases
export const semanticSpacing = {
  screenPadding: spacing[4],    // 16px
  cardPadding: spacing[4],      // 16px
  sectionGap: spacing[6],       // 24px
  itemGap: spacing[3],          // 12px
  iconGap: spacing[2],          // 8px
  inlineGap: spacing[1],        // 4px
  tabBarHeight: 83,             // 49px + 34px safe area
  headerHeight: 56,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  default: 8,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
  // iOS App Icon style (squircle approximation)
  squircle: '22.5%',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  // Primary color shadow for buttons
  primary: {
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// =============================================================================
// ICONS
// =============================================================================

export const icons = {
  strokeWidth: 1.5,  // 細線ミニマルデザイン
  size: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const;

// =============================================================================
// MAIN THEME EXPORT
// =============================================================================

// Direct exports for convenience
export const fontFamily = typography.fontFamily;
export const fontSize = typography.fontSize;
export const fontWeight = typography.fontWeight;

export const theme = {
  colors,
  typography,
  spacing,
  semanticSpacing,
  borderRadius,
  shadows,
  icons,
  animations,
  zIndex,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;

export default theme;
