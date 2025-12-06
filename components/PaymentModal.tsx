import React, { useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PaymentMethod } from "@/types";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (options: {
    paymentMethod: PaymentMethod;
    paymentProof?: string;
    notes?: string;
  }) => void;
  title: string;
  amount: number;
  theme: any;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  title,
  amount,
  theme,
  isLoading = false,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (paymentMethod === "dinheiro" && !notes.trim()) {
      Alert.alert(
        "Especificacao Necessaria",
        "Para pagamento em dinheiro, e necessario adicionar uma especificacao.",
        [{ text: "OK" }]
      );
      return;
    }

    onConfirm({ paymentMethod, notes });
    resetForm();
  };

  const resetForm = () => {
    setPaymentMethod("pix");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText type="h3">{title}</ThemedText>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.amountContainer}>
            <ThemedText style={[styles.amountLabel, { color: theme.secondaryText }]}>
              Valor do Pagamento
            </ThemedText>
            <ThemedText style={[styles.amount, { color: theme.primaryAccent }]}>
              {formatCurrency(amount)}
            </ThemedText>
          </View>

          <ThemedText style={[styles.sectionLabel, { color: theme.secondaryText }]}>
            Metodo de Pagamento
          </ThemedText>
          <View style={styles.methodContainer}>
            <Pressable
              style={[
                styles.methodButton,
                { 
                  backgroundColor: paymentMethod === "pix" ? theme.primaryAccent + "20" : theme.backgroundSecondary,
                  borderColor: paymentMethod === "pix" ? theme.primaryAccent : theme.cardBorder,
                },
              ]}
              onPress={() => setPaymentMethod("pix")}
            >
              <Feather 
                name="smartphone" 
                size={20} 
                color={paymentMethod === "pix" ? theme.primaryAccent : theme.secondaryText} 
              />
              <ThemedText 
                style={[
                  styles.methodText, 
                  { color: paymentMethod === "pix" ? theme.primaryAccent : theme.text }
                ]}
              >
                PIX
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.methodButton,
                { 
                  backgroundColor: paymentMethod === "dinheiro" ? theme.success + "20" : theme.backgroundSecondary,
                  borderColor: paymentMethod === "dinheiro" ? theme.success : theme.cardBorder,
                },
              ]}
              onPress={() => setPaymentMethod("dinheiro")}
            >
              <Feather 
                name="dollar-sign" 
                size={20} 
                color={paymentMethod === "dinheiro" ? theme.success : theme.secondaryText} 
              />
              <ThemedText 
                style={[
                  styles.methodText, 
                  { color: paymentMethod === "dinheiro" ? theme.success : theme.text }
                ]}
              >
                Dinheiro
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.methodButton,
                { 
                  backgroundColor: paymentMethod === "outro" ? theme.warning + "20" : theme.backgroundSecondary,
                  borderColor: paymentMethod === "outro" ? theme.warning : theme.cardBorder,
                },
              ]}
              onPress={() => setPaymentMethod("outro")}
            >
              <Feather 
                name="credit-card" 
                size={20} 
                color={paymentMethod === "outro" ? theme.warning : theme.secondaryText} 
              />
              <ThemedText 
                style={[
                  styles.methodText, 
                  { color: paymentMethod === "outro" ? theme.warning : theme.text }
                ]}
              >
                Outro
              </ThemedText>
            </Pressable>
          </View>


          <View style={styles.notesSection}>
            <ThemedText style={[styles.sectionLabel, { color: theme.secondaryText }]}>
              {paymentMethod === "dinheiro" ? "Especificacao (obrigatorio)" : "Observacoes (opcional)"}
            </ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                { 
                  backgroundColor: theme.backgroundSecondary, 
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              placeholder={
                paymentMethod === "dinheiro" 
                  ? "Ex: Recebido em maos no escritorio" 
                  : "Adicione observacoes..."
              }
              placeholderTextColor={theme.tertiaryText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
              onPress={handleClose}
            >
              <ThemedText style={{ color: theme.secondaryText }}>Cancelar</ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton, 
                { backgroundColor: isLoading ? theme.primaryAccent + "80" : theme.primaryAccent }
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <ThemedText style={styles.confirmText}>Salvando...</ThemedText>
                </View>
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <ThemedText style={styles.confirmText}>Confirmar</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  methodContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  methodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
