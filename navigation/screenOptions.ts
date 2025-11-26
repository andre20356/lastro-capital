import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

type ScreenOptionsParams = {
  theme: {
    backgroundRoot: string;
    backgroundDefault: string;
    text: string;
    primaryAccent: string;
  };
  isDark: boolean;
};

export function getCommonScreenOptions({
  theme,
  isDark,
}: ScreenOptionsParams): NativeStackNavigationOptions {
  return {
    headerStyle: {
      backgroundColor: theme.backgroundDefault,
    },
    headerTintColor: theme.text,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
    animation: "slide_from_right",
  };
}
