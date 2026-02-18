import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { getSubscriptionStatus, SubscriptionStatus, PlanType } from "@/services/stripeApi";

const SUBSCRIPTION_KEY = "@lastro_capital_subscription";

interface SubscriptionContextType {
  isLoading: boolean;
  isActive: boolean;
  currentPlan: PlanType | null;
  subscriptionData: SubscriptionStatus | null;
  checkSubscription: () => Promise<void>;
  clearSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);

  const isActive = !!subscriptionData && (
    subscriptionData.status === "active" ||
    subscriptionData.status === "trialing"
  );

  const currentPlan = subscriptionData?.currentPlan || null;

  const checkSubscription = useCallback(async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const status = await getSubscriptionStatus(user.email);
      setSubscriptionData(status);
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(status));
    } catch (error) {
      console.log("Error checking subscription, using cached data:", error);
      try {
        const cached = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
        if (cached) {
          setSubscriptionData(JSON.parse(cached));
        }
      } catch {
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  const clearSubscription = useCallback(async () => {
    setSubscriptionData(null);
    await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
  }, []);

  useEffect(() => {
    if (isSignedIn && user?.email) {
      checkSubscription();
    } else {
      setSubscriptionData(null);
      setIsLoading(false);
    }
  }, [isSignedIn, user?.email, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ isLoading, isActive, currentPlan, subscriptionData, checkSubscription, clearSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
