
export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  authState: AuthState;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (data: UpdateUserRequest) => Promise<void>;
  deleteAccount: () => Promise<void>;
}
