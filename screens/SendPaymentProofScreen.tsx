import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { paymentProofService } from "@/services/paymentProofService";

export default function SendPaymentProofScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) {
      formatted = "(" + numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += ") " + numbers.substring(2, 7);
    }
    if (numbers.length > 7) {
      formatted += "-" + numbers.substring(7, 11);
    }
    return formatted;
  };

  const formatCPF = (text: string) => {
    const numbers = text.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 3);
    }
    if (numbers.length > 3) {
      formatted += "." + numbers.substring(3, 6);
    }
    if (numbers.length > 6) {
      formatted += "." + numbers.substring(6, 9);
    }
    if (numbers.length > 9) {
      formatted += "-" + numbers.substring(9, 11);
    }
    return formatted;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setProofUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel selecionar a imagem");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, informe seu nome completo");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Erro", "Por favor, informe um telefone valido");
      return;
    }
    if (!proofUri) {
      Alert.alert("Erro", "Por favor, anexe o comprovante de pagamento");
      return;
    }

    setIsSubmitting(true);

    try {
      await paymentProofService.create({
        clientName: name.trim(),
        phone: phone.replace(/\D/g, ""),
        cpf: cpf.replace(/\D/g, "") || undefined,
        proofUrl: proofUri,
        notes: notes.trim() || undefined,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting proof:", error);
      Alert.alert(
        "Erro",
        "Nao foi possivel enviar o comprovante. Por favor, tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <ScreenKeyboardAwareScrollView contentContainerStyle={styles.successContent}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="check-circle" size={64} color={theme.success} />
          </View>
          <ThemedText style={styles.successTitle}>Comprovante Enviado!</ThemedText>
          <ThemedText style={[styles.successText, { color: theme.secondaryText }]}>
            Seu comprovante de pagamento foi recebido com sucesso.{"\n\n"}
            Aguarde a confirmacao do pagamento pelo administrador.
          </ThemedText>
          <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="info" size={20} color={theme.primaryAccent} />
            <ThemedText style={[styles.infoText, { color: theme.secondaryText }]}>
              Voce pode fechar esta pagina. Entraremos em contato se necessario.
            </ThemedText>
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Enviar Comprovante</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.secondaryText }]}>
            Envie o comprovante do seu pagamento via PIX
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              Nome Completo *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="Seu nome completo"
              placeholderTextColor={theme.tertiaryText}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              Telefone (WhatsApp) *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="(00) 00000-0000"
              placeholderTextColor={theme.tertiaryText}
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              CPF (opcional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="000.000.000-00"
              placeholderTextColor={theme.tertiaryText}
              value={cpf}
              onChangeText={(text) => setCpf(formatCPF(text))}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              Comprovante de Pagamento *
            </ThemedText>
            <Pressable
              style={[
                styles.proofButton,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
              ]}
              onPress={handlePickImage}
            >
              {proofUri ? (
                <Image source={{ uri: proofUri }} style={styles.proofImage} />
              ) : (
                <View style={styles.proofPlaceholder}>
                  <Feather name="image" size={40} color={theme.tertiaryText} />
                  <ThemedText style={[styles.proofText, { color: theme.tertiaryText }]}>
                    Toque para anexar comprovante
                  </ThemedText>
                </View>
              )}
            </Pressable>
            {proofUri ? (
              <Pressable onPress={() => setProofUri(null)}>
                <ThemedText style={[styles.removeProof, { color: theme.error }]}>
                  Remover comprovante
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              Observacoes (opcional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="Ex: Pagamento referente ao emprestimo de Marco..."
              placeholderTextColor={theme.tertiaryText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: isSubmitting ? theme.success + "80" : theme.success },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText style={styles.submitText}>Enviando...</ThemedText>
              </View>
            ) : (
              <>
                <Feather name="send" size={20} color="#fff" />
                <ThemedText style={styles.submitText}>Enviar Comprovante</ThemedText>
              </>
            )}
          </Pressable>
        </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  proofButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  proofPlaceholder: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  proofImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  proofText: {
    fontSize: 14,
    textAlign: "center",
  },
  removeProof: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
