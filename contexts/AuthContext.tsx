import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@lastro_capital_auth";
const USERS_KEY = "@lastro_capital_users";

interface User {
  id: string;
  email: string;
  password: string;
}

interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await AsyncStorage.getItem(AUTH_KEY);
      if (session) {
        const userData: User = JSON.parse(session);
        setUser(userData);
        setIsSignedIn(true);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Verificar se email já existe
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      
      if (users.some(u => u.email === email)) {
        throw new Error("Email já cadastrado");
      }

      // Criar novo usuário
      const newUser: User = {
        id: Date.now().toString(),
        email,
        password, // Em produção, criptografar!
      };

      // Salvar usuário
      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Fazer login automático
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setIsSignedIn(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Buscar usuário
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = usersData ? JSON.parse(usersData) : [];

      // Verificar se o email existe
      const userExists = users.find(u => u.email === email);
      if (!userExists) {
        throw new Error("Usuário não localizado");
      }

      // Verificar se a senha está correta
      if (userExists.password !== password) {
        throw new Error("Usuário ou Senha incorretos");
      }

      // Salvar session
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userExists));
      setUser(userExists);
      setIsSignedIn(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log("Iniciando logout...");
      setIsLoading(true);
      await AsyncStorage.removeItem(AUTH_KEY);
      console.log("AUTH_KEY removida");
      setUser(null);
      console.log("Usuário setado para null");
      setIsSignedIn(false);
      console.log("isSignedIn setado para false - logout concluído");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isSignedIn, user, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
