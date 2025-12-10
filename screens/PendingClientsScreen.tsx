import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { Charge, ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

function StatusBadge({ status, theme, hasDelay }: { status: ChargeStatus; theme: any; hasDelay?: boolean }) {
  let config;
  
  if (status === "paid") {
    config = { bg: theme.success + "20", text: theme.success, label: "Pago" };
  } else if (status === "overdue") {
    config = { bg: theme.error + "20", text: theme.error, label: "Vencido" };
  } else {
    config = { bg: theme.success + "20", text: theme.success, label: "Em Dia" };
  }
  
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <ThemedText style={[styles.badgeText, { color: config.text }]}>{config.label}</ThemedText>
    </View>
  );
}

export default function PendingClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight, paddingTop } = useScreenInsets();
  const { charges, getClientById, payments } = useData();

  // Get all overdue charges
  const overdueCharges = useMemo(() => {
    return charges
      .filter(c => c.status === "overdue")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [charges]);

  const renderItem = ({ item }: { item: Charge }) => {
    const client = getClientById(item.clientId);
    
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const delayFeeAlreadyPaid = payments
      .filter((p) => p.chargeId === item.id && (p.notes?.includes("taxa de atraso") || p.type === "delay_fee"))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const delayFee = daysOverdue > 0 && item.dailyDelayRate 
      ? item.dailyDelayRate * daysOverdue 
      : 0;
    
    const pendingDelayFee = Math.max(0, delayFee - delayFeeAlreadyPaid);
    
    const interestDueDate = item.nextInterestDueDate ? new Date(item.nextInterestDueDate) : null;
    const interestDaysOverdue = interestDueDate
      ? Math.floor((today.getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const hasInterestDelay = interestDaysOverdue >= 1;
    
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
          <StatusBadge status={item.status} theme={theme} hasDelay={hasInterestDelay} />
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
      {overdueCharges.length === 0 ? (
        <ScreenScrollView
          contentContainerStyle={[
            styles.emptyContainer,
            { paddingTop: paddingTop + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
          ]}
        >
          <View style={styles.emptyContent}>
            <Feather name="check-circle" size={48} color={theme.tertiaryText} />
            <ThemedText style={[styles.emptyText, { color: theme.secondaryText }]}>
              Nenhum cliente pendente
            </ThemedText>
          </View>
        </ScreenScrollView>
      ) : (
        <FlatList
          data={overdueCharges}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingTop: paddingTop + Spacing.md,
            paddingHorizontal: Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          }}
          scrollIndicatorInsets={{ bottom: tabBarHeight }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  chargeCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
  },
});
