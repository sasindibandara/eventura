import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { serviceRequestService } from "@/services/serviceRequestService";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentService } from "@/services/paymentService";
import { PaymentResponse } from "@/types/common";
import { useQuery } from "@tanstack/react-query";
import { providerService } from "@/services/providerService";
import ProviderProfileForm from "@/components/ProviderProfileForm";
import { ProviderProfileRequest } from "@/types/provider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Image, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portfolioService } from "@/services/portfolioService";
import { PortfolioResponse } from "@/types/portfolio";
import { pitchService } from "@/services/pitchService";
import { PitchResponse } from "@/types/pitch";

const ProviderDashboard = () => {
  const { authState } = useAuth();
  const { user } = authState;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [showWelcomeStep, setShowWelcomeStep] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [pitchStatuses, setPitchStatuses] = useState<Record<number, string>>({});

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["providerPayments"],
    queryFn: () => paymentService.getProviderPayments(0, 100),
    enabled: authState.isAuthenticated && user?.role === "PROVIDER",
  });

  const totalEarnings = paymentsData?.content
    ?.filter((p: PaymentResponse) => p.paymentStatus === "COMPLETED")
    .reduce((sum: number, p: PaymentResponse) => sum + p.amount, 0) || 0;

  const fetchRequests = async () => {
    try {
      const response = await serviceRequestService.getAvailableRequests(0, 2, serviceType === "ALL" ? undefined : serviceType);
      setRequests(response.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [serviceType]);

  const handleProfileSubmit = async (data: ProviderProfileRequest) => {
    setProfileError(null);
    setIsSubmitting(true);
    try {
      await providerService.createProfile(data);
      setShowProfileModal(false); // Close setup modal
      setShowSuccessModal(true); // Show success modal
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkProfile = async () => {
      try {
        await providerService.getProfile();
      } catch (err) {
        if (err instanceof Error && err.message.includes("Provider not found")) {
          setShowProfileModal(true);
        }
      } finally {
        setProfileChecked(true);
      }
    };
    if (authState.isAuthenticated && authState.user?.role === "PROVIDER") {
      checkProfile();
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.role]);

  const handleViewAllRequests = async () => {
    try {
      setIsLoading(true);
      const response = await serviceRequestService.getAvailableRequests(0, 10, serviceType === "ALL" ? undefined : serviceType);
      navigate("/all-requests", { 
        state: { 
          initialRequests: response.content,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          currentPage: 0,
          serviceType: serviceType
        } 
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch all requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequestDetails = async (requestId: number) => {
    try {
      setIsDetailsLoading(true);
      const requestDetails = await serviceRequestService.getRequestById(requestId);
      setSelectedRequest(requestDetails);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch request details",
        variant: "destructive",
      });
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Fetch providerId on mount
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!authState.user?.id) return;
      try {
        const id = await portfolioService.getProviderIdByUserId(authState.user.id);
        setProviderId(id);
      } catch (error) {
        console.error("Failed to fetch provider ID:", error);
      }
    };
    if (authState.isAuthenticated && authState.user?.role === "PROVIDER") {
      fetchProviderId();
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.role]);

  // Fetch portfolio data
  const { data: portfolioData, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ["providerPortfolios", providerId],
    queryFn: () => portfolioService.getProviderPortfolios(providerId!, 0, 2),
    enabled: !!providerId,
  });

  // Fetch pitches data
  const { data: pitchesData, isLoading: isPitchesLoading } = useQuery({
    queryKey: ["providerPitches", providerId],
    queryFn: () => pitchService.getMyPitches(0, 5),
    enabled: !!providerId,
  });

  // Fetch pitch statuses
  useEffect(() => {
    const fetchPitchStatuses = async () => {
      if (!pitchesData?.content) return;
      const statusPromises = pitchesData.content.map(pitch => 
        pitchService.getPitchStatus(pitch.id)
          .then(status => ({ id: pitch.id, status }))
          .catch(() => ({ id: pitch.id, status: "UNKNOWN" }))
      );
      const results = await Promise.all(statusPromises);
      const newStatuses = results.reduce((acc, { id, status }) => ({
        ...acc,
        [id]: status
      }), {});
      setPitchStatuses(newStatuses);
    };

    if (pitchesData?.content) {
      fetchPitchStatuses();
    }
  }, [pitchesData?.content]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "WIN":
        return "default";
      case "LOSE":
        return "destructive";
      case "PENDING":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Fetch service requests
  const { data: requestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["serviceRequests", serviceType],
    queryFn: () => serviceRequestService.getAvailableRequests(0, 5, serviceType === "ALL" ? undefined : serviceType),
    enabled: !!providerId,
  });

  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
          {/* Profile Setup Modal */}
      <Dialog open={showProfileModal}>
            <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
                <DialogTitle>Welcome to Eventura!</DialogTitle>
            <DialogDescription>
                  {showWelcomeStep 
                    ? "Let's set up your provider profile to start receiving bookings."
                    : "Complete your profile to access the dashboard."}
            </DialogDescription>
          </DialogHeader>
          {showWelcomeStep ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground max-w-sm">
                    Set up your provider profile to showcase your services and start receiving bookings. This only takes a minute!
                </p>
                <Button size="lg" onClick={() => setShowWelcomeStep(false)}>
                  Get Started
                </Button>
              </div>
          ) : (
            <>
              {profileError && (
                    <div className="bg-destructive/10 p-4 rounded-lg flex items-center gap-2 text-destructive mb-4">
                      <AlertCircle className="w-5 h-5" />
                      <span>{profileError}</span>
                </div>
              )}
              <ProviderProfileForm
                onSubmit={handleProfileSubmit}
                submitLabel="Create Profile"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

          {/* Success Modal */}
      <Dialog open={showSuccessModal}>
            <DialogContent className="sm:max-w-[400px]">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <DialogTitle className="text-center">Profile Created Successfully!</DialogTitle>
                <p className="text-center text-muted-foreground">
                  Your provider profile is now ready. You can start receiving bookings!
                </p>
                <Button onClick={() => setShowSuccessModal(false)}>Continue to Dashboard</Button>
          </div>
        </DialogContent>
      </Dialog>

          {/* Main Dashboard */}
          <div className={cn("min-h-screen bg-background", (showProfileModal || showSuccessModal) && "pointer-events-none opacity-50")}>
            <div className="container mx-auto bg-gray-200 rounded-2xl px-4 py-8 space-y-8">
              {/* Header Section */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">Provider Dashboard</h1>
                  <p className="text-muted-foreground">
                    Welcome back, {user?.firstName}! Here's an overview of your business.
                  </p>
                </div>
                
                {/* Quick Access Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/provider/profile")}
                  >
                    <User className="h-4 w-4" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/all-pitches")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    View All Pitches
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/provider/portfolio")}
                  >
                    <Image className="h-4 w-4" />
                    Manage Portfolio
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer" onClick={() => navigate("/earnings")}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lifetime earnings from completed bookings
                    </p>
                </CardContent>
              </Card>

                <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer" onClick={() => navigate("/ongoing-work")}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Ongoing Work</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {requestsData?.content.filter(request => 
                        request.status === "ASSIGNED" && request.assignedProviderId === authState.user?.id
                      ).length || 0}
                  </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active projects in progress
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer" onClick={() => navigate("/profile")}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Active</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your profile is visible to clients
                    </p>
                </CardContent>
              </Card>
            </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  <TabsTrigger value="pitches">Pitches</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent Requests */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                        <CardDescription>Latest service requests you can pitch for</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                    ) : requests.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No new requests available
                      </div>
                    ) : (
                      requests.map((request) => (
                              <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-medium">{request.title}</h3>
                                    <Badge variant={request.status === "OPEN" ? "default" : "secondary"}>
                                      {request.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                {format(new Date(request.eventDate), "MMMM d, yyyy")}
                              </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>${request.budget.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{request.location}</span>
                          </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewRequestDetails(request.id)}
                          >
                                  View
                          </Button>
                        </div>
                      ))
                    )}
                  <Button 
                    variant="outline" 
                            className="w-full"
                    onClick={handleViewAllRequests}
                    disabled={isLoading}
                  >
                            View All Requests
                  </Button>
                        </div>
                </CardContent>
              </Card>

                    {/* Upcoming Bookings */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                        <CardDescription>Your confirmed events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                          <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">Johnson Wedding</h3>
                                <Badge variant="secondary">In 30 days</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                June 22, 2025
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Grand Hotel, Seattle</span>
                                <span>•</span>
                                <span>Sarah Johnson</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </div>
                          <Button variant="outline" className="w-full">
                            View Calendar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                      </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                  <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                    <CardHeader>
                      <div className="flex flex-col gap-4">
                        <div>
                          <CardTitle>Service Requests</CardTitle>
                          <CardDescription>Browse and respond to service requests</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={serviceType === "ALL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceType("ALL")}
                          >
                            All
                          </Button>
                          <Button
                            variant={serviceType === "PHOTOGRAPHY" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceType("PHOTOGRAPHY")}
                          >
                            Photography
                          </Button>
                          <Button
                            variant={serviceType === "CATERING" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceType("CATERING")}
                          >
                            Catering
                          </Button>
                          <Button
                            variant={serviceType === "VENUE" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceType("VENUE")}
                          >
                            Venue
                          </Button>
                          <Button
                            variant={serviceType === "DECORATION" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceType("DECORATION")}
                          >
                            Decoration
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isRequestsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          </div>
                        ) : requestsData?.content.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No service requests available
                          </div>
                        ) : (
                          requestsData?.content.map((request) => (
                            <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">{request.title}</h3>
                                  <Badge variant={request.status === "OPEN" ? "default" : "secondary"}>
                                    {request.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(request.eventDate), "MMMM d, yyyy")}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>${request.budget.toLocaleString()}</span>
                                  <span>•</span>
                                  <span>{request.location}</span>
                                  <span>•</span>
                                  <span>{request.serviceType}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {request.description}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewRequestDetails(request.id)}
                                >
                                  View Details
                                </Button>
                                {request.status === "OPEN" && (
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/requests/${request.id}/pitch`)}
                                  >
                                    Submit Pitch
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleViewAllRequests}
                          disabled={isRequestsLoading}
                        >
                          View All Requests
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                  <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                    <CardHeader>
                      <CardTitle>Your Bookings</CardTitle>
                      <CardDescription>Manage your confirmed bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Add your bookings table or list here */}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pitches" className="space-y-4">
                  <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                    <CardHeader>
                      <CardTitle>Your Pitches</CardTitle>
                      <CardDescription>Track and manage your service proposals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isPitchesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          </div>
                        ) : pitchesData?.content.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No pitches submitted yet
                          </div>
                        ) : (
                          pitchesData?.content.map((pitch) => (
                            <div key={pitch.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">Pitch #{pitch.id}</h3>
                                  {pitchStatuses[pitch.id] && (
                                    <Badge variant={getStatusBadgeVariant(pitchStatuses[pitch.id])}>
                                      {pitchStatuses[pitch.id]}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(pitch.createdAt), "MMMM d, yyyy")}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Your Quote: ${pitch.proposedPrice.toLocaleString()}</span>
                                  <span>•</span>
                                  <span>Submitted: {format(new Date(pitch.createdAt), "MMM d, yyyy")}</span>
                    </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {pitch.pitchDetails}
                                </p>
                  </div>
                  <Button 
                    variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/requests/${pitch.requestId}/pitches`)}
                              >
                                View Details
                              </Button>
                            </div>
                          ))
                        )}
                      <Button 
                        variant="outline" 
                          className="w-full" 
                    onClick={() => navigate("/all-pitches")}
                  >
                    View All Pitches
                  </Button>
                      </div>
                </CardContent>
              </Card>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Profile Overview */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                        <CardTitle>Profile Overview</CardTitle>
                        <CardDescription>Your public provider profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                        <div>
                              <h3 className="font-medium">{user?.firstName} {user?.lastName}</h3>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Profile Status</span>
                              <Badge variant="default">Active</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Verification Status</span>
                              <Badge variant="secondary">Verified</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Member Since</span>
                              <span className="text-sm">January 2024</span>
                            </div>
                          </div>
                          <Button className="w-full" onClick={() => navigate("/provider/profile")}>
                            Edit Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Portfolio Preview */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                      <CardHeader>
                        <CardTitle>Portfolio Preview</CardTitle>
                        <CardDescription>Your showcased work and services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {isPortfolioLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                          ) : portfolioData?.content.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No portfolio items yet
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {portfolioData?.content.slice(0, 2).map((item) => (
                                <div key={item.id} className="aspect-square rounded-lg overflow-hidden relative group">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <Image className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white text-sm text-center px-2">{item.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Portfolio Items</span>
                              <span className="text-sm font-medium">{portfolioData?.totalElements || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Service Categories</span>
                              <span className="text-sm font-medium">
                                {portfolioData?.content
                                  ? [...new Set(portfolioData.content.map(item => item.eventType))]
                                    .join(", ") || "None"
                                  : "None"
                                }
                        </span>
                      </div>
                      </div>
                          <Button variant="outline" className="w-full" onClick={() => navigate("/provider/portfolio")}>
                            Manage Portfolio
                          </Button>
                    </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earnings Summary */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                      <CardHeader>
                        <CardTitle>Earnings Summary</CardTitle>
                        <CardDescription>Overview of your earnings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                              <p className="text-2xl font-bold">${totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Pending Earnings</p>
                              <p className="text-2xl font-bold">
                                ${paymentsData?.content
                                  ?.filter((p: PaymentResponse) => p.paymentStatus === "PENDING")
                                  .reduce((sum: number, p: PaymentResponse) => sum + p.amount, 0)
                                  .toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                          </div>
                        </div>
                </CardContent>
              </Card>

                    {/* Recent Activity */}
                    <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest payment transactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {isPaymentsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                          ) : paymentsData?.content.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No payment history available
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {paymentsData?.content.map((payment) => (
                                <div key={payment.id} className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-gray-200">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium">Payment #{payment.id}</h3>
                                      <Badge variant={
                                        payment.paymentStatus === "COMPLETED" ? "default" :
                                        payment.paymentStatus === "PENDING" ? "secondary" :
                                        payment.paymentStatus === "FAILED" ? "destructive" :
                                        "outline"
                                      }>
                                        {payment.paymentStatus}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(payment.createdAt), "MMMM d, yyyy")}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium">${payment.amount.toLocaleString()}</span>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                                      </span>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate(`/payments/${payment.id}`)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate("/earnings")}
                        >
                              View All Payments
                        </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Statistics */}
                  <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                      <CardTitle>Payment Statistics</CardTitle>
                      <CardDescription>Breakdown of your earnings</CardDescription>
                </CardHeader>
                <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Completed Payments</p>
                              <p className="text-2xl font-bold">
                                {paymentsData?.content.filter(p => p.paymentStatus === "COMPLETED").length || 0}
                              </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border bg-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                              <p className="text-2xl font-bold">
                                {paymentsData?.content.filter(p => p.paymentStatus === "PENDING").length || 0}
                              </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border bg-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                              <p className="text-2xl font-bold">
                                {paymentsData?.content.filter(p => p.paymentStatus === "FAILED").length || 0}
                              </p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-500" />
                          </div>
                        </div>
                      </div>
                </CardContent>
              </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Request Details Dialog */}
          <Dialog open={selectedRequest !== null} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Request Details</DialogTitle>
                <DialogDescription>
                  Detailed information about the service request
                </DialogDescription>
              </DialogHeader>
              {isDetailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : selectedRequest && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p>{selectedRequest.title}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                      <p>{format(new Date(selectedRequest.eventDate), "MMMM d, yyyy")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p>{selectedRequest.location}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Budget</p>
                      <p>${selectedRequest.budget.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                      <p>{selectedRequest.serviceType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={selectedRequest.status === "OPEN" ? "default" : "secondary"}>
                          {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedRequest.description}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => navigate(`/requests/${selectedRequest.id}`)}
                    >
                      View Full Details
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
