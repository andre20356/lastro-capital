import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientForm">;
type RouteType = RouteProp<RootStackParamList, "ClientForm">;

export default function ClientFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { addClient, updateClient } = useData();

  const existingClient = route.params?.client;
  const isEditing = !!existingClient;

  const [name, setName] = useState(existingClient?.name || "");
  const [phone, setPhone] = useState(existingClient?.phone || "");
  const [email, setEmail] = useState(existingClient?.email || "");
  const [notes, setNotes] = useState(existingClient?.notes || "");

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) {
      formatted = "(" + numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += ") " + numbers.substring(2, 7);
    }
    if (numbers.length > 7) {
      formatted += "-" + numbers.substring(7, 11);
    }
    return formatted;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Digite o nome do cliente");
      return;
    }

    try {
      if (isEditing && existingClient) {
        await updateClient(existingClient.id, {
          name: name.trim(),
          phone,
          email: email.trim(),
          notes: notes.trim(),
        });
      } else {
        await addClient({
          name: name.trim(),
          phone,
          email: email.trim(),
          notes: notes.trim(),
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel salvar o cliente");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Nome *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="Nome do cliente"
            placeholderTextColor={theme.tertiaryText}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Telefone
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="(00) 00000-0000"
            placeholderTextColor={theme.tertiaryText}
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            E-mail
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="email@exemplo.com"
            placeholderTextColor={theme.tertiaryText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Observações
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="Anotações sobre o cliente..."
            placeholderTextColor={theme.tertiaryText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>
            {isEditing ? "Salvar Alterações" : "Adicionar Cliente"}
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
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  saveButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
