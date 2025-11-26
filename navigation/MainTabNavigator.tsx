import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Charge, Client } from "@/types";

import DashboardScreen from "@/screens/DashboardScreen";
import ChargesScreen from "@/screens/ChargesScreen";
import ClientsScreen from "@/screens/ClientsScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import ChargeFormScreen from "@/screens/ChargeFormScreen";
import ClientFormScreen from "@/screens/ClientFormScreen";
import ChargeDetailScreen from "@/screens/ChargeDetailScreen";
import ClientDetailScreen from "@/screens/ClientDetailScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  ChargeForm: { charge?: Charge; clientId?: string };
  ClientForm: { client?: Client };
  ChargeDetail: { chargeId: string };
  ClientDetail: { clientId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Charges: undefined;
  Clients: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
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
          tabBarLabel: "Historico",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
          headerTitle: "Historico de Pagamentos",
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
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
        options={({ route }) => ({
          headerTitle: route.params?.charge ? "Editar Cobrança" : "Nova Cobrança",
          presentation: "modal",
        })}
      />
      <Stack.Screen
        name="ClientForm"
        component={ClientFormScreen}
        options={({ route }) => ({
          headerTitle: route.params?.client ? "Editar Cliente" : "Novo Cliente",
          presentation: "modal",
        })}
      />
      <Stack.Screen
        name="ChargeDetail"
        component={ChargeDetailScreen}
        options={{ headerTitle: "Detalhes da Cobrança" }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{ headerTitle: "Detalhes do Cliente" }}
      />
    </Stack.Navigator>
  );
}
