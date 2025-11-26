import React, { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ScrollView, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/contexts/DataContext";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChargeForm">;
type RouteType = RouteProp<RootStackParamList, "ChargeForm">;

export default function ChargeFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { clients, addCharge, updateCharge } = useData();

  const existingCharge = route.params?.charge;
  const preselectedClientId = route.params?.clientId;
  const isEditing = !!existingCharge;

  const [clientId, setClientId] = useState(existingCharge?.clientId || preselectedClientId || "");
  const [amount, setAmount] = useState(existingCharge?.amount.toString() || "");
  const [dueDate, setDueDate] = useState(
    existingCharge?.dueDate
      ? new Date(existingCharge.dueDate).toLocaleDateString("pt-BR")
      : ""
  );
  const [description, setDescription] = useState(existingCharge?.description || "");
  const [loanPercentage, setLoanPercentage] = useState(existingCharge?.loanPercentage?.toString() || "");
  const [dailyDelayRate, setDailyDelayRate] = useState(existingCharge?.dailyDelayRate?.toString() || "");
  const [showClientPicker, setShowClientPicker] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) return null;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const handleSave = async () => {
    if (!clientId) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }

    const amountNum = parseFloat(amount.replace(",", "."));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Erro", "Digite um valor valido");
      return;
    }

    const parsedDate = parseDate(dueDate);
    if (!parsedDate) {
      Alert.alert("Erro", "Digite uma data valida (DD/MM/AAAA)");
      return;
    }

    try {
      const chargeData = {
        clientId,
        amount: amountNum,
        dueDate: parsedDate.toISOString(),
        description,
        loanPercentage: loanPercentage ? parseFloat(loanPercentage.replace(",", ".")) : undefined,
        dailyDelayRate: dailyDelayRate ? parseFloat(dailyDelayRate.replace(",", ".")) : undefined,
      };

      if (isEditing && existingCharge) {
        await updateCharge(existingCharge.id, chargeData);
      } else {
        await addCharge({
          ...chargeData,
          status: "pending" as ChargeStatus,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel salvar a cobrança");
    }
  };

  const formatDateInput = (text: string) => {
    const numbers = text.replace(/\D/g, "");
    let formatted = "";
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += "/" + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += "/" + numbers.substring(4, 8);
    }
    return formatted;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Cliente *
          </ThemedText>
          <Pressable
            style={[
              styles.picker,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
            ]}
            onPress={() => setShowClientPicker(!showClientPicker)}
          >
            <ThemedText
              style={[
                styles.pickerText,
                { color: selectedClient ? theme.text : theme.tertiaryText },
              ]}
            >
              {selectedClient?.name || "Selecione um cliente"}
            </ThemedText>
            <Feather
              name={showClientPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.tertiaryText}
            />
          </Pressable>
          
          {showClientPicker ? (
            <View
              style={[
                styles.pickerOptions,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
              ]}
            >
              {clients.length === 0 ? (
                <Pressable
                  style={styles.pickerOption}
                  onPress={() => {
                    setShowClientPicker(false);
                    navigation.navigate("ClientForm", {});
                  }}
                >
                  <Feather name="plus" size={16} color={theme.primaryAccent} />
                  <ThemedText style={{ color: theme.primaryAccent, marginLeft: Spacing.sm }}>
                    Adicionar novo cliente
                  </ThemedText>
                </Pressable>
              ) : (
                <>
                  {clients.map((client) => (
                    <Pressable
                      key={client.id}
                      style={[
                        styles.pickerOption,
                        clientId === client.id && { backgroundColor: theme.primaryAccent + "10" },
                      ]}
                      onPress={() => {
                        setClientId(client.id);
                        setShowClientPicker(false);
                      }}
                    >
                      <ThemedText>{client.name}</ThemedText>
                      {clientId === client.id ? (
                        <Feather name="check" size={16} color={theme.primaryAccent} />
                      ) : null}
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.pickerOption, { borderTopWidth: 1, borderTopColor: theme.inputBorder }]}
                    onPress={() => {
                      setShowClientPicker(false);
                      navigation.navigate("ClientForm", {});
                    }}
                  >
                    <Feather name="plus" size={16} color={theme.primaryAccent} />
                    <ThemedText style={{ color: theme.primaryAccent, marginLeft: Spacing.sm }}>
                      Adicionar novo cliente
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Valor (R$) *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="0,00"
            placeholderTextColor={theme.tertiaryText}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Data de vencimento *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={theme.tertiaryText}
            value={dueDate}
            onChangeText={(text) => setDueDate(formatDateInput(text))}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Descrição (opcional)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="Descreva a cobrança..."
            placeholderTextColor={theme.tertiaryText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Porcentagem de Empréstimo (%) (opcional)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="0,00"
            placeholderTextColor={theme.tertiaryText}
            value={loanPercentage}
            onChangeText={setLoanPercentage}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Taxa de Atraso Diário (%) (opcional)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="0,00"
            placeholderTextColor={theme.tertiaryText}
            value={dailyDelayRate}
            onChangeText={setDailyDelayRate}
            keyboardType="decimal-pad"
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
            {isEditing ? "Salvar Alterações" : "Criar Cobrança"}
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
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerOptions: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.xs,
    borderBottomRightRadius: BorderRadius.xs,
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
