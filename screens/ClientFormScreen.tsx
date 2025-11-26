import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ScrollView, Image } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  const [requestedAmount, setRequestedAmount] = useState(existingClient?.requestedAmount?.toString() || "");
  const [loanPercentage, setLoanPercentage] = useState(existingClient?.loanPercentage?.toString() || "");
  const [dailyDelayRate, setDailyDelayRate] = useState(existingClient?.dailyDelayRate?.toString() || "");
  const [documentPhoto, setDocumentPhoto] = useState(existingClient?.documentPhoto || "");
  const [addressProof, setAddressProof] = useState(existingClient?.addressProof || "");
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

  const pickImage = async (onComplete: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onComplete(base64);
      }
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel selecionar a imagem");
    }
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
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : undefined,
          loanPercentage: loanPercentage ? parseFloat(loanPercentage) : undefined,
          dailyDelayRate: dailyDelayRate ? parseFloat(dailyDelayRate) : undefined,
          documentPhoto,
          addressProof,
          notes: notes.trim(),
        });
      } else {
        await addClient({
          name: name.trim(),
          phone,
          email: email.trim(),
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : undefined,
          loanPercentage: loanPercentage ? parseFloat(loanPercentage) : undefined,
          dailyDelayRate: dailyDelayRate ? parseFloat(dailyDelayRate) : undefined,
          documentPhoto,
          addressProof,
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
            Valor Solicitado
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="R$ 0,00"
            placeholderTextColor={theme.tertiaryText}
            value={requestedAmount}
            onChangeText={setRequestedAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Percentual do Emprestimo (%)
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
            Taxa de Atraso Diaria (%)
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
            Foto do Documento
          </ThemedText>
          {documentPhoto ? (
            <View
              style={[
                styles.imagePreview,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
              ]}
            >
              <Image source={{ uri: documentPhoto }} style={styles.image} />
              <Pressable
                style={({ pressed }) => [
                  styles.removeImageButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => setDocumentPhoto("")}
              >
                <Feather name="x" size={20} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => pickImage(setDocumentPhoto)}
            >
              <Feather name="camera" size={20} color="#fff" />
              <ThemedText style={styles.uploadButtonText}>Adicionar Foto</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: theme.secondaryText }]}>
            Comprovante de Endereco
          </ThemedText>
          {addressProof ? (
            <View
              style={[
                styles.imagePreview,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.inputBorder },
              ]}
            >
              <Image source={{ uri: addressProof }} style={styles.image} />
              <Pressable
                style={({ pressed }) => [
                  styles.removeImageButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => setAddressProof("")}
              >
                <Feather name="x" size={20} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                { backgroundColor: theme.primaryAccent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => pickImage(setAddressProof)}
            >
              <Feather name="camera" size={20} color="#fff" />
              <ThemedText style={styles.uploadButtonText}>Adicionar Foto</ThemedText>
            </Pressable>
          )}
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#000000cc",
    alignItems: "center",
    justifyContent: "center",
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
