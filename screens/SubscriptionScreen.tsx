import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { createSubscriptionCheckout, cancelSubscription } from "@/services/stripeApi";

const PLAN_BENEFITS = [
  { icon: "users" as const, text: "Gestao ilimitada de clientes" },
  { icon: "file-text" as const, text: "Cobranças e empréstimos sem limite" },
  { icon: "dollar-sign" as const, text: "Controle completo de juros e taxas" },
  { icon: "bar-chart-2" as const, text: "Relatorios e dashboards avançados" },
  { icon: "message-circle" as const, text: "Lembretes via WhatsApp" },
  { icon: "credit-card" as const, text: "Pagamentos via Stripe" },
  { icon: "shield" as const, text: "Dados seguros e criptografados" },
  { icon: "smartphone" as const, text: "Acesso em qualquer dispositivo" },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { subscriptionData, isActive, checkSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleStartTrial = async () => {
    if (!user?.email) {
      Alert.alert("Erro", "Voce precisa estar logado para assinar");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSubscriptionCheckout({
        email: user.email,
        userId: user.id,
      });

      if (result.url) {
        if (Platform.OS === "web") {
          Linking.openURL(result.url);
        } else {
          await WebBrowser.openBrowserAsync(result.url);
        }
        setTimeout(() => checkSubscription(), 3000);
      }
    } catch (error: any) {
      Alert.alert("Erro", "Nao foi possivel iniciar a assinatura. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!subscriptionData?.subscriptionId) return;

    Alert.alert(
      "Cancelar Assinatura",
      "Tem certeza que deseja cancelar? Voce ainda tera acesso ate o final do periodo pago.",
      [
        { text: "Manter Assinatura", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              const result = await cancelSubscription(subscriptionData.subscriptionId!);
              Alert.alert(
                "Assinatura Cancelada",
                `Sua assinatura foi cancelada. Voce tera acesso ate ${formatDate(result.currentPeriodEnd)}.`
              );
              await checkSubscription();
            } catch (error: any) {
              Alert.alert("Erro", "Nao foi possivel cancelar a assinatura.");
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await checkSubscription();
    setIsLoading(false);
  };

  if (isActive) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={{ backgroundColor: theme.backgroundRoot }} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={[styles.activeCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.success }]}>
            <View style={styles.activeHeader}>
              <View style={[styles.activeIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="check-circle" size={32} color={theme.success} />
              </View>
              <ThemedText style={[styles.activeTitle, { color: theme.success }]}>
                Plano Premium Ativo
              </ThemedText>
              {subscriptionData?.status === "trialing" ? (
                <View style={[styles.trialBadge, { backgroundColor: "#635BFF" + "20" }]}>
                  <ThemedText style={[styles.trialBadgeText, { color: "#635BFF" }]}>
                    Periodo de Teste
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.statusDetails}>
              {subscriptionData?.status === "trialing" && subscriptionData?.trialEnd ? (
                <View style={styles.statusRow}>
                  <Feather name="clock" size={16} color={theme.secondaryText} />
                  <ThemedText style={[styles.statusText, { color: theme.secondaryText }]}>
                    Teste gratuito ate {formatDate(subscriptionData.trialEnd)}
                  </ThemedText>
                </View>
              ) : null}
              {subscriptionData?.currentPeriodEnd ? (
                <View style={styles.statusRow}>
                  <Feather name="calendar" size={16} color={theme.secondaryText} />
                  <ThemedText style={[styles.statusText, { color: theme.secondaryText }]}>
                    Proximo pagamento: {formatDate(subscriptionData.currentPeriodEnd)}
                  </ThemedText>
                </View>
              ) : null}
              {subscriptionData?.cancelAtPeriodEnd ? (
                <View style={[styles.cancelNotice, { backgroundColor: theme.warning + "15" }]}>
                  <Feather name="alert-triangle" size={16} color={theme.warning} />
                  <ThemedText style={[styles.cancelNoticeText, { color: theme.warning }]}>
                    Cancelamento agendado. Acesso ate {subscriptionData.currentPeriodEnd ? formatDate(subscriptionData.currentPeriodEnd) : "o fim do periodo"}.
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={[styles.priceRow, { borderTopColor: theme.cardBorder }]}>
              <ThemedText style={[styles.priceLabel, { color: theme.secondaryText }]}>
                Valor mensal
              </ThemedText>
              <ThemedText style={[styles.priceValue, { color: theme.text }]}>
                R$ 97,00
              </ThemedText>
            </View>
          </View>

          {!subscriptionData?.cancelAtPeriodEnd ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                { borderColor: theme.error, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <Feather name="x-circle" size={18} color={theme.error} />
              )}
              <ThemedText style={[styles.cancelButtonText, { color: theme.error }]}>
                {isCancelling ? "Cancelando..." : "Cancelar Assinatura"}
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              { borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleRefresh}
          >
            <Feather name="refresh-cw" size={16} color={theme.secondaryText} />
            <ThemedText style={[styles.refreshButtonText, { color: theme.secondaryText }]}>
              Atualizar Status
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ backgroundColor: theme.backgroundRoot }} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.heroSection}>
          <View style={[styles.planIcon, { backgroundColor: "#635BFF" + "15" }]}>
            <Feather name="award" size={40} color="#635BFF" />
          </View>
          <ThemedText style={[styles.planName, { color: theme.text }]}>
            Plano Premium
          </ThemedText>
          <ThemedText style={[styles.planSubtitle, { color: theme.secondaryText }]}>
            Tudo o que voce precisa para gerenciar suas cobranças
          </ThemedText>
        </View>

        <View style={[styles.priceCard, { backgroundColor: theme.backgroundDefault, borderColor: "#635BFF" }]}>
          <View style={styles.priceContainer}>
            <ThemedText style={[styles.currencySymbol, { color: "#635BFF" }]}>R$</ThemedText>
            <ThemedText style={[styles.priceAmount, { color: theme.text }]}>97</ThemedText>
            <ThemedText style={[styles.pricePeriod, { color: theme.secondaryText }]}>/mes</ThemedText>
          </View>
          <View style={[styles.trialHighlight, { backgroundColor: theme.success + "15" }]}>
            <Feather name="gift" size={16} color={theme.success} />
            <ThemedText style={[styles.trialText, { color: theme.success }]}>
              7 dias gratis para voce testar
            </ThemedText>
          </View>
          <ThemedText style={[styles.trialDetail, { color: theme.tertiaryText }]}>
            Nenhuma cobranca durante o periodo de teste
          </ThemedText>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder }]}>
          <ThemedText style={[styles.benefitsTitle, { color: theme.text }]}>
            O que esta incluso
          </ThemedText>
          {PLAN_BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.success + "15" }]}>
                <Feather name="check" size={14} color={theme.success} />
              </View>
              <ThemedText style={[styles.benefitText, { color: theme.secondaryText }]}>
                {benefit.text}
              </ThemedText>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleStartTrial}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="zap" size={20} color="#fff" />
          )}
          <ThemedText style={styles.ctaButtonText}>
            {isLoading ? "Abrindo..." : "Comecar Teste Gratis"}
          </ThemedText>
        </Pressable>

        <ThemedText style={[styles.disclaimer, { color: theme.tertiaryText }]}>
          Cancele a qualquer momento. Sem compromisso.
        </ThemedText>

        {subscriptionData?.status === "past_due" || subscriptionData?.status === "canceled" ? (
          <View style={[styles.blockedNotice, { backgroundColor: theme.error + "15", borderColor: theme.error }]}>
            <Feather name="alert-circle" size={20} color={theme.error} />
            <ThemedText style={[styles.blockedText, { color: theme.error }]}>
              {subscriptionData.status === "past_due"
                ? "Seu pagamento falhou. Assine novamente para continuar usando."
                : "Sua assinatura foi cancelada. Assine novamente para ter acesso."}
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            { borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1, marginTop: Spacing.md },
          ]}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={16} color={theme.secondaryText} />
          <ThemedText style={[styles.refreshButtonText, { color: theme.secondaryText }]}>
            Ja assinei - Atualizar Status
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={signOut}
        >
          <Feather name="log-out" size={16} color={theme.tertiaryText} />
          <ThemedText style={[styles.logoutButtonText, { color: theme.tertiaryText }]}>
            Sair da conta
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  planIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  planName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  planSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  priceCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    marginRight: 4,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: "700",
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  trialHighlight: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trialText: {
    fontSize: 14,
    fontWeight: "600",
  },
  trialDetail: {
    fontSize: 12,
    textAlign: "center",
  },
  benefitsCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#635BFF",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  blockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  blockedText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  activeCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  activeHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  activeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  activeTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  trialBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  trialBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusDetails: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
  },
  cancelNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelNoticeText: {
    fontSize: 13,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  refreshButtonText: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    fontSize: 14,
  },
});
