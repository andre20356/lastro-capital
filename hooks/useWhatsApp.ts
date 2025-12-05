import { Linking, Platform, Alert } from "react-native";

interface ReminderData {
  clientName: string;
  clientPhone: string;
  amount: number;
  dueDate: string;
  accumulatedInterest?: number;
  isOverdue?: boolean;
}

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
    month: "2-digit",
    year: "numeric",
  });
}

function formatPhoneForWhatsApp(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("55")) {
    return cleanPhone;
  }
  return `55${cleanPhone}`;
}

export function useWhatsApp() {
  const sendPaymentReminder = async (data: ReminderData) => {
    const { clientName, clientPhone, amount, dueDate, accumulatedInterest, isOverdue } = data;

    if (!clientPhone) {
      Alert.alert("Erro", "Cliente não possui número de telefone cadastrado.");
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const formattedAmount = formatCurrency(amount);
    const formattedDate = formatDate(dueDate);
    const formattedInterest = accumulatedInterest ? formatCurrency(accumulatedInterest) : null;

    let message: string;

    if (isOverdue) {
      message = `Olá ${clientName}!\n\n`;
      message += `Identificamos que sua parcela no valor de ${formattedAmount} venceu em ${formattedDate}.\n\n`;
      if (formattedInterest && accumulatedInterest && accumulatedInterest > 0) {
        message += `Juros acumulados: ${formattedInterest}\n`;
        message += `Total a pagar: ${formatCurrency(amount + accumulatedInterest)}\n\n`;
      }
      message += `Por favor, entre em contato para regularizar sua situação.\n\n`;
      message += `Atenciosamente,\nLastro Capital`;
    } else {
      message = `Olá ${clientName}!\n\n`;
      message += `Este é um lembrete de que sua próxima parcela no valor de ${formattedAmount} vence em ${formattedDate}.\n\n`;
      message += `Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.\n\n`;
      message += `Atenciosamente,\nLastro Capital`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        Alert.alert(
          "WhatsApp não disponível",
          "Não foi possível abrir o WhatsApp. Verifique se está instalado no dispositivo."
        );
        return false;
      }
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      return false;
    }
  };

  const sendCustomMessage = async (phone: string, message: string) => {
    if (!phone) {
      Alert.alert("Erro", "Número de telefone não fornecido.");
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        Alert.alert(
          "WhatsApp não disponível",
          "Não foi possível abrir o WhatsApp. Verifique se está instalado no dispositivo."
        );
        return false;
      }
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
      return false;
    }
  };

  return {
    sendPaymentReminder,
    sendCustomMessage,
  };
}
