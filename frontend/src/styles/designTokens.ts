// Design tokens extracted from Figma
// Update these values to match the Figma design exactly

export const designTokens = {
  colors: {
    // Primary colors - Update from Figma
    primary: '#4F46E5', // Indigo - update from Figma
    primaryHover: '#4338CA',
    primaryLight: '#818CF8',
    
    // Secondary colors
    secondary: '#6B7280', // Gray
    secondaryHover: '#4B5563',
    
    // Status colors
    success: '#10B981', // Green
    danger: '#EF4444', // Red
    warning: '#F59E0B', // Amber
    info: '#3B82F6', // Blue
    
    // Background colors
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceElevated: '#FFFFFF',
    
    // Text colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      // Add custom fonts from Figma if specified
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Helper function to get CSS variable value
export const getCSSVariable = (path: string): string => {
  // This will be used to map design tokens to CSS variables
  return `var(--${path.replace(/\./g, '-')})`;
};

