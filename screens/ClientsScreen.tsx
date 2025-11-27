import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, FlatList, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { Client } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight } = useScreenInsets();
  const { clients, getChargesByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    let result = [...clients];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.includes(query)
      );
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchQuery]);

  const getClientPendingAmount = (clientId: string): number => {
    const charges = getChargesByClient(clientId);
    return charges
      .filter((c) => c.status === "pending" || c.status === "overdue")
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const renderItem = ({ item }: { item: Client }) => {
    const pendingAmount = getClientPendingAmount(item.id);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.clientCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.navigate("ClientDetail", { clientId: item.id })}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primaryAccent + "20" }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primaryAccent }]}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        
        <View style={styles.clientInfo}>
          <ThemedText style={styles.clientName}>{item.name}</ThemedText>
          {item.phone ? (
            <ThemedText style={[styles.clientContact, { color: theme.secondaryText }]}>
              {item.phone}
            </ThemedText>
          ) : null}
        </View>
        
        {pendingAmount > 0 ? (
          <View style={styles.pendingContainer}>
            <ThemedText style={[styles.pendingLabel, { color: theme.tertiaryText }]}>
              Pendente
            </ThemedText>
            <ThemedText style={[styles.pendingAmount, { color: theme.warning }]}>
              {formatCurrency(pendingAmount)}
            </ThemedText>
          </View>
        ) : null}
        
        <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
          ]}
        >
          <Feather name="search" size={18} color={theme.tertiaryText} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Buscar cliente..."
            placeholderTextColor={theme.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.tertiaryText} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl + 70 },
        ]}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="users" size={48} color={theme.tertiaryText} />
            <ThemedText style={[styles.emptyTitle, { color: theme.secondaryText }]}>
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente"}
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.tertiaryText }]}>
              {searchQuery
                ? "Tente uma busca diferente"
                : "Adicione seu primeiro cliente tocando no botao +"}
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
        onPress={() => navigation.navigate("ClientForm", {})}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
  },
  clientContact: {
    fontSize: 13,
    marginTop: 2,
  },
  pendingContainer: {
    alignItems: "flex-end",
    marginRight: Spacing.sm,
  },
  pendingLabel: {
    fontSize: 11,
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: "600",
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
