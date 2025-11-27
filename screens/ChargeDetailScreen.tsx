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

  const handleMarkAsPaid = () => {
    Alert.alert(
      "Confirmar pagamento",
      "Deseja marcar esta cobrança como paga?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            markAsPaid(charge.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir cobrança",
      "Tem certeza que deseja excluir esta cobrança? Esta ação nao pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteCharge(charge.id);
            setTimeout(() => {
              navigation.goBack();
            }, 100);
          },
        },
      ]
    );
  };

  const handlePayMonthlyInterest = () => {
    Alert.alert(
      "Confirmar pagamento de juros",
      "Deseja registrar o pagamento dos juros deste mês?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            payMonthlyInterest(charge.id);
            setTimeout(() => {
              navigation.goBack();
            }, 100);
          },
        },
      ]
    );
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
        </View>

        {charge.status !== "paid" ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleMarkAsPaid}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Marcar como Pago</ThemedText>
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
