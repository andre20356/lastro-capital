import React from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChargeDetail">;
type RouteType = RouteProp<RootStackParamList, "ChargeDetail">;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status, theme }: { status: ChargeStatus; theme: any }) {
  const config = {
    pending: { bg: theme.warning + "20", text: theme.warning, label: "Pendente" },
    paid: { bg: theme.success + "20", text: theme.success, label: "Pago" },
    overdue: { bg: theme.error + "20", text: theme.error, label: "Vencido" },
  };

  const { bg, text, label } = config[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <ThemedText style={[styles.badgeText, { color: text }]}>{label}</ThemedText>
    </View>
  );
}

export default function ChargeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { getChargeById, getClientById, markAsPaid, deleteCharge, payMonthlyInterest } = useData();

  const charge = getChargeById(route.params.chargeId);
  const client = charge ? getClientById(charge.clientId) : null;

  if (!charge) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={theme.tertiaryText} />
          <ThemedText style={[styles.emptyText, { color: theme.secondaryText }]}>
            Cobrança nao encontrada
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleQuitacaoDivida = async () => {
    const confirmado = window.confirm("Deseja confirmar a quitação completa desta dívida? A data será registrada automaticamente.");
    if (confirmado) {
      try {
        console.log("Executando markAsPaid para:", charge.id);
        await markAsPaid(charge.id);
        console.log("Quitação realizada com sucesso!");
        navigation.goBack();
      } catch (error) {
        console.error("Erro ao marcar como pago:", error);
        alert("Erro ao processar quitação");
      }
    }
  };

  const handleDelete = async () => {
    const confirmado = window.confirm("Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.");
    if (confirmado) {
      try {
        console.log("Excluindo cobrança:", charge.id);
        await deleteCharge(charge.id);
        console.log("Cobrança excluída com sucesso!");
        navigation.goBack();
      } catch (error) {
        console.error("Erro ao excluir cobrança:", error);
        alert("Erro ao excluir cobrança");
      }
    }
  };

  const handlePayMonthlyInterest = async () => {
    const confirmado = window.confirm("Deseja registrar o pagamento dos juros deste mês?");
    if (confirmado) {
      try {
        console.log("Executando pagamento de juros para:", charge.id);
        await payMonthlyInterest(charge.id);
        console.log("Pagamento de juros realizado com sucesso!");
        navigation.goBack();
      } catch (error) {
        console.error("Erro ao pagar juros:", error);
        alert("Erro ao processar pagamento de juros");
      }
    }
  };

  // Calculate days overdue and total debt
  const dueDate = new Date(charge.dueDate);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const delayFee = daysOverdue > 0 && charge.dailyDelayRate 
    ? charge.dailyDelayRate * daysOverdue 
    : 0;
  const totalDebt = charge.amount + (charge.accumulatedInterest || 0) + delayFee;
  const shouldShowTotalDebt = daysOverdue > 30;

  // Calculate interest delay (atraso nos juros)
  const interestDueDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : null;
  const interestDaysOverdue = interestDueDate
    ? Math.floor((today.getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const interestDelayFee = interestDaysOverdue > 0 && charge.dailyDelayRate && charge.accumulatedInterest
    ? charge.dailyDelayRate * interestDaysOverdue
    : 0;
  const totalInterestToPay = (charge.accumulatedInterest || 0) + interestDelayFee;
  const hasInterestDelay = interestDaysOverdue > 0;

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <ThemedText style={styles.amount}>{formatCurrency(charge.amount)}</ThemedText>
            <StatusBadge status={charge.status} theme={theme} />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Feather name="user" size={18} color={theme.secondaryText} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                Cliente
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {client?.name || "Cliente removido"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="calendar" size={18} color={theme.secondaryText} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                Vencimento
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDate(charge.dueDate)}
              </ThemedText>
            </View>
          </View>

          {charge.description ? (
            <View style={styles.infoRow}>
              <Feather name="file-text" size={18} color={theme.secondaryText} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                  Descrição
                </ThemedText>
                <ThemedText style={styles.infoValue}>{charge.description}</ThemedText>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Feather name="clock" size={18} color={theme.secondaryText} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                Criado em
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDate(charge.createdAt)}
              </ThemedText>
            </View>
          </View>

          {shouldShowTotalDebt ? (
            <View
              style={[
                styles.totalDebtCard,
                { backgroundColor: theme.error + "15", borderColor: theme.error },
              ]}
            >
              <View style={styles.debtHeader}>
                <Feather name="alert-triangle" size={20} color={theme.error} />
                <ThemedText style={[styles.debtTitle, { color: theme.error }]}>
                  Valor Total da Dívida
                </ThemedText>
              </View>
              <ThemedText style={[styles.debtValue, { color: theme.error }]}>
                {formatCurrency(totalDebt)}
              </ThemedText>
              <View style={styles.debtBreakdown}>
                <View style={styles.debtItem}>
                  <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                    Valor Solicitado
                  </ThemedText>
                  <ThemedText style={[styles.debtItemValue, { color: theme.secondaryText }]}>
                    {formatCurrency(charge.amount)}
                  </ThemedText>
                </View>
                <View style={styles.debtItem}>
                  <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                    Juros Acumulados
                  </ThemedText>
                  <ThemedText style={[styles.debtItemValue, { color: "#FFB400" }]}>
                    {formatCurrency(charge.accumulatedInterest || 0)}
                  </ThemedText>
                </View>
                <View style={styles.debtItem}>
                  <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                    Taxa de Atraso ({daysOverdue} dias)
                  </ThemedText>
                  <ThemedText style={[styles.debtItemValue, { color: theme.error }]}>
                    {formatCurrency(delayFee)}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : null}

          {charge.lastInterestPaymentDate ? (
            <View style={styles.infoRow}>
              <Feather name="check-circle" size={18} color={theme.success} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                  Juros Pagos em
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.success }]}>
                  {formatDate(charge.lastInterestPaymentDate)}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {charge.nextInterestDueDate ? (
            <View style={styles.infoRow}>
              <Feather name="calendar" size={18} color={theme.warning} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText }]}>
                  Próximo Vencimento Juros
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.warning }]}>
                  {formatDate(charge.nextInterestDueDate)}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {charge.accumulatedInterest && charge.accumulatedInterest > 0 ? (
            <View
              style={[
                styles.interestCard,
                { 
                  backgroundColor: hasInterestDelay ? theme.error + "15" : theme.warning + "15",
                  borderColor: hasInterestDelay ? theme.error : theme.warning,
                },
              ]}
            >
              <View style={styles.debtHeader}>
                <Feather name="percent" size={20} color={hasInterestDelay ? theme.error : theme.warning} />
                <ThemedText style={[styles.debtTitle, { color: hasInterestDelay ? theme.error : theme.warning }]}>
                  {hasInterestDelay ? "Juros em Atraso" : "Juros do Mês"}
                </ThemedText>
              </View>
              <ThemedText style={[styles.debtValue, { color: hasInterestDelay ? theme.error : theme.warning }]}>
                {formatCurrency(totalInterestToPay)}
              </ThemedText>
              {hasInterestDelay && (
                <View style={styles.debtBreakdown}>
                  <View style={styles.debtItem}>
                    <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                      Juros Acumulados
                    </ThemedText>
                    <ThemedText style={[styles.debtItemValue, { color: "#FFB400" }]}>
                      {formatCurrency(charge.accumulatedInterest || 0)}
                    </ThemedText>
                  </View>
                  <View style={styles.debtItem}>
                    <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                      Taxa de Atraso ({interestDaysOverdue} dias)
                    </ThemedText>
                    <ThemedText style={[styles.debtItemValue, { color: theme.error }]}>
                      {formatCurrency(interestDelayFee)}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {charge.status !== "paid" ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleQuitacaoDivida}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Quitação de Dívida</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: "#FFB400", opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handlePayMonthlyInterest}
            >
              <Feather name="dollar-sign" size={18} color="#FFB400" />
              <ThemedText style={[styles.secondaryButtonText, { color: "#FFB400" }]}>
                Pagar Juros do Mês
              </ThemedText>
            </Pressable>
          </>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primaryAccent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate("ChargeForm", { charge })}
        >
          <Feather name="edit-2" size={18} color={theme.primaryAccent} />
          <ThemedText style={[styles.secondaryButtonText, { color: theme.primaryAccent }]}>
            Editar Cobrança
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <ThemedText style={[styles.deleteButtonText, { color: theme.error }]}>
            Excluir Cobrança
          </ThemedText>
        </Pressable>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  totalDebtCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  debtHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  debtTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  debtValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  debtBreakdown: {
    gap: Spacing.sm,
  },
  debtItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  debtItemLabel: {
    fontSize: 12,
  },
  debtItemValue: {
    fontSize: 13,
    fontWeight: "600",
  },
});
