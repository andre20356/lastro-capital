import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Alert, TextInput, ScrollView, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage, t } = useLanguage();
  const { signOut, user } = useAuth();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: "pt", name: "Português" },
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "zh", name: "中文" },
    { code: "ko", name: "한국어" },
    { code: "ja", name: "日本語" },
  ];

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

  const openEmail = async () => {
    try {
      await Linking.openURL("mailto:lastrocapitalsuporteaocliente@gmail.com");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o email");
    }
  };

  const openWhatsApp = async () => {
    try {
      // Numero de exemplo - altere para o número real
      const phoneNumber = "5511987654321";
      const message = "Olá, gostaria de suporte com o Lastro Capital";
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
    }
  };

  const handleLogout = async () => {
    console.log("handleLogout chamado - iniciando logout");
    try {
      console.log("Chamando signOut()...");
      await signOut();
      console.log("signOut() concluído com sucesso");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Não foi possível sair");
    }
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
          <ThemedText style={styles.profileName}>{t("minha-conta")}</ThemedText>
          <ThemedText style={[styles.profileEmail, { color: theme.secondaryText }]}>
            {t("gerencie-sua-conta")}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
              {t("informacoes-pessoais")}
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
              {t("nome")}
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
              <ThemedText style={styles.infoValue}>{userName || t("não-informado")}</ThemedText>
            )}
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              {t("email")}
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
              <ThemedText style={styles.infoValue}>{userEmail || t("não-informado")}</ThemedText>
            )}
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              {t("telefone")}
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
              <ThemedText style={styles.infoValue}>{userPhone || t("não-informado")}</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            {t("aparencia")}
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
              <ThemedText style={styles.menuLabel}>{t("tema")}</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Atual: {getCurrentThemeLabel()}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Feather name="globe" size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>{t("idioma")}</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                Atual: {languages.find((l) => l.code === language)?.name || language}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>
        </View>

        <Modal
          visible={showLanguagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t("selecione-idioma")}</ThemedText>
                <Pressable onPress={() => setShowLanguagePicker(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.languageList}>
                {languages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      language === lang.code && { backgroundColor: theme.primaryAccent + "20" },
                    ]}
                    onPress={async () => {
                      await setLanguage(lang.code);
                      setShowLanguagePicker(false);
                    }}
                  >
                    <ThemedText style={styles.languageOptionText}>{lang.name}</ThemedText>
                    {language === lang.code && (
                      <Feather name="check" size={20} color={theme.primaryAccent} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.secondaryText }]}>
            {t("ajuda-suporte")}
          </ThemedText>

          <View
            style={[
              styles.supportCard,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
            ]}
          >
            <ThemedText style={[styles.supportLabel, { color: theme.secondaryText }]}>
              {t("email-contato")}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={openEmail}
            >
              <Feather name="mail" size={18} color="#fff" />
              <ThemedText style={styles.contactButtonText}>lastrocapitalsuporteaocliente@gmail.com</ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.supportCard,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
            ]}
          >
            <ThemedText style={[styles.supportLabel, { color: theme.secondaryText }]}>
              {t("whatsapp")}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: "#25D366", opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={openWhatsApp}
            >
              <Feather name="message-circle" size={18} color="#fff" />
              <ThemedText style={styles.contactButtonText}>{t("fale-conosco")}</ThemedText>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => navigation.navigate("About")}
          >
            <Feather name="info" size={20} color={theme.primaryAccent} />
            <View style={styles.menuContent}>
              <ThemedText style={styles.menuLabel}>{t("sobre")}</ThemedText>
              <ThemedText style={[styles.menuDescription, { color: theme.tertiaryText }]}>
                {t("versao-informacoes")}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#fff" />
            <ThemedText style={styles.logoutButtonText}>Sair da Conta</ThemedText>
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
  supportCard: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  supportLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: BorderRadius.sm,
    width: "80%",
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  languageList: {
    maxHeight: "100%",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    backgroundColor: "#FF4757",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
