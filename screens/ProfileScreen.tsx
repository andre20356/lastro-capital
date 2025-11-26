import React from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { theme } = useTheme();

  const handleAccountSettings = () => {
    Alert.alert("Configurações", "Funcionalidade em desenvolvimento");
  };

  const handleSubscription = () => {
    Alert.alert("Assinatura", "Planos de assinatura em breve");
  };

  const handleHelp = () => {
    Alert.alert("Ajuda", "Centro de ajuda em desenvolvimento");
  };

  const handleAbout = () => {
    Alert.alert("Sobre", "Lastro Capital v1.0.0\n\nAplicativo de gestão de cobranças");
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.profileCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <View
            style={[
              styles.profileIcon,
              { backgroundColor: theme.primaryAccent + "20" },
            ]}
          >
            <Feather name="user" size={40} color={theme.primaryAccent} />
          </View>
          <ThemedText style={styles.profileName}>Minha Conta</ThemedText>
          <ThemedText style={[styles.profileEmail, { color: theme.secondaryText }]}>
            Gerencie sua conta e dados
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            Conta
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleAccountSettings}
          >
            <Feather name="settings" size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Configurações da Conta</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Perfil, senha e preferências
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleSubscription}
          >
            <Feather name="credit-card" size={20} color={theme.warning} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Assinatura</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Planos e faturamento
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            Suporte
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleHelp}
          >
            <Feather name="help-circle" size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Ajuda e Suporte</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Dúvidas e problemas
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleAbout}
          >
            <Feather name="info" size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Sobre</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Versão e informações
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  profileCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  menuDescription: {
    fontSize: 12,
  },
});
