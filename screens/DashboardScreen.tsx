import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(value: number): string {
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
    getOverdueCharges,
    getUpcomingCharges,
    getClientById,
  } = useData();

  const pendingTotal = getPendingTotal();
  const paidTotal = getPaidTotal();
  const overdueCharges = getOverdueCharges();
  const upcomingCharges = getUpcomingCharges(7);

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
              {formatCurrency(pendingTotal)}
            </ThemedText>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check-circle" size={20} color={theme.success} />
            </View>
            <ThemedText style={[styles.cardLabel, { color: theme.secondaryText }]}>
              Recebido (mes)
            </ThemedText>
            <ThemedText style={[styles.cardValue, { color: theme.success }]}>
              {formatCurrency(paidTotal)}
            </ThemedText>
          </View>
        </View>

        {overdueCharges.length > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.alertCard,
              { backgroundColor: theme.error + "15", borderColor: theme.error + "30", opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => navigation.navigate("MainTabs")}
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
});
