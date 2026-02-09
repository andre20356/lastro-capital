import React, { useEffect, useState, useMemo, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PaymentModal } from "@/components/PaymentModal";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { ChargeStatus, Charge, PaymentMethod } from "@/types";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChargeDetail">;
type RouteType = RouteProp<RootStackParamList, "ChargeDetail">;

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
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

function StatusBadge({ status, theme, hasDelay }: { status: ChargeStatus; theme: any; hasDelay?: boolean }) {
  let config;
  
  if (status === "paid") {
    config = { bg: theme.success + "20", text: theme.success, label: "Pago" };
  } else if (hasDelay) {
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

type PaymentType = "quitacao" | "juros" | "taxa_atraso";

export default function ChargeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { getChargeById, getClientById, markAsPaid, deleteCharge, payMonthlyInterest, payDelayFee, refreshData, payments } = useData();
  const { sendPaymentReminder } = useWhatsApp();
  const [renderKey, setRenderKey] = useState(0);
  
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("juros");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Função para calcular o status visual dinâmico
  const getVisualStatus = useCallback((charge: Charge): ChargeStatus => {
    if (charge.status === "paid") return "paid";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    referenceDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysOverdue >= 1 ? "overdue" : "pending";
  }, []);

  // Recarregar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Monitorar mudanças em payments e forçar re-render
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [payments]);

  const charge = getChargeById(route.params.chargeId);
  const client = charge ? getClientById(charge.clientId) : null;

  // Usar useMemo para recalcular todos os valores quando renderKey ou payments mudam
  const calculations = useMemo(() => {
    if (!charge) return {
      daysOverdue: 0,
      delayFeeAlreadyPaid: 0,
      daysPaidSoFar: 0,
      daysRemainingOverdue: 0,
      numberOfOverdueInstallments: 0,
      calculatedAccumulatedInterest: 0,
      delayFee: 0,
      pendingDelayFee: 0,
      totalDebt: 0,
      interestDaysOverdue: 0,
      interestDelayFee: 0,
      totalInterestToPay: 0,
      hasInterestDelay: false,
      shouldShowTotalDebt: false,
      hasAnyDelay: false,
    };

    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    
    // Para calcular parcelas de juros e taxa de atraso, usar nextInterestDueDate se existir (após pagamentos)
    const interestDueDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : dueDate;
    
    // Calcular atraso baseado na data de vencimento de juros (não no dueDate original)
    const daysOverdue = Math.floor((today.getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se não venceu ainda, sem atraso. Só mostra atraso após 1 dia do vencimento de juros
    const hasRealDelay = daysOverdue >= 1;
    
    // Verificar se já há pagamento de taxa de atraso
    const delayFeeAlreadyPaid = (payments || [])
      .filter((p: any) => p.chargeId === charge.id && (p.notes?.toLowerCase().includes("taxa de atraso") || (p as any).type === "delay_fee"))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    // Calcular quantos dias já foram cobertos pelos pagamentos de taxa de atraso
    const daysPaidSoFar = (charge.dailyDelayRate || 0) > 0 && hasRealDelay ? Math.floor(delayFeeAlreadyPaid / (charge.dailyDelayRate || 1)) : 0;
    
    // Calcular dias ainda pendentes de pagamento (só se houver atraso real)
    const daysRemainingOverdue = hasRealDelay ? Math.max(0, daysOverdue - daysPaidSoFar) : 0;
    
    // Calcular atraso de juros - SÓ APARECE 1 DIA APÓS O VENCIMENTO (>= 1)
    // Usa mesma lógica que daysOverdue (baseado em nextInterestDueDate)
    const daysInterestOverdue = daysOverdue;
    const hasInterestDelay = daysInterestOverdue >= 1; // Reforço: só atraso se passou 1 dia completo
    
    // Calcular número de parcelas em atraso (baseado em dias de juros e modalidade)
    const billingType = charge.billingType || "monthly";
    let periods = 0;
    if (billingType === "monthly") periods = Math.floor(daysOverdue / 30);
    else if (billingType === "weekly") periods = Math.floor(daysOverdue / 7);
    else if (billingType === "daily") periods = daysOverdue;

    const numberOfOverdueInstallments = hasInterestDelay ? Math.max(0, periods) : 0;
    
    // Calcular juros mensais/período por parcela
    const interestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    
    // Juros acumulados = juros do período * número de parcelas em atraso
    const calculatedAccumulatedInterest = numberOfOverdueInstallments > 0 ? interestPerInstallment * numberOfOverdueInstallments : 0;
    
    const delayFee = hasRealDelay && charge.dailyDelayRate 
      ? charge.dailyDelayRate * daysOverdue 
      : 0;
    
    // Mostrar apenas a taxa de atraso ainda não paga
    const pendingDelayFee = Math.max(0, delayFee - delayFeeAlreadyPaid);
    const totalDebt = charge.amount + calculatedAccumulatedInterest + pendingDelayFee;

    // Calculate interest delay fee (taxa adicional por atraso de juros)
    const interestDelayFee = hasInterestDelay && charge.dailyDelayRate && charge.accumulatedInterest
      ? charge.dailyDelayRate * daysInterestOverdue
      : 0;
    const totalInterestToPay = (charge.accumulatedInterest || 0) + interestDelayFee;
    
    // CRÍTICO: Mostrar alerta APENAS se tiver juros em atraso (1+ dias após vencimento)
    // NÃO mostrar para atraso de taxa de atraso - apenas para juros
    const shouldShowTotalDebt = hasInterestDelay;
    
    // Verificar se tem algum atraso (juros ou taxa)
    const hasAnyDelay = daysRemainingOverdue > 0 || hasInterestDelay;

    return {
      daysOverdue,
      delayFeeAlreadyPaid,
      daysPaidSoFar,
      daysRemainingOverdue,
      numberOfOverdueInstallments,
      calculatedAccumulatedInterest,
      delayFee,
      pendingDelayFee,
      totalDebt,
      daysInterestOverdue,
      interestDelayFee,
      totalInterestToPay,
      hasInterestDelay,
      shouldShowTotalDebt,
      hasAnyDelay,
    };
  }, [renderKey, payments, charge, charge?.id, charge?.dueDate, charge?.dailyDelayRate, charge?.loanPercentage, charge?.amount, charge?.nextInterestDueDate, charge?.accumulatedInterest]);

  const {
    daysOverdue: calcDaysOverdue,
    numberOfOverdueInstallments: calcNumberOfOverdueInstallments,
    calculatedAccumulatedInterest: calcCalculatedAccumulatedInterest,
    daysRemainingOverdue: calcDaysRemainingOverdue,
    delayFeeAlreadyPaid: calcDelayFeeAlreadyPaid,
    pendingDelayFee: calcPendingDelayFee,
    totalDebt: calcTotalDebt,
    hasInterestDelay: calcHasInterestDelay,
    shouldShowTotalDebt: calcShouldShowTotalDebt,
    hasAnyDelay: calcHasAnyDelay,
  } = calculations;

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

  const openPaymentModal = (type: PaymentType, amount: number) => {
    setPaymentType(type);
    setPaymentAmount(amount);
    setPaymentModalVisible(true);
  };

  const handlePaymentConfirm = async (options: {
    paymentMethod: PaymentMethod;
    paymentProof?: string;
    notes?: string;
  }) => {
    setIsProcessingPayment(true);
    try {
      const paymentOptions = {
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
        notes: options.notes,
      };

      if (paymentType === "quitacao") {
        console.log("Executando markAsPaid para:", charge.id, paymentOptions);
        await markAsPaid(charge.id, paymentOptions);
        console.log("Quitação realizada com sucesso!");
        setPaymentModalVisible(false);
        navigation.goBack();
      } else if (paymentType === "juros") {
        console.log("Executando pagamento de juros para:", charge.id, paymentOptions);
        await payMonthlyInterest(charge.id, paymentOptions);
        console.log("Pagamento de juros realizado com sucesso!");
        setPaymentModalVisible(false);
        await new Promise(resolve => setTimeout(resolve, 800));
        await refreshData();
      } else if (paymentType === "taxa_atraso") {
        console.log("Pagando 1 parcela de taxa de atraso para:", charge.id, paymentOptions);
        await payDelayFee(charge.id, paymentAmount, paymentOptions);
        console.log("Taxa de atraso paga com sucesso!");
        setPaymentModalVisible(false);
        await new Promise(resolve => setTimeout(resolve, 800));
        await refreshData();
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      Alert.alert("Erro", "Erro ao processar pagamento");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleQuitacaoDivida = () => {
    const totalAmount = calculations.totalDebt > 0 ? calculations.totalDebt : charge.amount;
    openPaymentModal("quitacao", totalAmount);
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Cobrança",
      "Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Excluindo cobrança:", charge.id);
              await deleteCharge(charge.id);
              console.log("Cobrança excluída com sucesso!");
              navigation.goBack();
            } catch (error) {
              console.error("Erro ao excluir cobrança:", error);
              Alert.alert("Erro", "Erro ao excluir cobrança");
            }
          },
        },
      ]
    );
  };

  const handlePayMonthlyInterest = () => {
    const monthlyInterestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    openPaymentModal("juros", monthlyInterestPerInstallment);
  };

  const handleSendWhatsAppReminder = async () => {
    if (!client) {
      Alert.alert("Erro", "Cliente nao encontrado");
      return;
    }
    
    const isOverdue = calculations.hasInterestDelay;
    const monthlyInterest = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    
    const success = await sendPaymentReminder({
      clientName: client.name,
      clientPhone: client.phone || "",
      amount: charge.amount,
      dueDate: charge.nextInterestDueDate || charge.dueDate,
      monthlyInterest,
      accumulatedInterest: calculations.calculatedAccumulatedInterest,
      delayFee: calculations.pendingDelayFee,
      daysOverdue: calculations.daysRemainingOverdue,
      isOverdue,
    });
    
    if (success) {
      Alert.alert(
        "Lembrete Enviado",
        `O WhatsApp foi aberto com a mensagem de cobranca para ${client.name}. Envie a mensagem para concluir.`,
        [{ text: "OK" }]
      );
    }
  };

  const handlePayDelayFee = () => {
    const interestDueDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const daysOverdueLocal = Math.floor((new Date().getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const delayFeeAlreadyPaidLocal = payments
      .filter((p) => p.chargeId === charge.id && (p.notes?.includes("taxa de atraso") || p.type === "delay_fee"))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const daysPaidSoFar = (charge.dailyDelayRate || 0) > 0 ? Math.floor(delayFeeAlreadyPaidLocal / (charge.dailyDelayRate || 1)) : 0;
    const daysRemainingToPay = Math.max(0, daysOverdueLocal - daysPaidSoFar);
    
    console.log("handlePayDelayFee:", { daysOverdueLocal, delayFeeAlreadyPaidLocal, daysPaidSoFar, daysRemainingToPay, dailyRate: charge.dailyDelayRate });
    
    if (daysRemainingToPay <= 0) {
      Alert.alert("Aviso", "Nao ha taxa de atraso em aberto");
      return;
    }
    
    const daysPerInstallment = 30;
    const delayFeeInstallmentAmount = Math.min(daysPerInstallment, daysRemainingToPay) * (charge.dailyDelayRate || 0);
    
    openPaymentModal("taxa_atraso", delayFeeInstallmentAmount);
  };

  const {
    daysOverdue,
    numberOfOverdueInstallments,
    calculatedAccumulatedInterest,
    daysRemainingOverdue,
    delayFeeAlreadyPaid,
    pendingDelayFee,
    totalDebt,
    hasInterestDelay,
    shouldShowTotalDebt,
    hasAnyDelay,
  } = calculations;

  return (
    <ThemedView key={`charge-detail-${renderKey}`} style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.amount}>{formatCurrency(charge.amount)}</ThemedText>
              <ThemedText style={[styles.installmentText, { color: theme.secondaryText }]}>
                Parcela ({charge.billingType === "daily" ? "Diária" : charge.billingType === "weekly" ? "Semanal" : "Mensal"}): {formatCurrency(charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0)}
              </ThemedText>
            </View>
            <StatusBadge status={getVisualStatus(charge)} theme={theme} hasDelay={hasInterestDelay} />
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
                {charge.nextInterestDueDate ? formatDate(charge.nextInterestDueDate) : formatDate(charge.dueDate)}
              </ThemedText>
              {charge.nextInterestDueDate && (
                <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText, marginTop: Spacing.xs }]}>
                  Próx. Juros: {formatDate(charge.nextInterestDueDate)} | Original: {formatDate(charge.dueDate)}
                </ThemedText>
              )}
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
                    {formatCurrency(calculatedAccumulatedInterest)}
                  </ThemedText>
                </View>
                <View style={styles.debtItem}>
                  <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                    Parcelas em Atraso
                  </ThemedText>
                  <View>
                    <ThemedText style={[styles.debtItemValue, { color: theme.error, fontWeight: "700" }]}>
                      {numberOfOverdueInstallments}
                    </ThemedText>
                    <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText, marginTop: 2 }]}>
                      ({daysRemainingOverdue} dias)
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.debtItem}>
                  <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                    Taxa de Atraso ({daysRemainingOverdue} dias)
                  </ThemedText>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <ThemedText style={[styles.debtItemValue, { color: delayFeeAlreadyPaid > 0 ? theme.success : theme.error, textDecorationLine: delayFeeAlreadyPaid > 0 ? "line-through" : "none" }]}>
                      {formatCurrency(pendingDelayFee)}
                    </ThemedText>
                  </View>
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
                  {(() => {
                    const interestPayments = charge.interestInstallmentsPaid || payments.filter((p) => p.chargeId === charge.id && (p.type === "interest" || p.notes?.toLowerCase().includes("juros"))).length;
                    return interestPayments > 0 ? `${interestPayments} parcela${interestPayments > 1 ? 's' : ''}` : "0 parcelas";
                  })()}
                </ThemedText>
                {charge.nextInterestDueDate ? (() => {
                  const nextDueDate = new Date(charge.nextInterestDueDate);
                  const lastPaidDate = new Date(nextDueDate);
                  lastPaidDate.setMonth(lastPaidDate.getMonth() - 1);
                  return (
                    <ThemedText style={[styles.infoLabel, { color: theme.tertiaryText, marginTop: Spacing.xs }]}>
                      Última Parcela: {formatDate(lastPaidDate.toISOString())}
                    </ThemedText>
                  );
                })() : null}
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

          {/* Taxas de Atraso Pagas */}
          {payments.filter((p) => p.chargeId === charge.id && (p.notes?.includes("taxa de atraso") || p.type === "delay_fee")).length > 0 ? (
            <View
              style={[
                styles.interestCard,
                { 
                  backgroundColor: theme.success + "15",
                  borderColor: theme.success,
                },
              ]}
            >
              <View style={styles.debtHeader}>
                <Feather name="check-circle" size={20} color={theme.success} />
                <ThemedText style={[styles.debtTitle, { color: theme.success }]}>
                  Taxas de Atraso Pagas
                </ThemedText>
              </View>
              {payments
                .filter((p) => p.chargeId === charge.id && (p.notes?.includes("taxa de atraso") || p.type === "delay_fee"))
                .map((payment) => (
                  <View key={payment.id} style={styles.debtBreakdown}>
                    <View style={styles.debtItem}>
                      <ThemedText style={[styles.debtItemLabel, { color: theme.secondaryText }]}>
                        {formatDate(payment.paidAt)}
                      </ThemedText>
                      <ThemedText style={[styles.debtItemValue, { color: theme.success }]}>
                        {formatCurrency(payment.amount)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
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
              onPress={handleQuitacaoDivida}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Quitação de Dívida</ThemedText>
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
            { borderColor: "#FF922B", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handlePayDelayFee}
        >
          <Feather name="alert-circle" size={18} color="#FF922B" />
          <ThemedText style={[styles.secondaryButtonText, { color: "#FF922B" }]}>
            Pagar Taxa de Atraso
          </ThemedText>
        </Pressable>

        {charge.status !== "paid" ? (
          <Pressable
            style={({ pressed }) => [
              styles.whatsappButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleSendWhatsAppReminder}
          >
            <Feather name="message-circle" size={18} color="#fff" />
            <ThemedText style={styles.whatsappButtonText}>
              Enviar Lembrete via WhatsApp
            </ThemedText>
          </Pressable>
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

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={handlePaymentConfirm}
        title={
          paymentType === "quitacao"
            ? "Quitação de Dívida"
            : paymentType === "juros"
            ? "Pagamento de Juros"
            : "Pagamento de Taxa de Atraso"
        }
        amount={paymentAmount}
        theme={theme}
        isLoading={isProcessingPayment}
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
  installmentText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: Spacing.xs,
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
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#25D366",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  whatsappButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  interestCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
