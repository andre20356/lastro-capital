import React, { useEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { FinanceChart } from "@/components/FinanceChart";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight, insets } = useScreenInsets();
  
  const {
    getPendingTotal,
    getPaidTotal,
    getInterestPaidThisMonth,
    getOverdueCharges,
    getUpcomingCharges,
    getClientById,
    charges,
    payments,
    clients,
    refreshData,
  } = useData();

  // Refrescar dados quando a tela entra em foco (volta de outras telas)
  useFocusEffect(
    React.useCallback(() => {
      console.log("Dashboard focus effect - recarregando dados");
      refreshData();
    }, [refreshData])
  );

  const pendingTotal = getPendingTotal();
  const paidTotal = getPaidTotal();
  const interestPaidThisMonth = getInterestPaidThisMonth();
  const overdueCharges = getOverdueCharges();
  const upcomingCharges = getUpcomingCharges(7);

  // Chart statistics calculations
  const totalBorrowed = charges.reduce((sum, c) => sum + c.amount, 0);
  
  // Total Earned = sum of all payments (includes monthly interest payments + full charge payments)
  const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Soma total dos juros vencidos (para a bolha "Pendente")
  // Apenas charges com status "overdue" (1+ dias de atraso)
  const totalOverdueInterest = overdueCharges
    .filter(c => c.status === "overdue")
    .reduce((sum, c) => sum + (c.accumulatedInterest || 0), 0);
  
  // Count active clients (those with at least one charge)
  const activeClientsSet = new Set(charges.map(c => c.clientId));
  const activeClientsCount = activeClientsSet.size;

  // Calculate total interest to receive (sum of all accumulated interest from all charges)
  const totalInterestToReceiveMonth = charges
    .reduce((sum, c) => sum + (c.accumulatedInterest || 0), 0);
  
  console.log("Dashboard - Total Interest to Receive:", {
    chargesCount: charges.length,
    pendingCharges: charges.filter(c => c.status === "pending" || c.status === "overdue").length,
    totalInterestToReceiveMonth,
    charges: charges.map(c => ({ 
      id: c.id, 
      accumulatedInterest: c.accumulatedInterest, 
      loanPercentage: c.loanPercentage,
      amount: c.amount,
      status: c.status 
    }))
  });

  // Generate chart data - using actual data instead of random
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const dateForChart = new Date(today);
    dateForChart.setMonth(dateForChart.getMonth() - (5 - i));
    return {
      label: dateForChart.toLocaleDateString("pt-BR", { month: "short" }),
      borrowed: totalBorrowed,
      earned: totalEarned,
      overdue: totalOverdueInterest,
    };
  });

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
            <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="clock" size={20} color={theme.warning} />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Pendente
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: theme.warning }]}>
              {formatCurrency(totalOverdueInterest)}
            </ThemedText>
          </View>

          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={() => navigation.navigate("CashReport")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FF6B6B" + "20" }]}>
              <Feather name="check-circle" size={20} color="#FF6B6B" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Total Emprestado
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#FF6B6B" }]}>
              {formatCurrency(totalBorrowed)}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.cardsRow}>
          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={() => navigation.navigate("Clients")}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryAccent + "20" }]}>
              <Feather name="users" size={20} color={theme.primaryAccent} />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Clientes Ativos
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: theme.primaryAccent }]}>
              {activeClientsCount}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={() => navigation.navigate("InterestDetails")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FFB400" + "20" }]}>
              <Feather name="percent" size={20} color="#FFB400" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Juros a Receber
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#FFB400" }]}>
              {formatCurrency(totalInterestToReceiveMonth)}
            </ThemedText>
          </Pressable>
        </View>

        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <ThemedText type="h3" style={styles.chartTitle}>
            Analise Financeira
          </ThemedText>
          <FinanceChart data={chartData} theme={theme} />
          <View style={styles.chartStats}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: theme.tertiaryText }]}>
                Total Emprestado
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: "#FF6B6B" }]}>
                {formatCurrency(totalBorrowed)}
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: theme.tertiaryText }]}>
                Total Rendimentos
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: "#51CF66" }]}>
                {formatCurrency(totalEarned)}
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: theme.tertiaryText }]}>
                Negativados
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: "#FF922B" }]}>
                {formatCurrency(totalOverdueInterest)}
              </ThemedText>
            </View>
          </View>
        </View>

        {overdueCharges.length > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.alertCard,
              { backgroundColor: theme.error + "15", borderColor: theme.error + "30", opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => navigation.navigate("MainTabs", { screen: "Charges" })}
          >
            <Feather name="alert-circle" size={24} color={theme.error} />
            <View style={styles.alertContent}>
              <ThemedText style={[styles.alertTitle, { color: theme.error }]}>
                {overdueCharges.length} cobrança(s) vencida(s)
              </ThemedText>
              <ThemedText style={[styles.alertSubtitle, { color: theme.secondaryText }]}>
                Toque para ver detalhes
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.error} />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Proximos Vencimentos
          </ThemedText>
          
          {upcomingCharges.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="calendar" size={32} color={theme.tertiaryText} />
              <ThemedText style={[styles.emptyText, { color: theme.tertiaryText }]}>
                Nenhuma cobrança nos proximos 7 dias
              </ThemedText>
            </View>
          ) : (
            upcomingCharges.map((charge) => {
              const client = getClientById(charge.clientId);
              const monthlyInterest = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
              
              // Calculate delay fee if overdue
              const dueDate = new Date(charge.dueDate);
              const today = new Date();
              const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              const delayFee = daysOverdue > 0 && charge.dailyDelayRate 
                ? charge.dailyDelayRate * daysOverdue 
                : 0;
              
              return (
                <Pressable
                  key={charge.id}
                  style={({ pressed }) => [
                    styles.chargeItem,
                    { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => navigation.navigate("ChargeDetail", { chargeId: charge.id })}
                >
                  <View style={styles.chargeInfo}>
                    <ThemedText style={styles.clientName}>
                      {client?.name || "Cliente removido"}
                    </ThemedText>
                    <ThemedText style={[styles.dueDate, { color: theme.secondaryText }]}>
                      Vence em {formatDate(charge.dueDate)}
                    </ThemedText>
                    {monthlyInterest > 0 ? (
                      <ThemedText style={[styles.interestValue, { color: "#FFB400" }]}>
                        Juros: {formatCurrency(monthlyInterest)}
                      </ThemedText>
                    ) : null}
                    {delayFee > 0 ? (
                      <ThemedText style={[styles.delayFeeValue, { color: theme.error }]}>
                        Taxa Atraso: {formatCurrency(delayFee)}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText style={[styles.amount, { color: theme.primaryAccent }]}>
                    {formatCurrency(charge.amount)}
                  </ThemedText>
                </Pressable>
              );
            })
          )}
        </View>
      </ScreenScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primaryAccent,
            bottom: tabBarHeight + Spacing.lg,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={() => navigation.navigate("ChargeForm", {})}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
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
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  alertSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  chargeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  chargeInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dueDate: {
    fontSize: 13,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  chartCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.md,
    fontSize: 18,
  },
  chartStats: {
    flexDirection: "row",
    marginTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
});
