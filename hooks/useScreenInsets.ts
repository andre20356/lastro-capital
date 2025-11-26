import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Spacing } from "@/constants/theme";

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = insets.bottom;
  }

  return {
    paddingTop: headerHeight + Spacing.xl,
    paddingBottom: tabBarHeight + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
    tabBarHeight,
    insets,
  };
}
