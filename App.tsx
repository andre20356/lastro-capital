import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainStackNavigator from "@/navigation/MainTabNavigator";
import { AuthNavigator } from "@/navigation/AuthNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

function RootNavigator() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return null;
  }

  return isSignedIn ? <MainStackNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
  <LanguageProvider>
    <ThemeProvider>
      <ErrorBoundary>
        <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <AuthProvider>
                  <DataProvider>
                    <NavigationContainer>
                      <RootNavigator />
                    </NavigationContainer>
                    <StatusBar style="dark" />
                  </DataProvider>
                </AuthProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
