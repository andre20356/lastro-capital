import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
      }}
    >
      {showRegister ? (
        <Stack.Screen
          name="Register"
          options={{
            title: "Registrar",
            headerLeft: () => null,
          }}
        >
          {() => <RegisterScreen />}
        </Stack.Screen>
      ) : (
        <Stack.Screen
          name="Login"
          options={{
            title: "Login",
            headerLeft: () => null,
          }}
        >
          {() => (
            <LoginScreenWithToggle 
              onToggleRegister={() => setShowRegister(!showRegister)} 
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

function LoginScreenWithToggle({ onToggleRegister }: { onToggleRegister: () => void }) {
  const [showReg, setShowReg] = useState(false);
  
  React.useEffect(() => {
    if (showReg) onToggleRegister();
  }, [showReg]);

  return <LoginScreen />;
}
