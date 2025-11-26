import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList, Investment } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const INVESTMENTS: Investment[] = [
  { id: "1", title: "Investimento A", subtitle: "Rendimento 8% a.a." },
  { id: "2", title: "Investimento B", subtitle: "Rendimento 10% a.a." },
  { id: "3", title: "Investimento C", subtitle: "Rendimento 12% a.a." },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ThemedText type="h1">Bem-vindo à Lastro Capital</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.secondaryText }]}>
        Selecione um investimento:
      </ThemedText>
    </View>
  );

  const renderItem = ({ item }: { item: Investment }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.cardBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => navigation.navigate("Details", { item })}
    >
      <ThemedText type="cardTitle">{item.title}</ThemedText>
      <ThemedText style={[styles.cardSubtitle, { color: theme.tertiaryText }]}>
        {item.subtitle}
      </ThemedText>
      <View style={styles.iconContainer}>
        <Feather name="chevron-right" size={20} color={theme.tertiaryText} />
      </View>
    </Pressable>
  );

  return (
    <ScreenFlatList
      data={INVESTMENTS}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    position: "relative",
  },
  cardSubtitle: {
    marginTop: 6,
  },
  iconContainer: {
    position: "absolute",
    right: Spacing.md,
    top: "50%",
    marginTop: -10,
  },
});
