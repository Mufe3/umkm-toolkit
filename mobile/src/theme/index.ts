// Tema global aplikasi mobile — pengganti Tailwind CSS
// Semua warna, ukuran font, dan spacing terpusat di sini.

export const colors = {
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  primaryLight: '#eef2ff',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  info: '#0891b2',
  infoLight: '#cffafe',

  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  white: '#ffffff',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
}

// Skala tipografi diperbesar agar presisi di layar HP (revisi UI)
export const fonts = {
  h1: 28,
  h2: 22,
  h3: 19,
  body: 16,
  small: 14,
  tiny: 13, // sebelumnya 11 — terlalu kecil untuk dibaca di HP
}

export const weights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const
