import { Platform } from "react-native";
import Constants from "expo-constants";

function getApiBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `http://${host}:3001`;
  }

  return "http://localhost:3001";
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export type PlanType = "free" | "pro" | "premium";

export async function getStripeConfig(): Promise<{ publishableKey: string }> {
  return apiRequest("/api/stripe/config");
}

export async function createCheckoutSession(params: {
  amount: number;
  clientName?: string;
  clientEmail?: string;
  chargeDescription?: string;
  chargeId?: string;
  currency?: string;
}): Promise<{ url: string; sessionId: string }> {
  return apiRequest("/api/stripe/create-checkout", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createPaymentLink(params: {
  amount: number;
  clientName?: string;
  chargeDescription?: string;
  chargeId?: string;
  currency?: string;
}): Promise<{ url: string; paymentLinkId: string }> {
  return apiRequest("/api/stripe/create-payment-link", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createSubscriptionCheckout(params: {
  email: string;
  userId?: string;
  plan: PlanType;
}): Promise<{ url: string; sessionId: string }> {
  return apiRequest("/api/stripe/create-subscription-checkout", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function startFreeTrial(params: {
  email: string;
  userId?: string;
}): Promise<{ success: boolean; subscriptionId: string; status: string; trialEnd: string | null }> {
  return apiRequest("/api/stripe/start-free-trial", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  currentPlan: PlanType | null;
  customerId: string | null;
  subscriptionId: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string | null;
}

export async function getSubscriptionStatus(email: string): Promise<SubscriptionStatus> {
  return apiRequest("/api/stripe/subscription-status", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function cancelSubscription(subscriptionId: string): Promise<{
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}> {
  return apiRequest("/api/stripe/cancel-subscription", {
    method: "POST",
    body: JSON.stringify({ subscriptionId }),
  });
}

export async function checkStripeHealth(): Promise<boolean> {
  try {
    await apiRequest("/api/stripe/health");
    return true;
  } catch {
    return false;
  }
}
