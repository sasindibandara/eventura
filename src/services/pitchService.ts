import { getAuthToken } from "@/utils/auth";
import { PitchRequest, PitchResponse, PitchPage } from "@/types/pitch";
import { api } from "./api";
import { Page } from "@/types/common";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class PitchService {
  async createPitch(data: PitchRequest): Promise<PitchResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/pitches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 404) {
          throw new Error("Request not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create pitch");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating pitch:", error);
      throw error;
    }
  }

  async getPitchById(pitchId: number): Promise<PitchResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/pitches/${pitchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to view pitch");
        }
        if (response.status === 404) {
          throw new Error("Pitch not found");
        }
        throw new Error("Failed to fetch pitch");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching pitch:", error);
      throw error;
    }
  }

  async getPitchesByRequestId(requestId: number, page: number = 0, size: number = 10): Promise<Page<PitchResponse>> {
    const response = await api.get<Page<PitchResponse>>(`/api/pitches/request/${requestId}`, {
      params: { page, size }
    });
    return response.data;
  }

  async deletePitch(pitchId: number): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/pitches/${pitchId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 404) {
          throw new Error("Pitch not found");
        }
        throw new Error("Failed to delete pitch");
      }
    } catch (error) {
      console.error("Error deleting pitch:", error);
      throw error;
    }
  }

  async getMyPitches(page: number = 0, size: number = 10): Promise<PitchPage> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `${API_URL}/api/pitches/my-pitches?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch pitches");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching pitches:", error);
      throw error;
    }
  }

  async getPitchesForRequest(requestId: number, page = 0, size = 10): Promise<PitchPage> {
    const response = await api.get<PitchPage>(`/api/pitches/request/${requestId}?page=${page}&size=${size}`);
    return response.data;
  }

  async getPitchStatus(pitchId: number): Promise<string> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/pitches/${pitchId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 404) {
          throw new Error("Pitch not found");
        }
        throw new Error("Failed to fetch pitch status");
      }

      const status = await response.text();
      return status;
    } catch (error) {
      console.error("Error fetching pitch status:", error);
      throw error;
    }
  }

  async updatePitchStatus(pitchId: number, status: "WIN" | "LOSE" | "PENDING"): Promise<PitchResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/pitches/${pitchId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to update pitch status");
        }
        if (response.status === 404) {
          throw new Error("Pitch not found");
        }
        if (response.status === 400) {
          throw new Error("Invalid status value");
        }
        throw new Error("Failed to update pitch status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating pitch status:", error);
      throw error;
    }
  }
}

export const pitchService = new PitchService(); 