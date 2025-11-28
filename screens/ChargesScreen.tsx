import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, View, Pressable, FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { Charge, ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = "all" | "pending" | "paid" | "overdue";

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

function StatusBadge({ status, theme }: { status: ChargeStatus; theme: any }) {
  let config;
  
  if (status === "paid") {
    config = { bg: theme.success + "20", text: theme.success, label: "Pago" };
  } else if (status === "overdue") {
    config = { bg: theme.error + "20", text: theme.error, label: "Vencido" };
  } else {
    config = { bg: theme.success + "20", text: theme.success, label: "Em Dia" };
  }

  const { bg, text, label } = config;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <ThemedText style={[styles.badgeText, { color: text }]}>{label}</ThemedText>
    </View>
  );
}

export default function ChargesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight, paddingTop } = useScreenInsets();
  const { charges, getClientById, payments, refreshData, updateCharge } = useData();
  const [filter, setFilter] = useState<FilterType>("all");

  // Recarregar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      console.log("ChargesScreen focus effect - recarregando dados");
      refreshData();
    }, [refreshData])
  );

  const filteredCharges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Atualizar status de charges vencidas em tempo real
    let result = charges.map((charge) => {
      if (charge.status === "paid") return charge;
      
      const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
      referenceDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue >= 1 && charge.status !== "overdue") {
        console.log(`Detectado vencimento para ${charge.id}: ${daysOverdue} dias atrasado, mudando para "overdue"`);
        const monthlyInterestAmount = (charge.loanPercentage || 0) / 100 * charge.amount;
        const dailyInterestAmount = monthlyInterestAmount / 30;
        const totalAccumulatedInterest = dailyInterestAmount * daysOverdue;
        return {
          ...charge,
          status: "overdue" as const,
          accumulatedInterest: Math.max(totalAccumulatedInterest, charge.accumulatedInterest || 0)
        };
      }
      return charge;
    });
    
    if (filter !== "all") {
      if (filter === "overdue") {
        result = result.filter((c) => c.status === "overdue");
      } else {
        result = result.filter((c) => c.status === filter);
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [charges, filter]);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendentes" },
    { key: "paid", label: "Pagos" },
    { key: "overdue", label: "Vencidos" },
  ];

  const renderItem = ({ item }: { item: Charge }) => {
    const client = getClientById(item.clientId);
    
    // Calcular se tem atraso de taxa ou juros
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const delayFeeAlreadyPaid = payments
      .filter((p) => p.chargeId === item.id && p.notes === "Pagamento de taxa de atraso")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const delayFee = daysOverdue > 0 && item.dailyDelayRate 
      ? item.dailyDelayRate * daysOverdue 
      : 0;
    
    const pendingDelayFee = Math.max(0, delayFee - delayFeeAlreadyPaid);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.chargeCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.navigate("ChargeDetail", { chargeId: item.id })}
      >
        <View style={styles.cardHeader}>
          <ThemedText style={styles.clientName}>
            {client?.name || "Cliente removido"}
          </ThemedText>
          <StatusBadge status={item.status} theme={theme} />
        </View>
        
        <View style={styles.cardBody}>
          <View>
            <ThemedText style={[styles.label, { color: theme.tertiaryText }]}>
              Juros
            </ThemedText>
            <ThemedText style={[styles.amount, { color: theme.text }]}>
              {formatCurrency(item.accumulatedInterest || 0)}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={[styles.label, { color: theme.tertiaryText }]}>
              Vencimento
            </ThemedText>
            <ThemedText style={{ color: theme.secondaryText }}>
              {item.nextInterestDueDate ? formatDate(item.nextInterestDueDate) : formatDate(item.dueDate)}
            </ThemedText>
          </View>
        </View>
        
        {item.description ? (
          <ThemedText
            style={[styles.description, { color: theme.secondaryText }]}
            numberOfLines={1}
          >
            {item.description}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterContainer, { backgroundColor: theme.backgroundSecondary }]}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterButton,
              filter === f.key && { backgroundColor: theme.primaryAccent },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === f.key ? "#fff" : theme.secondaryText },
              ]}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredCharges}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl + 70 },
        ]}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={48} color={theme.tertiaryText} />
            <ThemedText style={[styles.emptyTitle, { color: theme.secondaryText }]}>
              Nenhuma cobrança
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.tertiaryText }]}>
              Adicione sua primeira cobrança tocando no botão +
            </ThemedText>
          </View>
        }
      />

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
  filterContainer: {
    flexDirection: "row",
    padding: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  chargeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xs,
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
