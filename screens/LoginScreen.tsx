import React, { useState } from "react";
import { StyleSheet, TextInput, Pressable, Alert, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha");
      return;
    }
    Alert.alert("Sucesso", `Logado como ${email}`, [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <ThemedText type="h1" style={styles.title}>
          Entrar
        </ThemedText>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground }]}
          placeholder="E-mail"
          placeholderTextColor={theme.tertiaryText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground }]}
          placeholder="Senha"
          placeholderTextColor={theme.tertiaryText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.secondaryAccent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleLogin}
        >
          <ThemedText
            style={[styles.buttonText, { color: theme.buttonTextOnCyan }]}
          >
            Entrar
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.link,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={{ color: theme.link }}>Voltar</ThemedText>
        </Pressable>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    marginBottom: Spacing.xl,
  },
  input: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    marginTop: Spacing.md,
    fontSize: 16,
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
  link: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
});
