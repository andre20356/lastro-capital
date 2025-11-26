import { Colors } from "@/constants/theme";
import { useColorScheme as useSystemColorScheme } from "@/hooks/useColorScheme";
import { useThemeContext } from "@/contexts/ThemeContext";

export function useTheme() {
  const systemColorScheme = useSystemColorScheme();
  const { themeMode } = useThemeContext();

  let colorScheme = systemColorScheme;
  if (themeMode === "light") {
    colorScheme = "light";
  } else if (themeMode === "dark") {
    colorScheme = "dark";
  }

  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme ?? "light"];

  return {
    theme,
    isDark,
  };
}
