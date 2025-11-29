import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "pt" | "en" | "es" | "fr" | "zh" | "ko" | "ja";

const LANGUAGE_STORAGE_KEY = "@lastro_capital_language";

const translations = {
  pt: {
    // Profile
    "minha-conta": "Minha Conta",
    "gerencie-sua-conta": "Gerencie sua conta e dados",
    "informacoes-pessoais": "Informações Pessoais",
    "nome": "Nome",
    "email": "Email",
    "telefone": "Telefone",
    "aparencia": "Aparência",
    "tema": "Tema",
    "idioma": "Idioma",
    "selecione-idioma": "Selecione seu idioma",
    "ajuda-suporte": "Ajuda e Suporte",
    "email-contato": "Email de Contato",
    "whatsapp": "WhatsApp",
    "fale-conosco": "Fale conosco",
    "sobre": "Sobre",
    "versao-informacoes": "Versão e informações",
    "não-informado": "Não informado",
    
    // Dashboard
    "pendente": "Pendente",
    "total-emprestado": "Total Emprestado",
    "clientes-ativos": "Clientes Ativos",
    "juros-receber": "Juros a Receber",
    
    // Charges
    "cobrancas": "Cobranças",
    "valor": "Valor",
    "status": "Status",
    "em-dia": "Em Dia",
    "vencido": "Vencido",
    "pago": "Pago",
    
    // Clients
    "clientes": "Clientes",
    "adicionar-cliente": "Adicionar Cliente",
    "nome-cliente": "Nome do Cliente",
    
    // History
    "historico": "Histórico",
    "data": "Data",
    "tipo": "Tipo",
  },
  en: {
    "minha-conta": "My Account",
    "gerencie-sua-conta": "Manage your account and data",
    "informacoes-pessoais": "Personal Information",
    "nome": "Name",
    "email": "Email",
    "telefone": "Phone",
    "aparencia": "Appearance",
    "tema": "Theme",
    "idioma": "Language",
    "selecione-idioma": "Select your language",
    "ajuda-suporte": "Help & Support",
    "email-contato": "Contact Email",
    "whatsapp": "WhatsApp",
    "fale-conosco": "Contact us",
    "sobre": "About",
    "versao-informacoes": "Version and information",
    "não-informado": "Not informed",
    
    "pendente": "Pending",
    "total-emprestado": "Total Loaned",
    "clientes-ativos": "Active Clients",
    "juros-receber": "Interest to Receive",
    
    "cobrancas": "Charges",
    "valor": "Amount",
    "status": "Status",
    "em-dia": "On Time",
    "vencido": "Overdue",
    "pago": "Paid",
    
    "clientes": "Clients",
    "adicionar-cliente": "Add Client",
    "nome-cliente": "Client Name",
    
    "historico": "History",
    "data": "Date",
    "tipo": "Type",
  },
  es: {
    "minha-conta": "Mi Cuenta",
    "gerencie-sua-conta": "Administre su cuenta y datos",
    "informacoes-pessoais": "Información Personal",
    "nome": "Nombre",
    "email": "Correo",
    "telefone": "Teléfono",
    "aparencia": "Apariencia",
    "tema": "Tema",
    "idioma": "Idioma",
    "selecione-idioma": "Seleccione su idioma",
    "ajuda-suporte": "Ayuda y Soporte",
    "email-contato": "Correo de Contacto",
    "whatsapp": "WhatsApp",
    "fale-conosco": "Contáctenos",
    "sobre": "Acerca de",
    "versao-informacoes": "Versión e información",
    "não-informado": "No informado",
    
    "pendente": "Pendiente",
    "total-emprestado": "Total Prestado",
    "clientes-ativos": "Clientes Activos",
    "juros-receber": "Intereses a Recibir",
    
    "cobrancas": "Cargos",
    "valor": "Monto",
    "status": "Estado",
    "em-dia": "Al Día",
    "vencido": "Vencido",
    "pago": "Pagado",
    
    "clientes": "Clientes",
    "adicionar-cliente": "Agregar Cliente",
    "nome-cliente": "Nombre del Cliente",
    
    "historico": "Historial",
    "data": "Fecha",
    "tipo": "Tipo",
  },
  fr: {
    "minha-conta": "Mon Compte",
    "gerencie-sua-conta": "Gérez votre compte et données",
    "informacoes-pessoais": "Informations Personnelles",
    "nome": "Nom",
    "email": "Email",
    "telefone": "Téléphone",
    "aparencia": "Apparence",
    "tema": "Thème",
    "idioma": "Langue",
    "selecione-idioma": "Sélectionnez votre langue",
    "ajuda-suporte": "Aide et Support",
    "email-contato": "Email de Contact",
    "whatsapp": "WhatsApp",
    "fale-conosco": "Nous contacter",
    "sobre": "À propos",
    "versao-informacoes": "Version et informations",
    "não-informado": "Non renseigné",
    
    "pendente": "En attente",
    "total-emprestado": "Total Prêté",
    "clientes-ativos": "Clients Actifs",
    "juros-receber": "Intérêts à Recevoir",
    
    "cobrancas": "Frais",
    "valor": "Montant",
    "status": "Statut",
    "em-dia": "À Jour",
    "vencido": "Dépassé",
    "pago": "Payé",
    
    "clientes": "Clients",
    "adicionar-cliente": "Ajouter un Client",
    "nome-cliente": "Nom du Client",
    
    "historico": "Historique",
    "data": "Date",
    "tipo": "Type",
  },
  zh: {
    "minha-conta": "我的账户",
    "gerencie-sua-conta": "管理您的账户和数据",
    "informacoes-pessoais": "个人信息",
    "nome": "名称",
    "email": "电子邮件",
    "telefone": "电话",
    "aparencia": "外观",
    "tema": "主题",
    "idioma": "语言",
    "selecione-idioma": "选择您的语言",
    "ajuda-suporte": "帮助和支持",
    "email-contato": "联系电子邮件",
    "whatsapp": "WhatsApp",
    "fale-conosco": "联系我们",
    "sobre": "关于",
    "versao-informacoes": "版本和信息",
    "não-informado": "未提供",
    
    "pendente": "待处理",
    "total-emprestado": "总贷款",
    "clientes-ativos": "活跃客户",
    "juros-receber": "应收利息",
    
    "cobrancas": "费用",
    "valor": "金额",
    "status": "状态",
    "em-dia": "准时",
    "vencido": "逾期",
    "pago": "已支付",
    
    "clientes": "客户",
    "adicionar-cliente": "添加客户",
    "nome-cliente": "客户名称",
    
    "historico": "历史记录",
    "data": "日期",
    "tipo": "类型",
  },
  ko: {
    "minha-conta": "내 계정",
    "gerencie-sua-conta": "계정 및 데이터 관리",
    "informacoes-pessoais": "개인 정보",
    "nome": "이름",
    "email": "이메일",
    "telefone": "전화",
    "aparencia": "모양",
    "tema": "테마",
    "idioma": "언어",
    "selecione-idioma": "언어를 선택하세요",
    "ajuda-suporte": "도움말 및 지원",
    "email-contato": "연락처 이메일",
    "whatsapp": "WhatsApp",
    "fale-conosco": "문의하기",
    "sobre": "정보",
    "versao-informacoes": "버전 및 정보",
    "não-informado": "정보 없음",
    
    "pendente": "대기 중",
    "total-emprestado": "총 대출",
    "clientes-ativos": "활성 고객",
    "juros-receber": "받을 이자",
    
    "cobrancas": "요금",
    "valor": "금액",
    "status": "상태",
    "em-dia": "정시",
    "vencido": "연체",
    "pago": "지불됨",
    
    "clientes": "고객",
    "adicionar-cliente": "고객 추가",
    "nome-cliente": "고객 이름",
    
    "historico": "히스토리",
    "data": "날짜",
    "tipo": "유형",
  },
  ja: {
    "minha-conta": "マイアカウント",
    "gerencie-sua-conta": "アカウントとデータを管理",
    "informacoes-pessoais": "個人情報",
    "nome": "名前",
    "email": "メール",
    "telefone": "電話",
    "aparencia": "外観",
    "tema": "テーマ",
    "idioma": "言語",
    "selecione-idioma": "言語を選択",
    "ajuda-suporte": "ヘルプとサポート",
    "email-contato": "お問い合わせメール",
    "whatsapp": "WhatsApp",
    "fale-conosco": "お問い合わせ",
    "sobre": "について",
    "versao-informacoes": "バージョンと情報",
    "não-informado": "未入力",
    
    "pendente": "保留中",
    "total-emprestado": "総貸出額",
    "clientes-ativos": "アクティブな顧客",
    "juros-receber": "受け取る利息",
    
    "cobrancas": "手数料",
    "valor": "金額",
    "status": "ステータス",
    "em-dia": "時間通り",
    "vencido": "延滞",
    "pago": "支払済み",
    
    "clientes": "顧客",
    "adicionar-cliente": "顧客を追加",
    "nome-cliente": "顧客名",
    
    "historico": "履歴",
    "data": "日付",
    "tipo": "タイプ",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && (Object.keys(translations) as Language[]).includes(stored as Language)) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.log("Error loading language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
