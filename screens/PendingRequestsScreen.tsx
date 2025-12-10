import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, RefreshControl, Modal, TextInput } from "react-native";
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
  const [error, setError] = useState<string | null>(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [loanPercentageInput, setLoanPercentageInput] = useState("20");
  const [dailyDelayRateInput, setDailyDelayRateInput] = useState("5");

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await loanRequestService.getPending();
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests:", err);
      setError("Nao foi possivel carregar as solicitacoes. Verifique sua conexao.");
      setRequests([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = loanRequestService.subscribeToRequests((newRequests) => {
        setRequests(newRequests);
        setIsLoading(false);
        setError(null);
      });
    } catch (err) {
      console.error("Error subscribing to requests:", err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = (request: LoanRequest) => {
    setSelectedRequest(request);
    setLoanPercentageInput("20");
    setDailyDelayRateInput("5");
    setApprovalModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    
    const loanPercentage = parseFloat(loanPercentageInput) || 20;
    const dailyDelayRate = parseFloat(dailyDelayRateInput) || 5;
    
    if (loanPercentage <= 0 || loanPercentage > 100) {
      Alert.alert("Erro", "A porcentagem deve ser entre 1 e 100");
      return;
    }

    if (dailyDelayRate < 0) {
      Alert.alert("Erro", "A taxa de atraso nao pode ser negativa");
      return;
    }

    setApprovalModalVisible(false);
    setProcessingId(selectedRequest.id!);
    
    try {
      const newClient = await addClient({
        name: selectedRequest.name,
        phone: selectedRequest.phone,
        email: selectedRequest.email || "",
        notes: selectedRequest.purpose || "",
        requestedAmount: selectedRequest.requestedAmount,
        requestDate: new Date().toISOString(),
      });

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      await addCharge({
        clientId: newClient.id,
        amount: selectedRequest.requestedAmount,
        dueDate: dueDate.toISOString(),
        description: selectedRequest.purpose || "Emprestimo aprovado",
        status: "pending",
        loanPercentage: loanPercentage,
        dailyDelayRate: dailyDelayRate,
      });

      await loanRequestService.updateStatus(selectedRequest.id!, "approved");

      sendLoanApprovalNotification({
        clientName: selectedRequest.name,
        clientPhone: selectedRequest.phone,
        amount: selectedRequest.requestedAmount,
        dueDate: dueDate.toISOString(),
        loanPercentage: loanPercentage,
        dailyDelayRate: dailyDelayRate,
      });

      Alert.alert(
        "Aprovado!",
        `Cliente cadastrado com juros de ${loanPercentage}% e taxa de atraso de R$ ${dailyDelayRate.toFixed(2)}/dia.`
      );
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Erro", "Nao foi possivel aprovar a solicitacao");
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
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
    <>
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

      <Modal
        visible={approvalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Aprovar Solicitacao</ThemedText>
            
            {selectedRequest ? (
              <>
                <ThemedText style={[styles.modalSubtitle, { color: theme.secondaryText }]}>
                  {selectedRequest.name} - {formatCurrency(selectedRequest.requestedAmount)}
                </ThemedText>
                
                <ThemedText style={[styles.modalLabel, { color: theme.text }]}>
                  Porcentagem de Juros Mensal (%)
                </ThemedText>
                
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.cardBorder,
                  }]}
                  value={loanPercentageInput}
                  onChangeText={setLoanPercentageInput}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={theme.tertiaryText}
                />

                <ThemedText style={[styles.modalLabel, { color: theme.text }]}>
                  Taxa de Atraso Diaria (R$)
                </ThemedText>
                
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.cardBorder,
                  }]}
                  value={dailyDelayRateInput}
                  onChangeText={setDailyDelayRateInput}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={theme.tertiaryText}
                />
                
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => setApprovalModalVisible(false)}
                  >
                    <ThemedText style={{ color: theme.text }}>Cancelar</ThemedText>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: theme.success }]}
                    onPress={confirmApprove}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Aprovar</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
