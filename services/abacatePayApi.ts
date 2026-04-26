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

export interface PixChargeResult {
  pixCode: string;
  qrCodeUrl: string;
  chargeId: string;
  expiresAt: string;
  amount: number;
}

export async function createPixCharge(params: {
  amount: number;
  clientName: string;
  clientEmail?: string;
  clientCpf?: string;
  clientPhone?: string;
  description?: string;
  chargeId?: string;
}): Promise<PixChargeResult> {
  return apiRequest("/api/abacatepay/create-pix", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function checkAbacatePayHealth(): Promise<boolean> {
  try {
    await apiRequest("/api/abacatepay/health");
    return true;
  } catch {
    return false;
  }
}
