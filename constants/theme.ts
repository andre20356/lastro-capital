import { Platform } from "react-native";

const tintColorLight = "#f97316";
const tintColorDark = "#f97316";

export const Colors = {
  light: {
    text: "#11181C",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#06b6d4",
    backgroundRoot: "#0f172a",
    backgroundDefault: "#111827",
    backgroundSecondary: "#0b1220",
    backgroundTertiary: "#1f2937",
    cardBorder: "#1f2937",
    primaryAccent: "#f97316",
    secondaryAccent: "#06b6d4",
    secondaryText: "#cbd5e1",
    tertiaryText: "#9ca3af",
    buttonTextOnCyan: "#04252b",
    inputBackground: "#FFFFFF",
  },
  dark: {
    text: "#ECEDEE",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#06b6d4",
    backgroundRoot: "#0f172a",
    backgroundDefault: "#111827",
    backgroundSecondary: "#0b1220",
    backgroundTertiary: "#1f2937",
    cardBorder: "#1f2937",
    primaryAccent: "#f97316",
    secondaryAccent: "#06b6d4",
    secondaryText: "#cbd5e1",
    tertiaryText: "#9ca3af",
    buttonTextOnCyan: "#04252b",
    inputBackground: "#FFFFFF",
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
