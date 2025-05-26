import { ServiceRequestRequest, ServiceRequestResponse, ServiceRequestPage, ServiceRequestStatus } from "@/types/serviceRequest";
import { getAuthToken } from "@/utils/auth";
import { api } from "./api";
import { Page } from "@/types/common";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class ServiceRequestService {
  async createRequest(data: ServiceRequestRequest): Promise<ServiceRequestResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/requests`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create request");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create request");
    }
  }

  async getRequestById(requestId: number): Promise<ServiceRequestResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/requests/${requestId}`, {
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
          throw new Error("Not authorized to view request");
        }
        if (response.status === 404) {
          throw new Error("Request not found");
        }
        throw new Error("Failed to fetch request");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching request:", error);
      throw error;
    }
  }

  async getAllRequests(page = 0, size = 10, serviceType?: string): Promise<ServiceRequestPage> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      let url = `${API_URL}/api/requests?page=${page}&size=${size}`;
      if (serviceType && serviceType !== "ALL") {
        url += `&serviceType=${serviceType}`;
      }
      url += "&status=OPEN,ASSIGNED,COMPLETED,DRAFT";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to view requests");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch requests");
      }

      const data = await response.json();
      const filteredContent = data.content.filter((request: ServiceRequestResponse) => 
        request.status !== "DELETED" as ServiceRequestStatus
      );
      
      return {
        content: filteredContent,
        pageable: {
          pageNumber: data.pageable?.pageNumber || 0,
          pageSize: data.pageable?.pageSize || size,
        },
        totalPages: data.totalPages || 0,
        totalElements: filteredContent.length,
      };
    } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
    }
  }

  async getAvailableRequests(page = 0, size = 10, serviceType?: string): Promise<ServiceRequestPage> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      let url = `${API_URL}/api/requests?page=${page}&size=${size}`;
      if (serviceType && serviceType !== "ALL") {
        url += `&serviceType=${serviceType}`;
      }
      // Only show OPEN requests for available requests
      url += "&status=OPEN";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to view requests");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch requests");
      }

      const data = await response.json();
      
      // Strictly filter for OPEN requests only
      const openRequests = data.content.filter((request: ServiceRequestResponse) => 
        request.status === "OPEN" && request.assignedProviderId === null
      );

      return {
        content: openRequests,
        pageable: {
          pageNumber: data.pageable?.pageNumber || 0,
          pageSize: data.pageable?.pageSize || size,
        },
        totalPages: Math.ceil(openRequests.length / size),
        totalElements: openRequests.length,
      };
    } catch (error) {
      console.error("Error fetching available requests:", error);
      throw error;
    }
  }

  async getMyRequests(page = 0, size = 10): Promise<ServiceRequestPage> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `${API_URL}/api/requests/my-requests?page=${page}&size=${size}`,
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
      throw new Error("Failed to fetch requests");
    }

    return response.json();
  }

  async deleteRequest(requestId: number): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/api/requests/${requestId}`, {
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
        throw new Error("Request not found");
      }
      throw new Error("Failed to delete request");
    }
  }

  async assignProvider(requestId: number, providerId: number): Promise<ServiceRequestResponse> {
    const response = await api.put<ServiceRequestResponse>(`/api/requests/${requestId}/assign/${providerId}`);
    return response.data;
  }

  async updateRequestStatus(requestId: number, status: string): Promise<ServiceRequestResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(status)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Not authorized to update request status");
        }
        if (response.status === 404) {
          throw new Error("Request not found");
        }
        throw new Error("Failed to update request status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }

  async updateRequestBudget(requestId: number, newBudget: number): Promise<ServiceRequestResponse> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_URL}/api/requests/${requestId}/budget`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newBudget)
    });
    if (!response.ok) {
      throw new Error("Failed to update budget");
    }
    return await response.json();
  }

  async deleteRequestAsAdmin(requestId: number): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/api/admin/requests/${requestId}`, {
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
        throw new Error("Request not found");
      }
      throw new Error("Failed to delete request");
    }
  }
}

export const serviceRequestService = new ServiceRequestService(); 