export type UserRole = "CLIENT" | "PROVIDER" | "ADMIN";

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string | null;
  role: UserRole;
  accountStatus: string;
  address?: string;
  bio?: string;
  createdAt: string;
} 