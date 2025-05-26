import { getAuthToken } from "@/utils/auth";
import { Page, PaymentResponse } from "@/types/common";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";


class PaymentService {
  async createPayment(data: { requestId: number; amount: number; paymentMethod: string }) {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_URL}/api/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Payment failed");
    return await response.json();
  }

  async getPaymentStatusByRequestId(requestId: number): Promise<PaymentResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_URL}/api/payments/request/${requestId}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("No payment found for this request");
      }
      throw new Error("Failed to fetch payment status");
    }

    return await response.json();
  }

  async updatePaymentStatus(paymentId: number, status: "PENDING" | "COMPLETED" | "FAILED") {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_URL}/api/payments/${paymentId}/status`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update payment status");
    return await response.json();
  }

  async getProviderPayments(page = 0, size = 20, sort = "createdAt,desc"): Promise<Page<PaymentResponse>> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");
    const params = new URLSearchParams({ page: page.toString(), size: size.toString(), sort });
    const response = await fetch(`${API_URL}/api/payments/provider?${params.toString()}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch provider payments");
    return await response.json();
  }
}

export const paymentService = new PaymentService(); 