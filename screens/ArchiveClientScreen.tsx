import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ArchiveClient">;
type RouteType = RouteProp<RootStackParamList, "ArchiveClient">;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ArchiveClientScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { getClientById, getChargesByClient, toggleArchiveClient } = useData();

  const client = getClientById(route.params.clientId);
  const charges = client ? getChargesByClient(client.id) : [];

  // Verificar se TODAS as cobranças estão quitadas
  const allChargesPaid = charges.length > 0 && charges.every(c => c.status === "paid");
  const paidChargesCount = charges.filter(c => c.status === "paid").length;

  const handleArchive = async () => {
    try {
      await toggleArchiveClient(client!.id);
      setTimeout(() => navigation.goBack(), 300);
    } catch (error) {
      console.error("Erro ao arquivar cliente:", error);
    }
  };

  if (!client) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={theme.tertiaryText} />
          <ThemedText style={[styles.emptyText, { color: theme.secondaryText }]}>
            Cliente não encontrado
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.headerCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FFB400" + "20" }]}>
            <Feather name="archive" size={32} color="#FFB400" />
          </View>
          <ThemedText style={styles.title}>Arquivar Cliente</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.secondaryText }]}>
            {client.name}
          </ThemedText>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
            Resumo de Cobranças
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: theme.secondaryText }]}>
            Total de cobranças: {charges.length}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: theme.success }]}>
            Quitadas: {paidChargesCount}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: theme.warning }]}>
            Pendentes: {charges.length - paidChargesCount}
          </ThemedText>
        </View>

        {allChargesPaid ? (
          <View
            style={[
              styles.successCard,
              { backgroundColor: "#51CF66" + "15", borderColor: "#51CF66" },
            ]}
          >
            <Feather name="check-circle" size={24} color="#51CF66" />
            <ThemedText style={[styles.successText, { color: "#51CF66" }]}>
              Todas as cobranças foram quitadas! Cliente pronto para arquivar.
            </ThemedText>
          </View>
        ) : (
          <View
            style={[
              styles.warningCard,
              { backgroundColor: theme.warning + "15", borderColor: theme.warning },
            ]}
          >
            <Feather name="alert-circle" size={24} color={theme.warning} />
            <ThemedText style={[styles.warningText, { color: theme.warning }]}>
              Ainda há {charges.length - paidChargesCount} cobrança(s) pendente(s). O cliente será arquivado mesmo assim, mas as cobranças continuarão ativas.
            </ThemedText>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={[styles.cancelButtonText, { color: theme.text }]}>
              Cancelar
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.archiveButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleArchive}
          >
            <Feather name="archive" size={18} color="#fff" />
            <ThemedText style={styles.archiveButtonText}>
              Confirmar Arquivamento
            </ThemedText>
          </Pressable>
        </View>
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
    paddingBottom: Spacing.xl * 2,
  },
  headerCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  infoValue: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  successCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  warningCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  archiveButton: {
    flex: 1,
    backgroundColor: "#FFB400",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  archiveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
});
