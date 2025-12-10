import { Linking, Alert } from "react-native";

interface ReminderData {
  clientName: string;
  clientPhone: string;
  amount: number;
  dueDate: string;
  monthlyInterest?: number;
  accumulatedInterest?: number;
  delayFee?: number;
  daysOverdue?: number;
  isOverdue?: boolean;
}

interface LoanApprovalData {
  clientName: string;
  clientPhone: string;
  amount: number;
  dueDate: string;
  loanPercentage?: number;
  dailyDelayRate?: number;
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
    const { 
      clientName, 
      clientPhone, 
      amount, 
      dueDate, 
      monthlyInterest = 0,
      accumulatedInterest = 0, 
      delayFee = 0,
      daysOverdue = 0,
      isOverdue 
    } = data;

    if (!clientPhone) {
      Alert.alert("Erro", "Cliente não possui numero de telefone cadastrado.");
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const formattedDate = formatDate(dueDate);
    
    const totalDebt = amount + accumulatedInterest + delayFee;

    let message: string;

    if (isOverdue) {
      message = `Ola ${clientName}!\n\n`;
      message += `Identificamos que sua parcela venceu em ${formattedDate}.\n\n`;
      message += `*RESUMO DA DIVIDA:*\n`;
      message += `------------------------\n`;
      message += `Valor Solicitado: ${formatCurrency(amount)}\n`;
      
      if (monthlyInterest > 0) {
        message += `Juros do Mes: ${formatCurrency(monthlyInterest)}\n`;
      }
      
      if (accumulatedInterest > 0) {
        message += `Juros Acumulados: ${formatCurrency(accumulatedInterest)}\n`;
      }
      
      if (delayFee > 0) {
        message += `Taxa de Atraso (${daysOverdue} dias): ${formatCurrency(delayFee)}\n`;
      }
      
      message += `------------------------\n`;
      message += `*TOTAL A PAGAR: ${formatCurrency(totalDebt)}*\n\n`;
      message += `Por favor, entre em contato para regularizar sua situacao.\n\n`;
      message += `Atenciosamente,\n*Lastro Capital*`;
    } else {
      message = `Ola ${clientName}!\n\n`;
      message += `Este e um lembrete de que sua proxima parcela vence em *${formattedDate}*.\n\n`;
      message += `*DETALHES:*\n`;
      message += `------------------------\n`;
      message += `Valor Solicitado: ${formatCurrency(amount)}\n`;
      
      if (monthlyInterest > 0) {
        message += `Juros do Mes: ${formatCurrency(monthlyInterest)}\n`;
        message += `------------------------\n`;
        message += `*Total a Pagar: ${formatCurrency(monthlyInterest)}*\n`;
      }
      
      message += `\nCaso ja tenha efetuado o pagamento, por favor desconsidere esta mensagem.\n\n`;
      message += `Atenciosamente,\n*Lastro Capital*`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    try {
      await Linking.openURL(whatsappUrl);
      return true;
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert(
        "WhatsApp nao disponivel",
        "Nao foi possivel abrir o WhatsApp. Verifique se esta instalado no dispositivo."
      );
      return false;
    }
  };

  const sendLoanApprovalNotification = async (data: LoanApprovalData) => {
    const { clientName, clientPhone, amount, dueDate, loanPercentage = 0, dailyDelayRate = 0 } = data;

    if (!clientPhone) {
      Alert.alert("Erro", "Cliente nao possui numero de telefone cadastrado.");
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(clientPhone);
    const formattedDate = formatDate(dueDate);
    const monthlyInterest = loanPercentage > 0 ? (amount * loanPercentage) / 100 : 0;

    let message = `Ola ${clientName}!\n\n`;
    message += `Sua solicitacao de emprestimo foi *APROVADA*!\n\n`;
    message += `*DETALHES DO EMPRESTIMO:*\n`;
    message += `------------------------\n`;
    message += `Valor Aprovado: ${formatCurrency(amount)}\n`;
    
    if (loanPercentage > 0) {
      message += `Taxa de Juros: ${loanPercentage}% ao mes\n`;
      message += `Juros Mensal: ${formatCurrency(monthlyInterest)}\n`;
    }

    if (dailyDelayRate > 0) {
      message += `Taxa de Atraso: ${formatCurrency(dailyDelayRate)} por dia\n`;
    }
    
    message += `Data de Vencimento: ${formattedDate}\n`;
    message += `------------------------\n\n`;
    message += `Qualquer duvida, estamos a disposicao.\n\n`;
    message += `Atenciosamente,\n*Lastro Capital*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    try {
      await Linking.openURL(whatsappUrl);
      return true;
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert(
        "WhatsApp nao disponivel",
        "Nao foi possivel abrir o WhatsApp. Verifique se esta instalado no dispositivo."
      );
      return false;
    }
  };

  const sendCustomMessage = async (phone: string, message: string) => {
    if (!phone) {
      Alert.alert("Erro", "Numero de telefone nao fornecido.");
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    try {
      await Linking.openURL(whatsappUrl);
      return true;
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      Alert.alert(
        "WhatsApp nao disponivel",
        "Nao foi possivel abrir o WhatsApp. Verifique se esta instalado no dispositivo."
      );
      return false;
    }
  };

  return {
    sendPaymentReminder,
    sendLoanApprovalNotification,
    sendCustomMessage,
  };
}
