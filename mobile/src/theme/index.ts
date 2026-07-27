// Ported from docs/crushai-design-system.html design tokens (:root CSS variables)
export const colors = {
  bg1: "#100A1E",
  bg2: "#2B1B42",
  bg3: "#1A1030",

  gold: "#E8C27A",
  peach: "#FFB088",
  accent1: "#FF9A5C",
  accent2: "#FF6F91",

  purple500: "#8A6CFF",
  purple400: "#A98CFF",
  purpleGlow: "rgba(140,108,255,0.55)",
  purpleGlowSoft: "rgba(140,108,255,0.28)",

  textPrimary: "#F6F1EA",
  textSecondary: "#BDB3CE",
  textMuted: "#7E749A",

  glassLight: "rgba(255,255,255,0.07)",
  glassLightBorder: "rgba(255,255,255,0.45)",
  glassDark: "rgba(30,20,50,0.50)",
  glassDarkBorder: "rgba(154,124,255,0.35)",

  // solid fallback for the primary button gradient (#F0A878 -> #E8768F)
  btnPrimaryFrom: "#F0A878",
  btnPrimaryTo: "#E8768F",
  btnPrimaryText: "#3B160E",

  danger: "#FF9A9A",
};

export const radii = {
  lg: 22,
  md: 16,
  pill: 999,
};

// Loaded via useFonts() in RootApp.tsx (@expo-google-fonts/playfair-display, @expo-google-fonts/inter)
export const fonts = {
  displayItalic: "PlayfairDisplay_700Bold_Italic",
  displayItalicSemi: "PlayfairDisplay_600SemiBold_Italic",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};
