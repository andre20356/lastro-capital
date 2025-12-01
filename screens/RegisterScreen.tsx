import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/theme";
import { TextInput } from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Criar Conta</ThemedText>
          <ThemedText style={styles.subtitle}>Registre-se no Lastro Capital</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          <ThemedText style={styles.label}>Senha</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Crie uma senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <ThemedText style={styles.label}>Confirmar Senha</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.hint}>Você será redirecionado para o app após registrar-se</ThemedText>
        </View>
      </ThemedView>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
  },
  hint: {
    fontSize: 12,
    opacity: 0.5,
  },
});
