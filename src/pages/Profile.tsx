import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UpdateUserRequest } from "@/types/auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { User, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";

const Profile = () => {
  const { authState, updateProfile, deleteAccount } = useAuth();
  const { isAuthenticated, user, loading } = authState;
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "My Profile | Eventura";

    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData: UpdateUserRequest = {
        ...formData,
        ...(password ? { password } : {})
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
      setPassword("");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
      });
    }
    setPassword("");
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAccount();
      navigate("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-br from-[#849fe3] to-[#4a6eb0]';
      case 'CLIENT':
        return 'bg-gradient-to-br from-[#8184b3] to-[#4a6eb0]';
      case 'PROVIDER':
        return 'bg-gradient-to-br from-[#849fe3] to-[#8184b3]';
      default:
        return 'bg-gradient-to-br from-[#849fe3] to-[#4a6eb0]';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-[#849fe3] border-[#849fe3]';
      case 'CLIENT':
        return 'text-[#8184b3] border-[#8184b3]';
      case 'PROVIDER':
        return 'text-[#4a6eb0] border-[#4a6eb0]';
      default:
        return 'text-[#849fe3] border-[#849fe3]';
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center">
              <BackButton />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>
          <div className="rounded-2xl shadow-xl overflow-hidden">
            {/* Profile Header */}
            <div className={cn("h-64 relative", getRoleGradient(user?.role || 'ADMIN'))}>
              <div className="absolute right-16 top-8">
                <div className="w-40 h-40 rounded-full bg-white/20 border-4 border-white/20 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-20 h-20 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-12 relative">
              <div className={cn(
                "absolute -top-4 right-10 bg-white rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg",
                getRoleBadgeColor(user?.role || 'ADMIN')
              )}>
                {user?.role}
              </div>


              <div className="mb-10">
                <h2 className="text-3xl font-medium text-[#2c2c2c] mb-1.5">
                  Hello, {user?.firstName}
                </h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Active Now</span>
                  </div>
                  <span className="text-sm">•</span>
                  <div className="text-sm">
                    Member since {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                </div>
                <p className="text-lg text-gray-600 font-normal mt-2">Welcome to your profile.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">First Name</Label>
                    <Input
                      name="firstName"
                      value={formData.firstName} 
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={cn(
                        "bg-transparent border-gray-200 text-base h-10",
                        !isEditing && "border-none"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">Last Name</Label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={cn(
                        "bg-transparent border-gray-200 text-base h-10",
                        !isEditing && "border-none"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={cn(
                        "bg-transparent border-gray-200 text-base h-10",
                        !isEditing && "border-none"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">Mobile Number</Label>
                    <Input
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={cn(
                        "bg-transparent border-gray-200 text-base h-10",
                        !isEditing && "border-none"
                      )}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-gray-500">
                      New Password <span className="text-sm text-gray-500">(leave blank to keep current password)</span>
                    </Label>
                    <Input
                      name="password"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="bg-transparent border-gray-200 text-base h-10"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="gap-2 h-9"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-9"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="h-9">
                        Save Changes
                      </Button>
                    </>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2 h-9">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteConfirm}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>

              <div className="absolute bottom-6 left-12 text-xs text-gray-500 tracking-wider">
                Copyright © Eventura. ALL RIGHTS RESERVED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
