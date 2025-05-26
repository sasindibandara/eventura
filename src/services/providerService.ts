import { ProviderProfileRequest, ProviderProfileResponse } from "@/types/provider";

const API_URL = "http://localhost:8080/api";

interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
}

export const providerService = {
  async createProfile(data: ProviderProfileRequest): Promise<ProviderProfileResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/providers/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authorized");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create profile");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create profile");
    }
  },

  async updateProfile(data: ProviderProfileRequest): Promise<ProviderProfileResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/providers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authorized");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update profile");
    }
  },

  async getProfile(): Promise<ProviderProfileResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/providers/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authorized");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get profile");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to get profile");
    }
  },

  async getAllProviders(page = 0, size = 10): Promise<PageResponse<ProviderProfileResponse>> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/providers?page=${page}&size=${size}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to view providers");
        }
        if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(errorData.message || "Failed to fetch providers");
      }

      const data = await response.json();
      return {
        content: data.content || [],
        pageable: {
          pageNumber: data.pageable?.pageNumber || 0,
          pageSize: data.pageable?.pageSize || size,
        },
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch providers");
    }
  },

  async getProviderById(providerId: number): Promise<ProviderProfileResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/providers/${providerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to view provider details");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        if (response.status === 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(errorData.message || "Failed to get provider");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to get provider");
    }
  },

  async updateProviderVerification(providerId: number, isVerified: boolean): Promise<ProviderProfileResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/admin/providers/${providerId}/verification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(isVerified),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to verify providers");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        throw new Error(errorData.message || "Failed to update provider verification");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update provider verification");
    }
  },
};

function getDriveImageUrl(url: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
} 