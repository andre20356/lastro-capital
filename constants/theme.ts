import { Platform } from "react-native";

const tintColorLight = "#0d9488";
const tintColorDark = "#14b8a6";

export const Colors = {
  light: {
    text: "#1f2937",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9ca3af",
    tabIconSelected: tintColorLight,
    link: "#0d9488",
    backgroundRoot: "#f8fafc",
    backgroundDefault: "#ffffff",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",
    cardBorder: "#e2e8f0",
    primaryAccent: "#0d9488",
    secondaryAccent: "#0891b2",
    secondaryText: "#64748b",
    tertiaryText: "#94a3b8",
    buttonTextOnPrimary: "#ffffff",
    inputBackground: "#ffffff",
    inputBorder: "#d1d5db",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    pending: "#f59e0b",
    paid: "#10b981",
    overdue: "#ef4444",
  },
  dark: {
    text: "#f1f5f9",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748b",
    tabIconSelected: tintColorDark,
    link: "#14b8a6",
    backgroundRoot: "#0f172a",
    backgroundDefault: "#1e293b",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    cardBorder: "#475569",
    primaryAccent: "#14b8a6",
    secondaryAccent: "#06b6d4",
    secondaryText: "#94a3b8",
    tertiaryText: "#64748b",
    buttonTextOnPrimary: "#ffffff",
    inputBackground: "#1e293b",
    inputBorder: "#475569",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    pending: "#f59e0b",
    paid: "#10b981",
    overdue: "#ef4444",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
