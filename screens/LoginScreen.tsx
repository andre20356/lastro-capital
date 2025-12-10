import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Image, Modal } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/theme";
import { TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signIn, checkEmailExists, resetPassword } = useAuth();
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "password">("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = async () => {
    setErrorMessage("");
    
    if (!email || !password) {
      setErrorMessage("Preencha email e senha");
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      setErrorMessage(message);
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email);
    setResetStep("email");
    setNewPassword("");
    setConfirmPassword("");
    setShowResetModal(true);
  };

  const handleCheckEmail = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Erro", "Digite seu email");
      return;
    }

    try {
      setResetLoading(true);
      const exists = await checkEmailExists(resetEmail);
      if (exists) {
        setResetStep("password");
      } else {
        Alert.alert("Erro", "Email não encontrado. Verifique se digitou corretamente.");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao verificar email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert("Erro", "A senha deve ter pelo menos 4 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(resetEmail, newPassword);
      Alert.alert("Sucesso", "Senha redefinida com sucesso! Faça login com sua nova senha.");
      setShowResetModal(false);
      setEmail(resetEmail);
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao redefinir senha";
      Alert.alert("Erro", message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../assets/images/app-icon.png")}
              style={styles.logoImage}
            />
          </View>
          
          <ThemedText style={styles.title}>Lastro Capital</ThemedText>
          <ThemedText style={styles.subtitle}>Gestão de Empréstimos</ThemedText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Feather name="mail" size={16} color={Colors.light.tabIconSelected} />
              <ThemedText style={styles.label}>Email</ThemedText>
            </View>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
              placeholderTextColor="rgba(0,0,0,0.3)"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Feather name="lock" size={16} color={Colors.light.tabIconSelected} />
              <ThemedText style={styles.label}>Senha</ThemedText>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                placeholderTextColor="rgba(0,0,0,0.3)"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Feather 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={18} 
                  color={Colors.light.tabIconSelected} 
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Feather name="log-in" size={18} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.forgotPassword} onPress={openResetModal}>
            <ThemedText style={styles.forgotPasswordText}>Esqueci minha senha</ThemedText>
          </Pressable>

          {errorMessage !== "" && (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorMsg}>{errorMessage}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>OU</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <Pressable 
          style={styles.registerButton}
          onPress={() => navigation?.navigate("Register")}
        >
          <Feather name="user-plus" size={18} color={Colors.light.tabIconSelected} style={styles.buttonIcon} />
          <ThemedText style={styles.registerButtonText}>
            Criar Nova Conta
          </ThemedText>
        </Pressable>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Primeira vez? Crie sua conta para começar
          </ThemedText>
        </View>
      </ThemedView>

      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {resetStep === "email" ? "Recuperar Senha" : "Nova Senha"}
              </ThemedText>
              <Pressable onPress={() => setShowResetModal(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color="#666" />
              </Pressable>
            </View>

            {resetStep === "email" ? (
              <>
                <ThemedText style={styles.modalDescription}>
                  Digite o email cadastrado para redefinir sua senha
                </ThemedText>
                <View style={styles.modalInputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="mail" size={16} color={Colors.light.tabIconSelected} />
                    <ThemedText style={styles.label}>Email</ThemedText>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!resetLoading}
                    placeholderTextColor="rgba(0,0,0,0.3)"
                  />
                </View>
                <Pressable
                  style={[styles.modalButton, resetLoading && styles.buttonDisabled]}
                  onPress={handleCheckEmail}
                  disabled={resetLoading}
                >
                  <ThemedText style={styles.buttonText}>
                    {resetLoading ? "Verificando..." : "Continuar"}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <ThemedText style={styles.modalDescription}>
                  Crie uma nova senha para sua conta
                </ThemedText>
                <View style={styles.modalInputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="lock" size={16} color={Colors.light.tabIconSelected} />
                    <ThemedText style={styles.label}>Nova Senha</ThemedText>
                  </View>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      editable={!resetLoading}
                      placeholderTextColor="rgba(0,0,0,0.3)"
                    />
                    <Pressable 
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                    >
                      <Feather 
                        name={showNewPassword ? "eye" : "eye-off"} 
                        size={18} 
                        color={Colors.light.tabIconSelected} 
                      />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.modalInputGroup}>
                  <View style={styles.inputLabel}>
                    <Feather name="lock" size={16} color={Colors.light.tabIconSelected} />
                    <ThemedText style={styles.label}>Confirmar Senha</ThemedText>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirme a nova senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNewPassword}
                    editable={!resetLoading}
                    placeholderTextColor="rgba(0,0,0,0.3)"
                  />
                </View>
                <Pressable
                  style={[styles.modalButton, resetLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                >
                  <ThemedText style={styles.buttonText}>
                    {resetLoading ? "Redefinindo..." : "Redefinir Senha"}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.backButton}
                  onPress={() => setResetStep("email")}
                  disabled={resetLoading}
                >
                  <ThemedText style={styles.backButtonText}>Voltar</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 32,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    opacity: 0.4,
    fontWeight: "600",
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: Colors.light.tabIconSelected,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "transparent",
    marginBottom: 32,
  },
  registerButtonText: {
    color: Colors.light.tabIconSelected,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: "500",
    textAlign: "center",
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: "#FF6B6B",
    padding: 12,
    borderRadius: 8,
  },
  errorMsg: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: Colors.light.tabIconSelected,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: {
    color: Colors.light.tabIconSelected,
    fontSize: 14,
    fontWeight: "600",
  },
});
