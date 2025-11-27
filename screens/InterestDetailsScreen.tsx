import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
  const { payments, charges, refreshData } = useData();

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

  // Calculate taxa de atraso total (delay fees from paid charges this month)
  const taxasAtraso = charges
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => {
      const dueDate = new Date(c.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const delayFee = daysOverdue > 0 && c.dailyDelayRate 
        ? c.dailyDelayRate * daysOverdue 
        : 0;
      return sum + delayFee;
    }, 0);

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
              Total Recebido:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: "#51CF66", fontWeight: "700" }]}>
              {formatCurrency(jurosRecebidos + taxasAtraso)}
            </ThemedText>
          </View>
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
});
