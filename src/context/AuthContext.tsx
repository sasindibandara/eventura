import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { AuthContextType, AuthState, LoginRequest, RegisterRequest, UpdateUserRequest } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import SuspensionPopup from "@/components/SuspensionPopup";

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Action types
type AuthAction =
  | { type: "LOGIN_SUCCESS"; payload: { token: string } }
  | { type: "LOGIN_FAILURE"; payload: { error: string } }
  | { type: "REGISTER_SUCCESS" }
  | { type: "REGISTER_FAILURE"; payload: { error: string } }
  | { type: "USER_LOADED"; payload: { user: any } }
  | { type: "USER_UPDATED"; payload: { user: any } }
  | { type: "UPDATE_FAILURE"; payload: { error: string } }
  | { type: "AUTH_ERROR" }
  | { type: "LOGOUT" }
  | { type: "ACCOUNT_DELETED" }
  | { type: "CLEAR_ERROR" };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "USER_LOADED":
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user,
      };
    case "USER_UPDATED":
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case "REGISTER_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
    case "UPDATE_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload.error,
      };
    case "AUTH_ERROR":
    case "LOGOUT":
    case "ACCOUNT_DELETED":
      authService.removeToken();
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { toast } = useToast();
  const [showSuspensionPopup, setShowSuspensionPopup] = useState(false);

  // Check user status and show suspension popup if needed
  useEffect(() => {
    if (state.user?.accountStatus === "SUSPENDED") {
      setShowSuspensionPopup(true);
    }
  }, [state.user]);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();

      if (!token) {
        dispatch({ type: "AUTH_ERROR" });
        return;
      }

      try {
        const user = await authService.getUserInfo(token);
        dispatch({ type: "USER_LOADED", payload: { user } });
        
        // Check if user is suspended
        if (user.accountStatus === "SUSPENDED") {
          setShowSuspensionPopup(true);
        }
      } catch (error) {
        dispatch({ type: "AUTH_ERROR" });
      }
    };

    loadUser();
  }, []);

  // Show loading state while checking authentication
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Login
  const login = async (data: LoginRequest) => {
    try {
      const token = await authService.login(data);
      authService.saveToken(token);
      
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token },
      });

      const user = await authService.getUserInfo(token);
      dispatch({ type: "USER_LOADED", payload: { user } });

      // Check if user is suspended
      if (user.accountStatus === "SUSPENDED") {
        setShowSuspensionPopup(true);
        toast({
          title: "Account Suspended",
          description: "Your account has been suspended. Please contact admin for assistance.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.firstName}!`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      dispatch({
        type: "LOGIN_FAILURE",
        payload: { error: errorMessage },
      });
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Register
  const register = async (data: RegisterRequest) => {
    try {
      await authService.register(data);
      
      dispatch({
        type: "REGISTER_SUCCESS",
      });

      // Only show success toast if registration was successful
      toast({
        title: "Registration successful",
        description: "Please login with your credentials",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      dispatch({
        type: "REGISTER_FAILURE",
        payload: { error: errorMessage },
      });
      
      // Only show error toast if it's not an email conflict (which is handled in the form)
      if (!errorMessage.includes("Email already exists")) {
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (data: UpdateUserRequest) => {
    const token = authService.getToken();
    
    if (!token) {
      dispatch({ type: "AUTH_ERROR" });
      toast({
        title: "Authentication error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedUser = await authService.updateProfile(token, data);
      dispatch({
        type: "USER_UPDATED",
        payload: { user: updatedUser },
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      dispatch({
        type: "UPDATE_FAILURE",
        payload: { error: errorMessage },
      });
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete account
  const deleteAccount = async () => {
    const token = authService.getToken();
    
    if (!token) {
      dispatch({ type: "AUTH_ERROR" });
      return;
    }
    
    try {
      await authService.deleteAccount(token);
      dispatch({ type: "ACCOUNT_DELETED" });
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      toast({
        title: "Deletion failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Logout
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <AuthContext.Provider
      value={{
        authState: state,
        login,
        register,
        logout,
        clearError,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
      <SuspensionPopup 
        isOpen={showSuspensionPopup} 
        onClose={() => setShowSuspensionPopup(false)} 
      />
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
