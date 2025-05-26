import { getAuthToken } from "@/utils/auth";
import { PortfolioRequest, PortfolioResponse, PortfolioPage } from "@/types/portfolio";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class PortfolioService {
  async createPortfolio(providerId: number, data: PortfolioRequest): Promise<PortfolioResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_URL}/api/providers/${providerId}/portfolios`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Provider not found");
      }
      throw new Error("Failed to create portfolio");
    }

    return await response.json();
  }

  async getProviderPortfolios(providerId: number, page = 0, size = 10): Promise<PortfolioPage> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const response = await fetch(
      `${API_URL}/api/providers/${providerId}/portfolios?${params.toString()}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Provider not found");
      }
      throw new Error("Failed to fetch portfolios");
    }

    return await response.json();
  }

  async deletePortfolio(providerId: number, portfolioId: number): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
      `${API_URL}/api/providers/${providerId}/portfolios/${portfolioId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Portfolio not found");
      }
      throw new Error("Failed to delete portfolio");
    }
  }

  async getProviderIdByUserId(userId: number): Promise<number> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_URL}/api/providers/by-user/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Provider not found for this user");
      }
      throw new Error("Failed to fetch provider ID");
    }

    return await response.json();
  }
}

export const portfolioService = new PortfolioService(); 