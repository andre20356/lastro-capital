import React, { useState, useRef } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator, Platform, Dimensions } from "react-native";
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
import { createSubscriptionCheckout, cancelSubscription, startFreeTrial, PlanType } from "@/services/stripeApi";

const PRO_BENEFITS = [
  "Gestao ilimitada de clientes",
  "Cobranças e emprestimos sem limite",
  "Controle de juros e taxas",
  "Dashboard e relatorios",
  "Pagamentos via Stripe",
  "Suporte padrao",
];

const PREMIUM_BENEFITS = [
  "Tudo do Plano Pro",
  "Relatorios avançados exclusivos",
  "Lembretes automaticos via WhatsApp",
  "Suporte prioritario",
  "Exportação de dados",
  "Acesso antecipado a novidades",
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getPlanLabel(plan: string | null): string {
  if (plan === "premium") return "Premium";
  if (plan === "pro") return "Pro";
  if (plan === "free") return "Teste Gratis";
  return "Desconhecido";
}

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { subscriptionData, isActive, currentPlan, checkSubscription } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSelectPlan = async (plan: PlanType) => {
    if (!user?.email) {
      Alert.alert("Erro", "Voce precisa estar logado para assinar");
      return;
    }

    setLoadingPlan(plan);
    try {
      if (plan === "free") {
        await startFreeTrial({ email: user.email, userId: user.id });
        await checkSubscription();
        return;
      }

      const result = await createSubscriptionCheckout({
        email: user.email,
        userId: user.id,
        plan,
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
      setLoadingPlan(null);
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
    setIsRefreshing(true);
    await checkSubscription();
    setIsRefreshing(false);
  };

  if (isActive) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={{ backgroundColor: theme.backgroundRoot }}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
        >
          <View style={[styles.activeCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.success }]}>
            <View style={styles.activeHeader}>
              <View style={[styles.activeIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="check-circle" size={32} color={theme.success} />
              </View>
              <ThemedText style={[styles.activeTitle, { color: theme.success }]}>
                Plano {getPlanLabel(currentPlan)} Ativo
              </ThemedText>
              {subscriptionData?.status === "trialing" ? (
                <View style={[styles.badge, { backgroundColor: "#635BFF20" }]}>
                  <ThemedText style={[styles.badgeText, { color: "#635BFF" }]}>
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
                {currentPlan === "premium" ? "R$ 99,90" : "R$ 49,90"}
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
              styles.secondaryButton,
              { borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.secondaryText} />
            ) : (
              <Feather name="refresh-cw" size={16} color={theme.secondaryText} />
            )}
            <ThemedText style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>
              Atualizar Status
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.heroSection}>
          <ThemedText style={[styles.pageTitle, { color: theme.text }]}>
            Escolha seu Plano
          </ThemedText>
          <ThemedText style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            Comece gratis por 7 dias sem precisar de cartao, ou assine um plano pago
          </ThemedText>
        </View>

        <View style={[styles.planCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder }]}>
          <View style={[styles.planCardHeader, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="gift" size={24} color={theme.success} />
            <ThemedText style={[styles.planCardName, { color: theme.text }]}>
              Comece Gratis
            </ThemedText>
          </View>
          <View style={styles.planCardBody}>
            <View style={styles.planPriceRow}>
              <ThemedText style={[styles.planPriceMain, { color: theme.success }]}>
                R$ 0
              </ThemedText>
              <ThemedText style={[styles.planPricePeriod, { color: theme.secondaryText }]}>
                por 7 dias
              </ThemedText>
            </View>
            <ThemedText style={[styles.planPriceNote, { color: theme.tertiaryText }]}>
              Sem cartao de credito necessario para comecar
            </ThemedText>
            <View style={styles.planBenefits}>
              {PRO_BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.benefitCheck, { backgroundColor: theme.success + "15" }]}>
                    <Feather name="check" size={12} color={theme.success} />
                  </View>
                  <ThemedText style={[styles.benefitText, { color: theme.secondaryText }]}>{b}</ThemedText>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.planButton,
                { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => handleSelectPlan("free")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "free" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="play" size={18} color="#fff" />
              )}
              <ThemedText style={styles.planButtonText}>
                {loadingPlan === "free" ? "Abrindo..." : "Comecar Agora"}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.planCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder }]}>
          <View style={[styles.planCardHeader, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="zap" size={24} color="#635BFF" />
            <ThemedText style={[styles.planCardName, { color: theme.text }]}>
              Plano Pro
            </ThemedText>
          </View>
          <View style={styles.planCardBody}>
            <View style={styles.planPriceRow}>
              <ThemedText style={[styles.planPriceCurrency, { color: "#635BFF" }]}>R$</ThemedText>
              <ThemedText style={[styles.planPriceMain, { color: theme.text }]}>
                49,90
              </ThemedText>
              <ThemedText style={[styles.planPricePeriod, { color: theme.secondaryText }]}>
                /mes
              </ThemedText>
            </View>
            <View style={styles.planBenefits}>
              {PRO_BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.benefitCheck, { backgroundColor: "#635BFF" + "15" }]}>
                    <Feather name="check" size={12} color="#635BFF" />
                  </View>
                  <ThemedText style={[styles.benefitText, { color: theme.secondaryText }]}>{b}</ThemedText>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.planButton,
                { backgroundColor: "#635BFF", opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => handleSelectPlan("pro")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "pro" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="credit-card" size={18} color="#fff" />
              )}
              <ThemedText style={styles.planButtonText}>
                {loadingPlan === "pro" ? "Abrindo..." : "Assinar Plano Pro"}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.planCard, styles.featuredCard, { backgroundColor: theme.backgroundDefault, borderColor: "#FF6B00" }]}>
          <View style={[styles.featuredBadge, { backgroundColor: "#FF6B00" }]}>
            <Feather name="star" size={12} color="#fff" />
            <ThemedText style={styles.featuredBadgeText}>MAIS POPULAR</ThemedText>
          </View>
          <View style={[styles.planCardHeader, { backgroundColor: "#FF6B00" + "10" }]}>
            <Feather name="award" size={24} color="#FF6B00" />
            <ThemedText style={[styles.planCardName, { color: theme.text }]}>
              Plano Premium
            </ThemedText>
          </View>
          <View style={styles.planCardBody}>
            <View style={styles.planPriceRow}>
              <ThemedText style={[styles.planPriceCurrency, { color: "#FF6B00" }]}>R$</ThemedText>
              <ThemedText style={[styles.planPriceMain, { color: theme.text }]}>
                99,90
              </ThemedText>
              <ThemedText style={[styles.planPricePeriod, { color: theme.secondaryText }]}>
                /mes
              </ThemedText>
            </View>
            <View style={styles.planBenefits}>
              {PREMIUM_BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.benefitCheck, { backgroundColor: "#FF6B00" + "15" }]}>
                    <Feather name="check" size={12} color="#FF6B00" />
                  </View>
                  <ThemedText style={[styles.benefitText, { color: theme.secondaryText }]}>{b}</ThemedText>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.planButton,
                { backgroundColor: "#FF6B00", opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => handleSelectPlan("premium")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "premium" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="award" size={18} color="#fff" />
              )}
              <ThemedText style={styles.planButtonText}>
                {loadingPlan === "premium" ? "Abrindo..." : "Assinar Plano Premium"}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {subscriptionData?.status === "past_due" || subscriptionData?.status === "canceled" ? (
          <View style={[styles.blockedNotice, { backgroundColor: theme.error + "15", borderColor: theme.error }]}>
            <Feather name="alert-circle" size={20} color={theme.error} />
            <ThemedText style={[styles.blockedText, { color: theme.error }]}>
              {subscriptionData.status === "past_due"
                ? "Seu pagamento falhou. Escolha um plano para continuar usando."
                : "Sua assinatura foi cancelada. Escolha um plano para ter acesso."}
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1, marginTop: Spacing.lg },
          ]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.secondaryText} />
          ) : (
            <Feather name="refresh-cw" size={16} color={theme.secondaryText} />
          )}
          <ThemedText style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>
            Ja assinei - Atualizar Status
          </ThemedText>
        </Pressable>

        <ThemedText style={[styles.disclaimer, { color: theme.tertiaryText }]}>
          Cancele a qualquer momento. Sem compromisso.
        </ThemedText>

        <Pressable
          style={({ pressed }) => [styles.logoutRow, { opacity: pressed ? 0.8 : 1 }]}
          onPress={signOut}
        >
          <Feather name="log-out" size={16} color={theme.tertiaryText} />
          <ThemedText style={[styles.logoutText, { color: theme.tertiaryText }]}>
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
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  featuredCard: {
    borderWidth: 2,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 6,
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: "700",
  },
  planCardBody: {
    padding: Spacing.lg,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  planPriceCurrency: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  planPriceMain: {
    fontSize: 36,
    fontWeight: "700",
  },
  planPricePeriod: {
    fontSize: 14,
    marginLeft: 4,
  },
  planPriceNote: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  planBenefits: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  planButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    fontSize: 14,
  },
  activeCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
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
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
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
});
