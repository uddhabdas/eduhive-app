export const colors = {
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    brand: '#10B981',
    primary: '#10B981',
    brandAlt: '#14B8A6',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    onBrand: '#FFFFFF',
    onPrimary: '#FFFFFF',
  },
  dark: {
    background: '#0B1020',
    surface: '#111827',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#1F2937',
    brand: '#10B981',
    primary: '#10B981',
    brandAlt: '#14B8A6',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    onBrand: '#FFFFFF',
    onPrimary: '#FFFFFF',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  variants: {
    caption: 'xs',
    body: 'base',
    sectionTitle: 'lg',
    pageTitle: 'xl',
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const themeTokens = { colors, spacing, radii, typography, shadows };