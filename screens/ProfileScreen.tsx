import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [name, email, phone] = await Promise.all([
        AsyncStorage.getItem("@user_name"),
        AsyncStorage.getItem("@user_email"),
        AsyncStorage.getItem("@user_phone"),
      ]);
      if (name) setUserName(name);
      if (email) setUserEmail(email);
      if (phone) setUserPhone(phone);
    } catch (error) {
      console.log("Error loading user data:", error);
    }
  };

  const saveUserData = async () => {
    try {
      if (!userName.trim()) {
        Alert.alert("Erro", "Digite seu nome");
        return;
      }

      await Promise.all([
        AsyncStorage.setItem("@user_name", userName.trim()),
        AsyncStorage.setItem("@user_email", userEmail.trim()),
        AsyncStorage.setItem("@user_phone", userPhone.trim()),
      ]);

      setIsEditing(false);
      Alert.alert("Sucesso", "Dados salvos com sucesso");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar os dados");
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    await setThemeMode(newMode);
  };

  const getCurrentThemeLabel = () => {
    if (themeMode === "light") return "Claro";
    if (themeMode === "dark") return "Escuro";
    return "Sistema";
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
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              Informações Pessoais
            </ThemedText>
            <Pressable
              onPress={() => {
                if (isEditing) {
                  saveUserData();
                } else {
                  setIsEditing(true);
                }
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Feather name={isEditing ? "check" : "edit"} size={18} color={theme.primaryAccent} />
            </Pressable>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Nome
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={userName}
                onChangeText={setUserName}
                placeholder="Digite seu nome"
                placeholderTextColor={theme.tertiaryText}
              />
            ) : (
              <ThemedText style={styles.infoValue}>{userName || "Não informado"}</ThemedText>
            )}
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Email
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="seu@email.com"
                placeholderTextColor={theme.tertiaryText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <ThemedText style={styles.infoValue}>{userEmail || "Não informado"}</ThemedText>
            )}
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Telefone
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={userPhone}
                onChangeText={setUserPhone}
                placeholder="(00) 00000-0000"
                placeholderTextColor={theme.tertiaryText}
                keyboardType="phone-pad"
              />
            ) : (
              <ThemedText style={styles.infoValue}>{userPhone || "Não informado"}</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            Aparência
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={toggleTheme}
          >
            <Feather name={themeMode === "light" ? "sun" : "moon"} size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>Tema</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Atual: {getCurrentThemeLabel()}
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
            onPress={() => Alert.alert("Ajuda", "Centro de ajuda em desenvolvimento")}
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
            onPress={() => Alert.alert("Sobre", "Lastro Capital v1.0.0\n\nAplicativo de gestão de cobranças")}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
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
