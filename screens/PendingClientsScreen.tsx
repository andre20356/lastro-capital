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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PendingClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight, paddingTop } = useScreenInsets();
  const { charges, getClientById } = useData();

  // Get all unique clients with overdue charges
  const pendingClients = useMemo(() => {
    const clientsMap = new Map<string, { clientId: string; name: string; overdueCount: number; totalInterest: number }>();

    charges
      .filter(c => c.status === "overdue")
      .forEach(charge => {
        const client = getClientById(charge.clientId);
        if (client) {
          const existing = clientsMap.get(charge.clientId);
          if (existing) {
            existing.overdueCount += 1;
            existing.totalInterest += charge.accumulatedInterest || 0;
          } else {
            clientsMap.set(charge.clientId, {
              clientId: charge.clientId,
              name: client.name,
              overdueCount: 1,
              totalInterest: charge.accumulatedInterest || 0,
            });
          }
        }
      });

    return Array.from(clientsMap.values()).sort((a, b) => b.totalInterest - a.totalInterest);
  }, [charges, getClientById]);

  const renderItem = ({ item }: { item: (typeof pendingClients)[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.clientCard,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => navigation.navigate("ClientDetail", { clientId: item.clientId })}
    >
      <View style={styles.cardContent}>
        <View style={styles.clientInfo}>
          <ThemedText style={[styles.clientName, { color: theme.text }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.overdueBadge, { color: theme.warning }]}>
            {item.overdueCount} {item.overdueCount === 1 ? "parcela vencida" : "parcelas vencidas"}
          </ThemedText>
        </View>
        <ThemedText style={[styles.interestAmount, { color: theme.warning }]}>
          {formatCurrency(item.totalInterest)}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {pendingClients.length === 0 ? (
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
          data={pendingClients}
          renderItem={renderItem}
          keyExtractor={item => item.clientId}
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
  clientCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  overdueBadge: {
    fontSize: 12,
    fontWeight: "500",
  },
  interestAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
