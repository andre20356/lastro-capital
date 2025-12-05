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
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { RootStackParamList } from "@/navigation/MainTabNavigator";
import { ChargeStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChargeForm">;
type RouteType = RouteProp<RootStackParamList, "ChargeForm">;

export default function ChargeFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { clients, addCharge, updateCharge } = useData();
  const { sendLoanApprovalNotification } = useWhatsApp();

  const existingCharge = route.params?.charge;
  const preselectedClientId = route.params?.clientId;
  const isEditing = !!existingCharge;

  // Calculate default due date: today + 1 month
  const getDefaultDueDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return nextMonth.toLocaleDateString("pt-BR");
  };

  const [clientId, setClientId] = useState(existingCharge?.clientId || preselectedClientId || "");
  const [amount, setAmount] = useState(existingCharge?.amount.toString() || "");
  const [dueDate, setDueDate] = useState(
    existingCharge?.dueDate
      ? new Date(existingCharge.dueDate).toLocaleDateString("pt-BR")
      : getDefaultDueDate()
  );
  const [paymentDate, setPaymentDate] = useState("");
  const [description, setDescription] = useState(existingCharge?.description || "");
  const [loanPercentage, setLoanPercentage] = useState(existingCharge?.loanPercentage?.toString() || "");
  const [dailyDelayRate, setDailyDelayRate] = useState(existingCharge?.dailyDelayRate?.toString() || "");
  const [showClientPicker, setShowClientPicker] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  // Auto-fill fields when client is selected
  useEffect(() => {
    if (selectedClient && clientId && !isEditing) {
      // Preencher valor solicitado
      if (selectedClient.requestedAmount) {
        setAmount(selectedClient.requestedAmount.toString());
      }

      // Calcular data de vencimento (data de solicitação + 1 mês)
      if (selectedClient.requestDate) {
        const requestDateObj = new Date(selectedClient.requestDate);
        const dueDateObj = new Date(requestDateObj.getFullYear(), requestDateObj.getMonth() + 1, requestDateObj.getDate());
        const formattedDueDate = dueDateObj.toLocaleDateString("pt-BR");
        setDueDate(formattedDueDate);
      }

      // Preencher percentuais
      if (selectedClient.loanPercentage) {
        setLoanPercentage(selectedClient.loanPercentage.toString());
      }
      if (selectedClient.dailyDelayRate) {
        setDailyDelayRate(selectedClient.dailyDelayRate.toString());
      }

      // Preencher descrição do cliente
      if (selectedClient.notes) {
        setDescription(selectedClient.notes);
      }
    }
  }, [selectedClient, clientId, isEditing]);

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
      const loanPercentageNum = loanPercentage ? parseFloat(loanPercentage.replace(",", ".")) : undefined;
      
      const chargeData = {
        clientId,
        amount: amountNum,
        dueDate: parsedDate.toISOString(),
        description,
        loanPercentage: loanPercentageNum,
        dailyDelayRate: dailyDelayRate ? parseFloat(dailyDelayRate.replace(",", ".")) : undefined,
      };

      if (isEditing && existingCharge) {
        await updateCharge(existingCharge.id, chargeData);
        navigation.goBack();
      } else {
        await addCharge({
          ...chargeData,
          status: "pending" as ChargeStatus,
        });
        
        if (selectedClient && selectedClient.phone) {
          sendLoanApprovalNotification({
            clientName: selectedClient.name,
            clientPhone: selectedClient.phone,
            amount: amountNum,
            dueDate: parsedDate.toISOString(),
            loanPercentage: loanPercentageNum,
          });
        }
        
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel salvar a cobranca");
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
        <Pressable
          style={({ pressed }) => [
            styles.addClientButton,
            { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate("ClientForm", {})}
        >
          <Feather name="plus" size={18} color="#fff" />
          <ThemedText style={styles.addClientButtonText}>Adicionar novo cliente</ThemedText>
        </Pressable>

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
                <ThemedText style={[{ color: theme.tertiaryText, padding: Spacing.md, textAlign: "center" }]}>
                  Nenhum cliente disponível
                </ThemedText>
              ) : (
                <ScrollView scrollEnabled nestedScrollEnabled>
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
                </ScrollView>
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
            Data de Quitação (opcional)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={theme.tertiaryText}
            value={paymentDate}
            onChangeText={(text) => setPaymentDate(formatDateInput(text))}
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
            Taxa de Atraso por Dia (R$) (opcional)
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

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Juros do Mês (R$)
          </ThemedText>
          <View
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, justifyContent: "center", paddingVertical: Spacing.md },
            ]}
          >
            <ThemedText style={[{ fontSize: 16 }, amount && loanPercentage ? {} : { color: theme.tertiaryText }]}>
              {amount && loanPercentage
                ? `R$ ${((parseFloat(amount.replace(",", ".")) * parseFloat(loanPercentage.replace(",", "."))) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "Preencha o valor e a porcentagem"}
            </ThemedText>
          </View>
        </View>

        {(() => {
          const parsedDate = parseDate(dueDate);
          if (!parsedDate) return null;
          const today = new Date();
          const daysOverdue = Math.floor((today.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue <= 0) return null;
          
          const dailyRateNum = parseFloat(dailyDelayRate.replace(",", "."));
          
          if (isNaN(dailyRateNum) || dailyRateNum === 0) return null;
          
          const delayFeeValue = dailyRateNum * daysOverdue;
          
          return (
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
                Taxa de Atraso Atualizada (R$)
              </ThemedText>
              <View
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, justifyContent: "center", paddingVertical: Spacing.md },
                ]}
              >
                <ThemedText style={[{ fontSize: 16, color: theme.error }]}>
                  {`R$ ${delayFeeValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${daysOverdue} dias)`}
                </ThemedText>
              </View>
            </View>
          );
        })()}

        {(() => {
          const amountNum = parseFloat(amount.replace(",", "."));
          const loanPercentageNum = parseFloat(loanPercentage.replace(",", "."));
          const monthlyInterest = amount && loanPercentage && !isNaN(amountNum) && !isNaN(loanPercentageNum)
            ? (amountNum * loanPercentageNum) / 100
            : 0;
          
          const parsedDate = parseDate(dueDate);
          const today = new Date();
          const daysOverdue = parsedDate ? Math.floor((today.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const dailyRateNum = parseFloat(dailyDelayRate.replace(",", "."));
          const delayFee = daysOverdue > 0 && !isNaN(dailyRateNum) && dailyRateNum > 0
            ? dailyRateNum * daysOverdue
            : 0;
          
          const totalValue = monthlyInterest + delayFee;
          
          if (totalValue === 0) return null;
          
          return (
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.secondaryText, fontWeight: "700" }]}>
                Total de Acréscimos (R$)
              </ThemedText>
              <View
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.primaryAccent, borderWidth: 2, justifyContent: "center", paddingVertical: Spacing.md },
                ]}
              >
                <ThemedText style={[{ fontSize: 18, fontWeight: "700", color: theme.primaryAccent }]}>
                  {`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </ThemedText>
              </View>
            </View>
          );
        })()}

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
  addClientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  addClientButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
});
