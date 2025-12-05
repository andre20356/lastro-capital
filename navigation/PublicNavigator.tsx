import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoanRequestScreen from "@/screens/LoanRequestScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type PublicStackParamList = {
  LoanRequest: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });

  return (
    <Stack.Navigator screenOptions={commonOptions}>
      <Stack.Screen
        name="LoanRequest"
        component={LoanRequestScreen}
        options={{
          title: "Solicitar Emprestimo",
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
