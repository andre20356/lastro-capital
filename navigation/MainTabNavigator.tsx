import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Charge, Client } from "@/types";
import { Spacing } from "@/constants/theme";

import DashboardScreen from "@/screens/DashboardScreen";
import ChargesScreen from "@/screens/ChargesScreen";
import ClientsScreen from "@/screens/ClientsScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import ChargeFormScreen from "@/screens/ChargeFormScreen";
import ClientFormScreen from "@/screens/ClientFormScreen";
import ChargeDetailScreen from "@/screens/ChargeDetailScreen";
import ClientDetailScreen from "@/screens/ClientDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import AboutScreen from "@/screens/AboutScreen";
import InterestDetailsScreen from "@/screens/InterestDetailsScreen";
import CashReportScreen from "@/screens/CashReportScreen";
import ArchiveClientScreen from "@/screens/ArchiveClientScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  ChargeForm: { charge?: Charge; clientId?: string };
  ClientForm: { client?: Client };
  ChargeDetail: { chargeId: string };
  ClientDetail: { clientId: string };
  Profile: undefined;
  About: undefined;
  InterestDetails: undefined;
  CashReport: undefined;
  ArchiveClient: { clientId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Charges: undefined;
  Clients: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs({ navigation }: any) {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primaryAccent,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.cardBorder,
        },
        headerStyle: {
          backgroundColor: theme.backgroundDefault,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
          headerTitle: () => <HeaderTitle title="Lastro Capital" />,
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Feather name="more-vertical" size={24} color={theme.text} style={{ marginRight: Spacing.lg }} />
            </Pressable>
          ),
        }}
      />
      <Tab.Screen
        name="Charges"
        component={ChargesScreen}
        options={{
          tabBarLabel: "Cobranças",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
          headerTitle: "Cobranças",
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarLabel: "Clientes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
          headerTitle: "Clientes",
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "Histórico",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
          headerTitle: "Histórico de Pagamentos",
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundDefault,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChargeForm"
        component={ChargeFormScreen}
        options={{
          title: "Adicionar Cobrança",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="ClientForm"
        component={ClientFormScreen}
        options={{
          title: "Adicionar Cliente",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="ChargeDetail"
        component={ChargeDetailScreen}
        options={{
          title: "Detalhes da Cobrança",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{
          title: "Dados do Cliente",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: "Sobre Nós",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="InterestDetails"
        component={InterestDetailsScreen}
        options={{
          title: "Detalhes de Juros",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="CashReport"
        component={CashReportScreen}
        options={{
          title: "Relatório de Caixa",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="ArchiveClient"
        component={ArchiveClientScreen}
        options={{
          title: "Arquivar Cliente",
          headerBackTitle: "Voltar",
        }}
      />
    </Stack.Navigator>
  );
}
