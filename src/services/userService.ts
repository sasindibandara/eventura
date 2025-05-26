import { getAuthToken } from "@/utils/auth";
import { UserResponse } from "@/types/user";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export type { UserResponse };

export interface PageableUserResponse {
  content: UserResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export const userService = {
  async getUserById(userId: number): Promise<UserResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 404) {
          throw new Error("User not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch user");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch user");
    }
  },

  async getAllUsers(page: number = 0, size: number = 10, sort?: string): Promise<PageableUserResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(sort && { sort }),
      });

      const response = await fetch(`${API_URL}/api/admin/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch users");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch users");
    }
  },

  async updateUserStatus(userId: number, status: UserStatus): Promise<UserResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(status),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 404) {
          throw new Error("User not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update user status");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update user status");
    }
  },
}; 