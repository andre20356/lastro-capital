import React, { useEffect, useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Pressable, Share, Alert, Platform, InteractionManager } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/hooks/useLanguage";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { FinanceChart } from "@/components/FinanceChart";
import { useWhatsApp } from "@/hooks/useWhatsApp";

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
  const { t } = useLanguage();
  const { tabBarHeight, insets } = useScreenInsets();
  const { sendPaymentReminder } = useWhatsApp();
  
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
  const upcomingCharges = getUpcomingCharges(31);
  
  const allChargesForDisplay = useMemo(() => {
    return charges
      .filter((c: any) => c.status !== "paid")
      .sort((a: any, b: any) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [charges]);

  // Chart statistics calculations
  // Total Borrowed = apenas charges NÃO-PAGAS (pending + overdue)
  const totalBorrowed = charges
    .filter((c: any) => c.status !== "paid")
    .reduce((sum: number, c: any) => sum + c.amount, 0);
  
  // Total Earned = sum of all payments (includes monthly interest payments + full charge payments)
  const totalEarned = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  
  // Soma total das TAXAS DE ATRASO de todos os clientes (para "Taxas de Atraso")
  // Calcula: dailyDelayRate * dias de atraso para cada charge atrasada
  const totalDelayFees = charges
    .filter((c: any) => c.status !== "paid")
    .reduce((sum: number, c: any) => {
      const todayCalc = new Date();
      todayCalc.setHours(0, 0, 0, 0);
      
      const referenceDate = c.nextInterestDueDate ? new Date(c.nextInterestDueDate) : new Date(c.dueDate);
      referenceDate.setHours(0, 0, 0, 0);
      
      const daysOverdue = Math.floor((todayCalc.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        // Se tem dailyDelayRate definido, usa ele
        if (c.dailyDelayRate && c.dailyDelayRate > 0) {
          return sum + (c.dailyDelayRate * daysOverdue);
        }
      }
      return sum;
    }, 0);
  
  console.log("Dashboard - Total Delay Fees:", { totalDelayFees, chargesWithRate: charges.filter((c: any) => c.dailyDelayRate && c.dailyDelayRate > 0).length });
  
  // Count clients with overdue charges (status visual = overdue, não apenas BD)
  const overdueClientsSet = new Set(
    charges
      .filter((c: any) => {
        if (c.status === "paid") return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const referenceDate = c.nextInterestDueDate ? new Date(c.nextInterestDueDate) : new Date(c.dueDate);
        referenceDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysOverdue >= 1; // Apenas charges com 1+ dias de atraso
      })
      .map((c: any) => c.clientId)
  );
  const overdueClientsCount = overdueClientsSet.size;
  
  const activeClientsSet = new Set(charges.map((c: any) => c.clientId));
  const activeClientsCount = activeClientsSet.size;

  const handleShareLoanRequestLink = useCallback(async () => {
    const webFormUrl = "https://andre20356.github.io/lastrocapital-privacidade/solicitar.html";
    const message = `Solicite seu emprestimo na Lastro Capital!\n\nAcesse o link abaixo para preencher sua solicitacao:\n${webFormUrl}`;
    
    const performShare = async () => {
      try {
        if (Platform.OS === "web") {
          await Clipboard.setStringAsync(message);
          Alert.alert("Link Copiado", "O link foi copiado para a area de transferencia!");
          return;
        }
        
        const result = await Share.share(
          { message },
          Platform.OS === "android" ? { dialogTitle: "Compartilhar Link - Lastro Capital" } : {}
        );
        
        if (result.action === Share.dismissedAction) {
          return;
        }
      } catch (error) {
        console.log("Share error:", error);
        try {
          await Clipboard.setStringAsync(message);
          Alert.alert(
            "Link Copiado",
            "Nao foi possivel abrir o compartilhamento, mas o link foi copiado para a area de transferencia!"
          );
        } catch (clipError) {
          Alert.alert("Erro", "Nao foi possivel compartilhar o link. Tente novamente.");
        }
      }
    };
    
    InteractionManager.runAfterInteractions(() => {
      performShare();
    });
  }, []);

  const totalInterestToReceiveMonth = useMemo(() => {
    const todayCalc = new Date();
    return charges
      .filter((c: any) => c.status !== "paid")
      .reduce((sum: number, c: any) => {
        const rate = (c.loanPercentage || 0) / 100;
        const principal = c.amount || 0;
        
        // Juros fixos do mês (baseado no valor solicitado)
        const monthlyInterest = principal * rate;
        
        // Juros que já acumularam por atraso (se houver)
        const accumulated = c.accumulatedInterest || 0;
        
        // Taxa de atraso diária acumulada (se houver atraso)
        const dueDate = new Date(c.dueDate);
        const daysOverdue = Math.floor((todayCalc.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const delayFee = daysOverdue > 0 && c.dailyDelayRate 
          ? c.dailyDelayRate * daysOverdue 
          : 0;
        
        return sum + monthlyInterest + accumulated + delayFee;
      }, 0);
  }, [charges]);
  
  console.log("Dashboard - Total Interest to Receive:", {
    chargesCount: charges.length,
    pendingCharges: charges.filter((c: any) => c.status === "pending" || c.status === "overdue").length,
    totalInterestToReceiveMonth,
    charges: charges.map((c: any) => ({ 
      id: c.id, 
      accumulatedInterest: c.accumulatedInterest, 
      loanPercentage: c.loanPercentage,
      amount: c.amount,
      status: c.status 
    }))
  });

  // Generate chart data - using actual data instead of random
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const dateForChart = new Date();
    dateForChart.setMonth(dateForChart.getMonth() - (5 - i));
    return {
      label: dateForChart.toLocaleDateString("pt-BR", { month: "short" }),
      borrowed: totalBorrowed,
      earned: totalEarned,
      overdue: totalDelayFees,
    };
  });

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardsRow}>
          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={() => navigation.navigate("MainTabs", { screen: "Charges" })}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="clock" size={20} color={theme.warning} />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Pendente
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: theme.warning }]}>
              {overdueClientsCount}
            </ThemedText>
          </Pressable>

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
            onPress={() => navigation.navigate("MainTabs", { screen: "Clients" })}
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

        <View style={styles.cardsRow}>
          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={() => navigation.navigate("PendingRequests")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#9775FA" + "20" }]}>
              <Feather name="inbox" size={20} color="#9775FA" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Solicitacoes
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#9775FA" }]}>
              Ver
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
            onPress={handleShareLoanRequestLink}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#20C997" + "20" }]}>
              <Feather name="share-2" size={20} color="#20C997" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Compartilhar Link
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: "#20C997" }]}>
              Enviar
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
                Taxas de Atraso
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: "#FF922B" }]}>
                {formatCurrency(totalDelayFees)}
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
          
          {allChargesForDisplay.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="calendar" size={32} color={theme.tertiaryText} />
              <ThemedText style={[styles.emptyText, { color: theme.tertiaryText }]}>
                Nenhuma cobrança pendente
              </ThemedText>
            </View>
          ) : (
            allChargesForDisplay.map((charge: any) => {
              const client = getClientById(charge.clientId);
              const monthlyInterest = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
              
              const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              referenceDate.setHours(0, 0, 0, 0);
              const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysOverdue >= 1;
              
              const billingType = charge.billingType || "monthly";
              let periods = 0;
              if (billingType === "monthly") periods = Math.floor(daysOverdue / 30);
              else if (billingType === "weekly") periods = Math.floor(daysOverdue / 7);
              else if (billingType === "daily") periods = daysOverdue;

              const numberOfOverdueInstallments = isOverdue ? Math.max(0, periods) : 0;
              const interestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
              const calculatedAccumulatedInterest = numberOfOverdueInstallments > 0 ? interestPerInstallment * numberOfOverdueInstallments : 0;
              
              const delayFee = isOverdue && charge.dailyDelayRate 
                ? charge.dailyDelayRate * daysOverdue 
                : 0;
              
              const handleWhatsAppReminder = () => {
                if (client) {
                  sendPaymentReminder({
                    clientName: client.name,
                    clientPhone: client.phone || "",
                    amount: charge.amount,
                    dueDate: charge.nextInterestDueDate || charge.dueDate,
                    monthlyInterest: monthlyInterest,
                    accumulatedInterest: calculatedAccumulatedInterest,
                    delayFee: delayFee,
                    daysOverdue: isOverdue ? daysOverdue : 0,
                    isOverdue,
                  });
                }
              };
              
              return (
                <View key={charge.id} style={styles.chargeItemContainer}>
                  <Pressable
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
                    <View style={styles.chargeRight}>
                      <ThemedText style={[styles.amount, { color: theme.primaryAccent }]}>
                        {formatCurrency(charge.amount)}
                      </ThemedText>
                      <Pressable
                        style={({ pressed }) => [
                          styles.whatsappMiniButton,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleWhatsAppReminder();
                        }}
                      >
                        <Feather name="message-circle" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
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
  chargeItemContainer: {
    marginBottom: Spacing.sm,
  },
  chargeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeRight: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dueDate: {
    fontSize: 13,
    marginTop: 2,
  },
  interestValue: {
    fontSize: 12,
    marginTop: 2,
  },
  delayFeeValue: {
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  whatsappMiniButton: {
    backgroundColor: "#25D366",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
