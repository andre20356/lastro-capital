import React from "react";
import { StyleSheet, View, Pressable, Alert, FlatList, Linking } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { Charge, ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientDetail">;
type RouteType = RouteProp<RootStackParamList, "ClientDetail">;

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

export default function ClientDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { getClientById, getChargesByClient, deleteClient, toggleArchiveClient } = useData();

  const client = getClientById(route.params.clientId);
  const charges = client ? getChargesByClient(client.id) : [];

  const pendingTotal = charges
    .filter((c) => c.status === "pending" || c.status === "overdue")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalAccumulatedInterest = charges
    .filter((c) => c.status === "pending" || c.status === "overdue")
    .reduce((sum, c) => sum + (c.accumulatedInterest || 0), 0);

  if (!client) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={theme.tertiaryText} />
          <ThemedText style={[styles.emptyText, { color: theme.secondaryText }]}>
            Cliente nao encontrado
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleCall = () => {
    if (client.phone) {
      Linking.openURL(`tel:${client.phone.replace(/\D/g, "")}`);
    }
  };

  const handleEmail = () => {
    if (client.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir cliente",
      "Tem certeza que deseja excluir este cliente? Todas as cobranças relacionadas tambem serão excluidas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteClient(client.id);
            setTimeout(() => navigation.goBack(), 150);
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    // Se está ativo, vai para página de arquivamento
    navigation.navigate("ArchiveClient", { clientId: client.id });
  };

  const renderCharge = ({ item }: { item: Charge }) => (
    <Pressable
      style={({ pressed }) => [
        styles.chargeCard,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => navigation.navigate("ChargeDetail", { chargeId: item.id })}
    >
      <View style={styles.chargeInfo}>
        <ThemedText style={styles.chargeAmount}>{formatCurrency(item.amount)}</ThemedText>
        <ThemedText style={[styles.chargeDate, { color: theme.secondaryText }]}>
          Vence: {formatDate(item.dueDate)}
        </ThemedText>
      </View>
      <StatusBadge status={item.status} theme={theme} />
    </Pressable>
  );

  const ListHeader = () => (
    <>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primaryAccent + "20" }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primaryAccent }]}>
            {client.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        
        <ThemedText style={styles.clientName}>{client.name}</ThemedText>
        
        {pendingTotal > 0 ? (
          <View style={styles.pendingRow}>
            <ThemedText style={[styles.pendingLabel, { color: theme.secondaryText }]}>
              Valor pendente:
            </ThemedText>
            <ThemedText style={[styles.pendingAmount, { color: theme.warning }]}>
              {formatCurrency(pendingTotal)}
            </ThemedText>
          </View>
        ) : null}

        {totalAccumulatedInterest > 0 ? (
          <View style={styles.pendingRow}>
            <ThemedText style={[styles.pendingLabel, { color: theme.secondaryText }]}>
              Juros acumulados:
            </ThemedText>
            <ThemedText style={[styles.pendingAmount, { color: theme.error }]}>
              {formatCurrency(totalAccumulatedInterest)}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.contactRow}>
          {client.phone ? (
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleCall}
            >
              <Feather name="phone" size={18} color="#fff" />
              <ThemedText style={styles.contactButtonText}>Ligar</ThemedText>
            </Pressable>
          ) : null}
          
          {client.email ? (
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.secondaryAccent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleEmail}
            >
              <Feather name="mail" size={18} color="#fff" />
              <ThemedText style={styles.contactButtonText}>E-mail</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {client.notes ? (
          <View style={styles.notesSection}>
            <ThemedText style={[styles.notesLabel, { color: theme.tertiaryText }]}>
              Observações
            </ThemedText>
            <ThemedText style={[styles.notesText, { color: theme.secondaryText }]}>
              {client.notes}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.primaryAccent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate("ClientForm", { client })}
        >
          <Feather name="edit-2" size={16} color={theme.primaryAccent} />
          <ThemedText style={[styles.actionButtonText, { color: theme.primaryAccent }]}>
            Editar
          </ThemedText>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.primaryAccent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => navigation.navigate("ChargeForm", { clientId: client.id })}
        >
          <Feather name="plus" size={16} color={theme.primaryAccent} />
          <ThemedText style={[styles.actionButtonText, { color: theme.primaryAccent }]}>
            Nova Cobrança
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.warning, opacity: pressed ? 0.8 : 1, display: client.archived ? "none" : "flex" },
          ]}
          onPress={handleArchive}
        >
          <Feather name="archive" size={16} color={theme.warning} />
          <ThemedText style={[styles.actionButtonText, { color: theme.warning }]}>
            Arquivar
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
        Cobranças ({charges.length})
      </ThemedText>
    </>
  );

  const ListFooter = () => (
    <Pressable
      style={({ pressed }) => [
        styles.deleteButton,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={handleDelete}
    >
      <Feather name="trash-2" size={18} color={theme.error} />
      <ThemedText style={[styles.deleteButtonText, { color: theme.error }]}>
        Excluir Cliente
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={charges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
        renderItem={renderCharge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          <View style={[styles.emptyCharges, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={32} color={theme.tertiaryText} />
            <ThemedText style={[styles.emptyChargesText, { color: theme.tertiaryText }]}>
              Nenhuma cobrança para este cliente
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  clientName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  pendingLabel: {
    fontSize: 14,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  notesSection: {
    width: "100%",
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  notesLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  chargeCard: {
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
  chargeAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  chargeDate: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCharges: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyChargesText: {
    fontSize: 14,
    textAlign: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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
});
