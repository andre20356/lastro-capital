import React from "react";
import { StyleSheet, View } from "react-native";
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

export default function CashReportScreen() {
  const { theme } = useTheme();
  const { insets } = useScreenInsets();
  const { charges, payments, refreshData } = useData();

  useFocusEffect(
    React.useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Total Emprestado (sum of all charges)
  const totalBorrowed = charges.reduce((sum, c) => sum + c.amount, 0);

  // Total em Caixa (sum of all payments received)
  const totalCash = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.cardsRow}>
          {/* Total Emprestado (Vermelho) */}
          <View
            style={[
              styles.reportCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FF6B6B" + "20" }]}>
              <Feather name="arrow-up-circle" size={24} color="#FF6B6B" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Total Emprestado
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#FF6B6B" }]}>
              {formatCurrency(totalBorrowed)}
            </ThemedText>
          </View>

          {/* Total em Caixa (Verde) */}
          <View
            style={[
              styles.reportCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#51CF66" + "20" }]}>
              <Feather name="arrow-down-circle" size={24} color="#51CF66" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Total em Caixa
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#51CF66" }]}>
              {formatCurrency(totalCash)}
            </ThemedText>
          </View>
        </View>

        {/* Saldo */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <ThemedText style={[styles.balanceLabel, { color: theme.secondaryText }]}>
            Saldo Líquido
          </ThemedText>
          <ThemedText style={[styles.balanceValue, { color: totalBorrowed - totalCash > 0 ? "#FF6B6B" : "#51CF66" }]}>
            {formatCurrency(totalBorrowed - totalCash)}
          </ThemedText>
          <ThemedText style={[styles.balanceDescription, { color: theme.tertiaryText }]}>
            {totalBorrowed - totalCash > 0
              ? "Ainda a receber"
              : totalBorrowed - totalCash < 0
              ? "Lucro acumulado"
              : "Equilibrado"}
          </ThemedText>
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
    padding: Spacing.lg,
  },
  cardsRow: {
    flexDirection: "column",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  reportCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  balanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
  balanceDescription: {
    fontSize: 12,
  },
});
