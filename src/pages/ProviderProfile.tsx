import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProviderProfileRequest, ProviderProfileResponse } from "@/types/provider";
import { providerService } from "@/services/providerService";
import ProviderProfileForm from "@/components/ProviderProfileForm";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioService } from "@/services/portfolioService";
import { PortfolioResponse } from "@/types/portfolio";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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

const ProviderProfile = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "Provider Profile | Eventura";
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await providerService.getProfile();
        setProfile(data);
      } catch (error) {
        // If profile doesn't exist, that's okay - we'll show the create form
        if (error instanceof Error && error.message === "Provider not found") {
          setProfile(null);
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      loadProfile();
    } else {
      navigate("/login");
    }
  }, [authState.isAuthenticated, navigate, toast]);

  useEffect(() => {
    const checkProfileAndFetchPortfolio = async () => {
      if (!authState.user?.id) return;
      try {
        // Check if profile exists
        await providerService.getProfile();
        setProfileExists(true);
        // Get providerId
        const id = await portfolioService.getProviderIdByUserId(authState.user.id);
        setProviderId(id);
        // Fetch portfolio
        setPortfolioLoading(true);
        const page = await portfolioService.getProviderPortfolios(id, 0, 10);
        setPortfolio(page.content);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Provider not found")) {
          setProfileExists(false);
        } else {
          setProfileExists(null);
        }
      } finally {
        setPortfolioLoading(false);
      }
    };
    if (authState.isAuthenticated && authState.user?.role === "PROVIDER") {
      checkProfileAndFetchPortfolio();
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.role]);

  const handleSubmit = async (data: ProviderProfileRequest) => {
    try {
      if (profile) {
        const updatedProfile = await providerService.updateProfile(data);
        setProfile(updatedProfile);
        setIsEditing(false);
      } else {
        const newProfile = await providerService.createProfile(data);
        setProfile(newProfile);
      }
    } catch (error) {
      throw error; // Let the form handle the error display
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Profile Header */}
                <div className={cn("h-64 relative", getRoleGradient(authState.user?.role || 'PROVIDER'))}>
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
                    getRoleBadgeColor(authState.user?.role || 'PROVIDER')
                  )}>
                    {authState.user?.role}
                  </div>

                  <div className="mb-10">
                    <h2 className="text-3xl font-medium text-[#2c2c2c] mb-1.5">
                      Hello, {authState.user?.firstName}
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
                    <p className="text-lg text-gray-600 font-normal mt-2">Welcome to your provider profile.</p>
                  </div>

                  {profile && !isEditing ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Company Name</Label>
                          <div className="text-base font-medium">{profile.companyName}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Service Type</Label>
                          <div className="text-base font-medium">{profile.serviceType}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Address</Label>
                          <div className="text-base font-medium">{profile.address}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Mobile Number</Label>
                          <div className="text-base font-medium">{profile.mobileNumber}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Badge variant={profile.isVerified ? "default" : "secondary"}>
                            {profile.isVerified ? "Verified Provider" : "Pending Verification"}
                          </Badge>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => navigate("/dashboard")}>
                            Back to Dashboard
                          </Button>
                          <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <ProviderProfileForm
                        initialData={profile || undefined}
                        onSubmit={handleSubmit}
                        submitLabel={profile ? "Update Profile" : "Create Profile"}
                      />
                      {profile && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-6 left-12 text-xs text-gray-500 tracking-wider">
                    Copyright © Eventura. ALL RIGHTS RESERVED
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
                <div className="p-6">
                  <h2 className="text-2xl font-medium text-[#2c2c2c] mb-6">My Portfolio</h2>
                  {profileExists ? (
                    <>
                      {portfolioLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : portfolio.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No portfolio items found.</div>
                      ) : (
                        <div className="space-y-6">
                          {portfolio.map((item) => (
                            <Card key={item.id} className="overflow-hidden border border-gray-200">
                              <div className="aspect-video relative">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                <CardDescription>
                                  {item.projectDate} • {item.eventType}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      <Button className="w-full mt-6" onClick={() => navigate("/provider/portfolio")}>
                        Manage Portfolio
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Set up your provider profile to view and manage your portfolio.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile; 