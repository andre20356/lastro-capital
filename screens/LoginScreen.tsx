import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Image } from "react-native";
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
  const { signIn } = useAuth();

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
      console.log("Login error:", message);
      setErrorMessage(message);
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("@/assets/app-icon.png")}
              style={styles.logoImage}
            />
          </View>
          
          <ThemedText style={styles.title}>Lastro Capital</ThemedText>
          <ThemedText style={styles.subtitle}>Gestão de Empréstimos</ThemedText>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Feather name="mail" size={16} color={Colors.light.tint} />
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
              <Feather name="lock" size={16} color={Colors.light.tint} />
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
                  color={Colors.light.tint} 
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
          <Feather name="user-plus" size={18} color={Colors.light.tint} style={styles.buttonIcon} />
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
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 32,
    shadowColor: Colors.light.tint,
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
    borderColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "transparent",
    marginBottom: 32,
  },
  registerButtonText: {
    color: Colors.light.tint,
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
});
