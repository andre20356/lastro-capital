import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, SectionList } from "react-native";
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
import { Payment } from "@/types";

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

function getMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getPaymentType(payment: Payment): { label: string; icon: string; description: string } {
  if (payment.type === "interest" || payment.notes?.toLowerCase().includes("juros")) {
    return { label: "Juros", icon: "percent", description: "Pagamento de juros" };
  }
  if (payment.type === "delay_fee" || payment.notes?.toLowerCase().includes("taxa de atraso") || payment.notes?.toLowerCase().includes("atraso")) {
    return { label: "Taxa de Atraso", icon: "alert-circle", description: "Pagamento de taxa de atraso" };
  }
  if (payment.type === "principal" || payment.notes?.includes("Quitacao") || payment.notes?.includes("Quitação") || payment.notes?.toLowerCase().includes("divida")) {
    return { label: "Quitacao", icon: "check-circle", description: "Pagamento completo" };
  }
  return { label: "Pagamento", icon: "check", description: "Pagamento registrado" };
}

function getPaymentMethodLabel(method?: string): { label: string; icon: string; color: string } {
  if (method === "pix") {
    return { label: "PIX", icon: "smartphone", color: "#00B2FF" };
  }
  if (method === "dinheiro") {
    return { label: "Dinheiro", icon: "dollar-sign", color: "#4CAF50" };
  }
  return { label: "Outro", icon: "credit-card", color: "#FFB400" };
}

interface PaymentSection {
  title: string;
  data: Payment[];
  total: number;
}

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { tabBarHeight } = useScreenInsets();
  const { payments, getClientById, getChargeById } = useData();

  const sections = useMemo(() => {
    const grouped = payments.reduce((acc, payment) => {
      // Para juros e taxa de atraso, usar dueDate (data de vencimento). Senão, usar paidAt
      const referenceDate = payment.dueDate ? payment.dueDate : payment.paidAt;
      const monthYear = getMonthYear(referenceDate);
      if (!acc[monthYear]) {
        acc[monthYear] = { payments: [], total: 0 };
      }
      acc[monthYear].payments.push(payment);
      acc[monthYear].total += payment.amount;
      return acc;
    }, {} as Record<string, { payments: Payment[]; total: number }>);

    return Object.entries(grouped)
      .map(([title, { payments, total }]) => ({
        title,
        data: payments.sort(
          (a, b) => {
            const dateA = new Date(a.dueDate ? a.dueDate : a.paidAt);
            const dateB = new Date(b.dueDate ? b.dueDate : b.paidAt);
            return dateB.getTime() - dateA.getTime();
          }
        ),
        total,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.data[0]?.dueDate ? a.data[0].dueDate : a.data[0]?.paidAt || 0);
        const dateB = new Date(b.data[0]?.dueDate ? b.data[0].dueDate : b.data[0]?.paidAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [payments]);

  const renderItem = ({ item }: { item: Payment }) => {
    const client = getClientById(item.clientId);
    const charge = getChargeById(item.chargeId);
    const paymentType = getPaymentType(item);
    const paymentMethod = getPaymentMethodLabel(item.paymentMethod);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.paymentCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.navigate("ChargeDetail", { chargeId: item.chargeId })}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
          <Feather name={paymentType.icon as any} size={18} color={theme.success} />
        </View>
        
        <View style={styles.paymentInfo}>
          <ThemedText style={styles.clientName}>
            {client?.name || "Cliente removido"}
          </ThemedText>
          <View style={styles.paymentMeta}>
            <ThemedText style={[styles.paymentDate, { color: theme.secondaryText }]}>
              {item.dueDate ? `Venc: ${formatDate(item.dueDate)}` : formatDate(item.paidAt)}
            </ThemedText>
            <View style={styles.typeBadge}>
              <ThemedText style={[styles.typeBadgeText, { color: theme.success }]}>
                {paymentType.label}
              </ThemedText>
            </View>
          </View>
          {item.paymentMethod ? (
            <View style={styles.methodRow}>
              <View style={[styles.methodBadge, { backgroundColor: paymentMethod.color + "20" }]}>
                <Feather name={paymentMethod.icon as any} size={12} color={paymentMethod.color} />
                <ThemedText style={[styles.methodText, { color: paymentMethod.color }]}>
                  {paymentMethod.label}
                </ThemedText>
              </View>
              {item.paymentProof ? (
                <View style={[styles.proofBadge, { backgroundColor: theme.primaryAccent + "20" }]}>
                  <Feather name="image" size={12} color={theme.primaryAccent} />
                  <ThemedText style={[styles.proofText, { color: theme.primaryAccent }]}>
                    Comprovante
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        
        <ThemedText style={[styles.amount, { color: theme.success }]}>
          +{formatCurrency(item.amount)}
        </ThemedText>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: PaymentSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
        {section.title.charAt(0).toUpperCase() + section.title.slice(1)}
      </ThemedText>
      <ThemedText style={[styles.sectionTotal, { color: theme.success }]}>
        {formatCurrency(section.total)}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="clock" size={48} color={theme.tertiaryText} />
            <ThemedText style={[styles.emptyTitle, { color: theme.secondaryText }]}>
              Nenhum pagamento
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.tertiaryText }]}>
              Quando voce marcar uma cobrança como paga, ela aparecera aqui
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTotal: {
    fontSize: 15,
    fontWeight: "600",
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
  },
  paymentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: Spacing.sm,
  },
  paymentDate: {
    fontSize: 13,
  },
  typeBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: Spacing.sm,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  methodText: {
    fontSize: 11,
    fontWeight: "600",
  },
  proofBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  proofText: {
    fontSize: 11,
    fontWeight: "600",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
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
});
