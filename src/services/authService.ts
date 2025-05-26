import { LoginRequest, RegisterRequest, UpdateUserRequest, User } from "@/types/auth";

const API_URL = "http://localhost:8080/api";

export const authService = {
  async register(data: RegisterRequest): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Email already exists");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Registration failed");
    }
  },

  async login(data: LoginRequest): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password");
        }
        throw new Error("Login failed");
      }

      const token = await response.text();
      return token;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Login failed");
    }
  },

  async getUserInfo(token: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to get user info");
    }
  },

  async updateProfile(token: string, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Email already in use");
        }
        throw new Error("Failed to update profile");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update profile");
    }
  },

  async deleteAccount(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete account");
    }
  },

  saveToken(token: string): void {
    localStorage.setItem("token", token);
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  removeToken(): void {
    localStorage.removeItem("token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  },

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.parseJwt(token);
    return payload?.role || null;
  }
};
