import React, { useCallback } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function InterestDetailsScreen() {
  const { theme } = useTheme();
  const { insets } = useScreenInsets();
  const { payments, charges, refreshData, getClientById } = useData();

  // Atualizar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      console.log("InterestDetailsScreen focus effect - recarregando dados");
      refreshData();
    }, [refreshData])
  );

  // Get current month and year
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Calculate juros recebidos (interest payments from this month)
  const jurosRecebidos = payments
    .filter((p) => {
      const paymentDate = new Date(p.paidAt);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        p.notes?.includes("interesse") ||
        p.notes?.includes("juros") ||
        p.notes?.includes("interest")
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate taxa de atraso total (delay fee payments from this month)
  const taxasAtraso = payments
    .filter((p) => {
      const paymentDate = new Date(p.paidAt);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        p.notes === "Pagamento de taxa de atraso"
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate quitações total (full charge settlements from this month)
  const quitacoes = payments
    .filter((p) => {
      const paymentDate = new Date(p.paidAt);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        (p.notes === "Quitação" || p.notes?.includes("Quitação"))
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Get all payments from this month with client info
  const monthPayments = payments
    .filter((p) => {
      const paymentDate = new Date(p.paidAt);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear &&
        (p.notes?.includes("juros") || p.notes === "Pagamento de taxa de atraso")
      );
    })
    .map((p) => {
      const isDelayFee = p.notes === "Pagamento de taxa de atraso";
      return {
        ...p,
        clientName: getClientById(p.clientId)?.name || "Cliente",
        day: new Date(p.paidAt).getDate(),
        paymentType: isDelayFee ? "Taxa de Atraso" : "Juros",
      };
    })
    .sort((a, b) => a.day - b.day);

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardsRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#51CF66" + "20" }]}>
              <ThemedText style={styles.iconText}>💰</ThemedText>
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Juros Recebidos
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#51CF66" }]}>
              {formatCurrency(jurosRecebidos)}
            </ThemedText>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FF922B" + "20" }]}>
              <ThemedText style={styles.iconText}>⚠️</ThemedText>
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Taxas de Atraso
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#FF922B" }]}>
              {formatCurrency(taxasAtraso)}
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
          ]}
        >
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
            Resumo do Mês
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Período:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.text }]}>
              {today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Juros:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: "#51CF66" }]}>
              {formatCurrency(jurosRecebidos)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Taxa de Atraso:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: "#FF922B" }]}>
              {formatCurrency(taxasAtraso)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Quitação:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: "#4C6EF5" }]}>
              {formatCurrency(quitacoes)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.secondaryText }]}>
              Total Recebido:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: "#51CF66", fontWeight: "700" }]}>
              {formatCurrency(jurosRecebidos + taxasAtraso + quitacoes)}
            </ThemedText>
          </View>
          
          {monthPayments.length > 0 ? (
            <>
              <View style={styles.divider} />
              <ThemedText style={[styles.paymentsTitle, { color: theme.text }]}>
                Pagamentos
              </ThemedText>
              {monthPayments.map((payment: any) => {
                const firstName = payment.clientName.split(" ")[0];
                const paymentDate = new Date(payment.paidAt);
                const formattedDate = paymentDate.toLocaleDateString("pt-BR");
                const isDelayFee = payment.paymentType === "Taxa de Atraso";
                const typeColor = isDelayFee ? "#FF922B" : "#51CF66";
                return (
                  <View key={payment.id} style={styles.paymentRow}>
                    <View style={styles.paymentInfo}>
                      <ThemedText style={[styles.paymentName, { color: theme.text }]}>
                        {firstName}
                      </ThemedText>
                      <View style={styles.paymentMeta}>
                        <ThemedText style={[styles.paymentDay, { color: theme.tertiaryText }]}>
                          {formattedDate}
                        </ThemedText>
                        <ThemedText style={[styles.paymentType, { color: typeColor }]}>
                          {payment.paymentType}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.paymentAmount, { color: typeColor }]}>
                      {formatCurrency(payment.amount)}
                    </ThemedText>
                  </View>
                );
              })}
            </>
          ) : null}
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cardsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: Spacing.md,
  },
  paymentsTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: "500",
  },
  paymentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: Spacing.sm,
  },
  paymentDay: {
    fontSize: 12,
    marginTop: 0,
  },
  paymentType: {
    fontSize: 11,
    fontWeight: "600",
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
});
