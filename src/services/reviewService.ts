import { getAuthToken } from "@/utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface ReviewRequest {
  requestId: number;
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: number;
  requestId: number;
  clientId: number;
  providerId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

class ReviewService {
  async createReview(data: ReviewRequest): Promise<ReviewResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Request or provider not found");
      }
      throw new Error("Failed to create review");
    }
    return await response.json();
  }
}

export const reviewService = new ReviewService(); 