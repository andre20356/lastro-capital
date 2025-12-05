import React, { useEffect, useState } from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

import MainStackNavigator from "@/navigation/MainTabNavigator";
import { AuthNavigator } from "@/navigation/AuthNavigator";
import { PublicNavigator } from "@/navigation/PublicNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

function RootNavigator() {
  const { isLoading, isSignedIn } = useAuth();
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    const checkPublicRoute = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          const isLoanRequest = url.includes("solicitar") || url.includes("LoanRequest") || url.includes("loan-request");
          setIsPublicRoute(isLoanRequest);
        }
        if (Platform.OS === "web") {
          const path = window.location.pathname;
          if (path.includes("solicitar") || path.includes("loan")) {
            setIsPublicRoute(true);
          }
        }
      } catch (e) {
        console.log("Error checking URL:", e);
      }
    };
    checkPublicRoute();
  }, []);

  if (isLoading) {
    return null;
  }

  if (isPublicRoute) {
    return <PublicNavigator />;
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
