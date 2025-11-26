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
      const monthYear = getMonthYear(payment.paidAt);
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
          (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
        ),
        total,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.data[0]?.paidAt || 0);
        const dateB = new Date(b.data[0]?.paidAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [payments]);

  const renderItem = ({ item }: { item: Payment }) => {
    const client = getClientById(item.clientId);
    const charge = getChargeById(item.chargeId);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.paymentCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.navigate("ChargeDetail", { chargeId: item.chargeId })}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
          <Feather name="check" size={18} color={theme.success} />
        </View>
        
        <View style={styles.paymentInfo}>
          <ThemedText style={styles.clientName}>
            {client?.name || "Cliente removido"}
          </ThemedText>
          <ThemedText style={[styles.paymentDate, { color: theme.secondaryText }]}>
            {formatDate(item.paidAt)}
          </ThemedText>
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
  paymentDate: {
    fontSize: 13,
    marginTop: 2,
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
