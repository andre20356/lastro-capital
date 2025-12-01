import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/theme";
import { TextInput } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Lastro Capital</ThemedText>
          <ThemedText style={styles.subtitle}>Faça seu login</ThemedText>
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
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Não tem conta? Crie uma!</ThemedText>
          <ThemedText style={styles.hint}>Use a opção de registrar-se</ThemedText>
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
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    opacity: 0.5,
  },
});
