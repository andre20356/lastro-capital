import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import LoginScreen from "@/screens/LoginScreen";
import DetailsScreen from "@/screens/DetailsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Spacing, BorderRadius } from "@/constants/theme";

export type Investment = {
  id: string;
  title: string;
  subtitle: string;
};

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Details: { item: Investment };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.loginButton,
        { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => navigation.navigate("Login")}
    >
      <ThemedText style={styles.loginButtonText}>Entrar</ThemedText>
    </Pressable>
  );
}

export default function RootStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Lastro Capital" />,
          headerRight: () => <LoginButton />,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerTitle: "Entrar",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerTitle: "Detalhes" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  loginButtonText: {
    fontWeight: "400",
  },
});
