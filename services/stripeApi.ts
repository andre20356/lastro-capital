import { Platform } from "react-native";

function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    const currentHost = window.location.hostname;
    return `https://${currentHost}:3001`;
  }
  return "http://localhost:3001";
}

const API_BASE = getApiBaseUrl();

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
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

export async function checkStripeHealth(): Promise<boolean> {
  try {
    await apiRequest("/api/stripe/health");
    return true;
  } catch {
    return false;
  }
}
