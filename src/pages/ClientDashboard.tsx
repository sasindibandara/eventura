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
  MessageSquare,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ClientDashboard = () => {
  const { authState } = useAuth();
  const { user } = authState;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequestResponse | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await serviceRequestService.getMyRequests(0, 10);
      setRequests(response.content);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
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
  }, []);

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      await serviceRequestService.deleteRequest(requestToDelete.id);
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
      fetchRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setRequestToDelete(null);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "OPEN":
        return "default";
      case "ASSIGNED":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const assignedRequests = requests.filter(request => request.status === "ASSIGNED");
  const activeRequests = requests.filter(request => request.status === "OPEN");
  const ongoingRequests = requests.filter(request => request.status === "ASSIGNED");
  const completedRequests = requests.filter(request => request.status === "COMPLETED");

  return (
   
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mt-8 bg-white rounded-2xl mx-auto px-4 py-8">
        <div className="bg-gray-200 rounded-2xl shadow-lg p-6 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col  gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.firstName}! Manage your event planning and service requests.
          </p>
            </div>
            
            {/* Quick Access Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/profile")}
              >
                <User className="h-4 w-4" />
                View Profile
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/providers")}
              >
                <Briefcase className="h-4 w-4" />
                Browse Providers
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/create-request")}
              >
                <MessageSquare className="h-4 w-4" />
                Create Request
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card 
              className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer"
              onClick={() => navigate("/requests")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total service requests created
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer"
              onClick={() => navigate("/requests")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently open requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer"
              onClick={() => navigate("/ongoing-requests")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ongoing Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ongoingRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requests in progress
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer"
              onClick={() => navigate("/ongoing-requests?tab=completed")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Requests</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully completed requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300 cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your profile is visible to providers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Active Requests */}
                <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                  <CardHeader>
                    <CardTitle>Active Requests</CardTitle>
                    <CardDescription>Your open service requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        </div>
                      ) : activeRequests.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No active requests found
                        </div>
                      ) : (
                        activeRequests.map((request) => (
                          <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{request.title}</h3>
                                <Badge variant={getStatusBadgeVariant(request.status)}>
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
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequestDetails(request.id)}
                              >
                                View
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRequestToDelete(request)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
              </div>
                        ))
                      )}
              <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/requests")}
                      >
                        View All Requests
              </Button>
            </div>
          </CardContent>
        </Card>

          {/* Assigned Requests */}
                <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
            <CardHeader>
              <CardTitle>Assigned Requests</CardTitle>
              <CardDescription>Requests with assigned providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        </div>
                ) : assignedRequests.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                    No assigned requests found
                  </div>
                ) : (
                  assignedRequests.map((request) => (
                          <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{request.title}</h3>
                                <Badge variant={getStatusBadgeVariant(request.status)}>
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
                        onClick={() => navigate("/requests")}
                      >
                        View All Requests
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                  <CardTitle>All Requests</CardTitle>
                  <CardDescription>Manage your service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No requests found
                      </div>
                    ) : (
                      requests.map((request) => (
                        <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{request.title}</h3>
                              <Badge variant={getStatusBadgeVariant(request.status)}>
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
                  </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRequestDetails(request.id)}
                            >
                              View
                            </Button>
                            {request.status === "OPEN" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRequestToDelete(request)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                        )}
                  </div>
                </div>
                  ))
                )}
              <Button 
                variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/create-request")}
              >
                      Create New Request
              </Button>
                  </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
            <CardHeader>
                  <CardTitle>Ongoing Requests</CardTitle>
                  <CardDescription>Requests that are currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : ongoingRequests.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No ongoing requests found
                  </div>
                ) : (
                      ongoingRequests.map((request) => (
                        <div key={request.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gray-200">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{request.title}</h3>
                              <Badge variant={getStatusBadgeVariant(request.status)}>
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
                            {request.assignedProviderId && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Provider ID: {request.assignedProviderId}</span>
                              </div>
                            )}
                    </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRequestDetails(request.id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/requests/${request.id}/chat`)}
                            >
                              Chat
                            </Button>
                  </div>
                </div>
                  ))
                )}
              <Button 
                variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/ongoing-requests")}
              >
                      View All Ongoing Requests
              </Button>
                  </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
            <CardHeader>
              <CardTitle>Recommended Providers</CardTitle>
              <CardDescription>Top-rated professionals for your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-gray-200">
                  <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                      LP
                    </div>
                    <div>
                          <h3 className="font-medium">Luxury Photography</h3>
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                            <span className="ml-1 text-sm text-muted-foreground">(24 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                    <div className="p-4 rounded-lg border bg-gray-200">
                  <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                      DP
                    </div>
                    <div>
                          <h3 className="font-medium">Divine Planners</h3>
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="h-4 w-4 text-yellow-400" fill={i < 4 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                            <span className="ml-1 text-sm text-muted-foreground">(18 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                    onClick={() => navigate("/providers")}
              >
                Browse All Providers
              </Button>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card className="bg-gray-200 border border-gray-200 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:bg-gray-300">
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                  <CardDescription>Your client profile information</CardDescription>
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
                        <span className="text-sm text-muted-foreground">Member Since</span>
                        <span className="text-sm">January 2024</span>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => navigate("/profile")}>
                      Edit Profile
                    </Button>
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
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
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
                  onClick={() => navigate("/requests")}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service request
              "{requestToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDashboard;
