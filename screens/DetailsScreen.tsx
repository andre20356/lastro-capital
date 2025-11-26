import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type DetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Details">;
  route: RouteProp<RootStackParamList, "Details">;
};

export default function DetailsScreen({ navigation, route }: DetailsScreenProps) {
  const { theme } = useTheme();
  const { item } = route.params;

  if (!item) {
    return (
      <ScreenScrollView contentContainerStyle={styles.container}>
        <ThemedText type="h1">Nenhum item selecionado</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.secondaryAccent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText
            style={[styles.buttonText, { color: theme.buttonTextOnCyan }]}
          >
            Voltar
          </ThemedText>
        </Pressable>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <ThemedText type="h1">{item.title}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.secondaryText }]}>
        {item.subtitle}
      </ThemedText>

      <ThemedText type="h2" style={styles.sectionTitle}>
        Descrição
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.secondaryText }]}>
        Este é um texto de demonstração. Substitua pela descrição real do investimento.
      </ThemedText>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.secondaryAccent, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.goBack()}
      >
        <ThemedText
          style={[styles.buttonText, { color: theme.buttonTextOnCyan }]}
        >
          Voltar
        </ThemedText>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    marginTop: Spacing.xl,
  },
  description: {
    marginTop: Spacing.sm,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  buttonText: {
    fontWeight: "700",
  },
});
