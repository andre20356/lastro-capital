import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ScrollView, Platform, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loanRequestService } from "@/services/loanRequestService";
import { Feather } from "@expo/vector-icons";

export default function LoanRequestScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
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

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, informe seu nome completo");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Erro", "Por favor, informe um telefone valido");
      return;
    }
    if (!amount.trim()) {
      Alert.alert("Erro", "Por favor, informe o valor desejado");
      return;
    }

    const amountNum = parseFloat(amount.replace(/\D/g, "").replace(",", "."));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Erro", "Por favor, informe um valor valido");
      return;
    }

    setIsSubmitting(true);

    try {
      await loanRequestService.create({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        email: email.trim() || undefined,
        cpf: cpf.replace(/\D/g, "") || undefined,
        requestedAmount: amountNum,
        purpose: purpose.trim() || undefined,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      Alert.alert(
        "Erro",
        "Nao foi possivel enviar sua solicitacao. Por favor, tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="check-circle" size={64} color={theme.success} />
          </View>
          <ThemedText style={styles.successTitle}>Solicitacao Enviada!</ThemedText>
          <ThemedText style={[styles.successText, { color: theme.secondaryText }]}>
            Sua solicitacao de emprestimo foi recebida com sucesso.{"\n\n"}
            Entraremos em contato pelo WhatsApp em breve para dar continuidade ao processo.
          </ThemedText>
          <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="info" size={20} color={theme.primaryAccent} />
            <ThemedText style={[styles.infoText, { color: theme.secondaryText }]}>
              Fique atento ao seu WhatsApp! Voce recebera uma mensagem quando sua solicitacao for aprovada.
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText style={styles.title}>Solicitar Emprestimo</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.secondaryText }]}>
            Preencha o formulario abaixo para solicitar seu emprestimo
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
              Email (opcional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="seu@email.com"
              placeholderTextColor={theme.tertiaryText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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
              Valor Desejado (R$) *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="0,00"
              placeholderTextColor={theme.tertiaryText}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
              Finalidade do Emprestimo (opcional)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="Descreva para que voce precisa do emprestimo..."
              placeholderTextColor={theme.tertiaryText}
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <ThemedText style={styles.submitButtonText}>Enviar Solicitacao</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.tertiaryText }]}>
            Lastro Capital - Emprestimos
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl * 2,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: Spacing.xl * 2,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
