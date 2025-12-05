import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { loanRequestService, LoanRequest } from "@/services/loanRequestService";
import { RootStackParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

export default function PendingRequestsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { addClient, addCharge } = useData();
  const { sendLoanApprovalNotification } = useWhatsApp();
  
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await loanRequestService.getPending();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      Alert.alert("Erro", "Nao foi possivel carregar as solicitacoes");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = loanRequestService.subscribeToRequests((newRequests) => {
      setRequests(newRequests);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = async (request: LoanRequest) => {
    Alert.alert(
      "Aprovar Solicitacao",
      `Deseja aprovar a solicitacao de ${request.name}?\n\nValor: ${formatCurrency(request.requestedAmount)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            setProcessingId(request.id!);
            try {
              const newClient = await addClient({
                name: request.name,
                phone: request.phone,
                email: request.email || "",
                notes: request.purpose || "",
                requestedAmount: request.requestedAmount,
                requestDate: new Date().toISOString(),
              });

              const dueDate = new Date();
              dueDate.setMonth(dueDate.getMonth() + 1);

              await addCharge({
                clientId: newClient.id,
                amount: request.requestedAmount,
                dueDate: dueDate.toISOString(),
                description: request.purpose || "Emprestimo aprovado",
                status: "pending",
                loanPercentage: 20,
              });

              await loanRequestService.updateStatus(request.id!, "approved");

              sendLoanApprovalNotification({
                clientName: request.name,
                clientPhone: request.phone,
                amount: request.requestedAmount,
                dueDate: dueDate.toISOString(),
                loanPercentage: 20,
              });

              Alert.alert(
                "Aprovado!",
                "O cliente foi cadastrado e a notificacao foi enviada via WhatsApp."
              );
            } catch (error) {
              console.error("Error approving request:", error);
              Alert.alert("Erro", "Nao foi possivel aprovar a solicitacao");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (request: LoanRequest) => {
    Alert.alert(
      "Rejeitar Solicitacao",
      `Deseja rejeitar a solicitacao de ${request.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            setProcessingId(request.id!);
            try {
              await loanRequestService.updateStatus(request.id!, "rejected");
              Alert.alert("Rejeitado", "A solicitacao foi rejeitada.");
            } catch (error) {
              console.error("Error rejecting request:", error);
              Alert.alert("Erro", "Nao foi possivel rejeitar a solicitacao");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: LoanRequest }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryAccent + "20" }]}>
              <Feather name="user" size={24} color={theme.primaryAccent} />
            </View>
            <View style={styles.clientDetails}>
              <ThemedText style={styles.clientName}>{item.name}</ThemedText>
              <ThemedText style={[styles.clientPhone, { color: theme.secondaryText }]}>
                {formatPhone(item.phone)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.warning + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: theme.warning }]}>
              Pendente
            </ThemedText>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <ThemedText style={[styles.amountLabel, { color: theme.secondaryText }]}>
            Valor Solicitado
          </ThemedText>
          <ThemedText style={[styles.amount, { color: theme.primaryAccent }]}>
            {formatCurrency(item.requestedAmount)}
          </ThemedText>
        </View>

        {item.purpose ? (
          <View style={styles.purposeContainer}>
            <ThemedText style={[styles.purposeLabel, { color: theme.secondaryText }]}>
              Finalidade:
            </ThemedText>
            <ThemedText style={styles.purposeText}>{item.purpose}</ThemedText>
          </View>
        ) : null}

        <ThemedText style={[styles.dateText, { color: theme.tertiaryText }]}>
          Solicitado em {formatDate(item.createdAt)}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.rejectButton,
              { backgroundColor: theme.error + "15", opacity: pressed ? 0.8 : 1 },
              isProcessing && { opacity: 0.5 },
            ]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.error} />
            ) : (
              <>
                <Feather name="x" size={18} color={theme.error} />
                <ThemedText style={[styles.actionButtonText, { color: theme.error }]}>
                  Rejeitar
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.approveButton,
              { backgroundColor: theme.success, opacity: pressed ? 0.8 : 1 },
              isProcessing && { opacity: 0.5 },
            ]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="check" size={18} color="#fff" />
                <ThemedText style={[styles.actionButtonText, { color: "#fff" }]}>
                  Aprovar
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryAccent} />
        <ThemedText style={[styles.loadingText, { color: theme.secondaryText }]}>
          Carregando solicitacoes...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenFlatList
      data={requests}
      renderItem={renderRequest}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.primaryAccent]}
          tintColor={theme.primaryAccent}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="inbox" size={48} color={theme.tertiaryText} />
          </View>
          <ThemedText style={styles.emptyTitle}>Nenhuma solicitacao</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.secondaryText }]}>
            Quando clientes preencherem o formulario de solicitacao, as solicitacoes aparecerao aqui.
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  list: {
    padding: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  amountContainer: {
    marginBottom: Spacing.md,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  amount: {
    fontSize: 24,
    fontWeight: "700",
  },
  purposeContainer: {
    marginBottom: Spacing.md,
  },
  purposeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  rejectButton: {},
  approveButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 3,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
