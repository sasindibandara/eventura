import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { serviceRequestService } from "@/services/serviceRequestService";
import { userService } from "@/services/userService";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { UserResponse } from "@/types/user";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, CheckCircle2, Clock, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { paymentService } from "@/services/paymentService";
import { reviewService } from "@/services/reviewService";
import BackButton from "@/components/BackButton";

const OngoingRequests = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<UserResponse | null>(null);
  const [isProviderDetailsOpen, setIsProviderDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<ServiceRequestResponse | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(tabParam === "completed" ? "completed" : "assigned");
  const queryClient = useQueryClient();
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState<number | null>(null);
  const [reviewProviderId, setReviewProviderId] = useState<number | null>(null);

  useEffect(() => {
    if (tabParam !== tab) {
      setSearchParams({ tab });
    }
    // eslint-disable-next-line
  }, [tab]);

  const handleTabChange = (value: string) => {
    setTab(value);
    setSearchParams({ tab: value });
  };

  // Fetch requests with React Query
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => serviceRequestService.getMyRequests(0, 100),
    enabled: authState.isAuthenticated && authState.user?.role === "CLIENT",
  });
      
  // Fetch payment statuses with React Query
  const { data: paymentStatuses = {} } = useQuery({
    queryKey: ['paymentStatuses', requestsData?.content],
    queryFn: async () => {
      if (!requestsData?.content) return {};
      const statuses: Record<number, string> = {};
      await Promise.all(
        requestsData.content.map(async (req) => {
          try {
            const payment = await paymentService.getPaymentStatusByRequestId(req.id);
            statuses[req.id] = payment.paymentStatus;
          } catch {
            statuses[req.id] = "NONE";
          }
        })
      );
      return statuses;
    },
    enabled: !!requestsData?.content,
  });

  useEffect(() => {
    if (!authState.isAuthenticated || authState.user?.role !== "CLIENT") {
      navigate("/login", { state: { from: "/ongoing-requests" } });
      return;
    }
  }, [authState.isAuthenticated, authState.user?.role, navigate]);

  const handleViewProviderDetails = async (request: ServiceRequestResponse) => {
    try {
      if (!request.assignedProviderId) {
        toast({
          title: "Error",
          description: "No provider assigned to this request",
          variant: "destructive",
        });
        return;
      }

      const provider = await userService.getUserById(request.assignedProviderId);
      setSelectedProvider(provider);
      setIsProviderDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch provider details",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePay = (request: ServiceRequestResponse) => {
    setPaymentRequest(request);
    setIsPaymentOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRequest) return;

    setProcessingPayment(paymentRequest.id);
    try {
      await paymentService.createPayment({
        requestId: paymentRequest.id,
        amount: paymentRequest.budget,
        paymentMethod: "CREDIT_CARD",
      });
      toast({ title: "Payment initiated!" });
      setIsPaymentOpen(false);
      // Invalidate and refetch payment statuses
      await queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
      // Open review modal after payment
      setReviewRequestId(paymentRequest.id);
      setReviewProviderId(paymentRequest.assignedProviderId);
      setIsReviewOpen(true);
      setReviewRating(0);
      setReviewComment("");
      setReviewError(null);
      setReviewSuccess(false);
    } catch (error) {
      toast({ title: "Payment failed", variant: "destructive" });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequestId || !reviewProviderId) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await reviewService.createReview({
        requestId: reviewRequestId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      setTimeout(() => setIsReviewOpen(false), 1500);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusSummary = () => {
    if (!requestsData?.content) return { assigned: 0, completed: 0, pending: 0 };
    
    return {
      assigned: requestsData.content.filter(r => r.status === "ASSIGNED").length,
      completed: requestsData.content.filter(r => r.status === "COMPLETED").length,
      pending: requestsData.content.filter(r => 
        r.status === "COMPLETED" && 
        (!paymentStatuses[r.id] || paymentStatuses[r.id] !== "COMPLETED")
      ).length
    };
  };

  const statusSummary = getStatusSummary();

  if (!authState.isAuthenticated || authState.user?.role !== "CLIENT") {
    return null;
  }

  const assignedRequests = requestsData?.content.filter(r => r.status === "ASSIGNED") || [];
  const completedRequests = requestsData?.content.filter(r => r.status === "COMPLETED") || [];
  const totalElements = requestsData?.totalElements || 0;
  const totalPages = requestsData?.totalPages || 0;

  const paymentCompleteRequests = requestsData?.content.filter(
    r =>
      r.status === "ASSIGNED" &&
      paymentStatuses[r.id] === "COMPLETED"
  ) || [];

  const paymentPendingRequests = requestsData?.content.filter(
    r => paymentStatuses[r.id] === "PENDING"
  ) || [];

  const handleMarkAsComplete = async (request) => {
    try {
      await serviceRequestService.updateRequestStatus(request.id, "COMPLETED");
      toast({ title: "Request marked as completed!" });
      // Refetch requests and payment statuses
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
    } catch (error) {
      toast({ title: "Failed to mark as complete", variant: "destructive" });
    }
  };

  const handlePaymentComplete = async (request) => {
    try {
      // Get payment info for this request
      const payment = await paymentService.getPaymentStatusByRequestId(request.id);
      await paymentService.updatePaymentStatus(payment.id, "COMPLETED");
      toast({ title: "Payment marked as completed!" });
      // Refetch requests and payment statuses
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
    } catch (error) {
      toast({ title: "Failed to mark payment as complete", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <BackButton />
      </div>
      <div className="bg-white rounded-2xl shadow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ongoing Requests</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your assigned service requests
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-200 rounded-lg shadow p-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{statusSummary.assigned}</p>
                <p className="text-xs text-gray-500">Assigned</p>
              </div>
            </div>
            <div className="bg-gray-200 rounded-lg shadow p-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{statusSummary.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <div className="bg-gray-200  rounded-lg shadow p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{statusSummary.pending}</p>
                <p className="text-xs text-gray-500">Pending Payment</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="payment-pending">Payment Pending</TabsTrigger>
          </TabsList>
          <TabsContent value="assigned">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">Loading requests...</div>
              ) : assignedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No ongoing requests found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900">Title</TableHead>
                          <TableHead className="font-semibold text-gray-900">Event</TableHead>
                          <TableHead className="font-semibold text-gray-900">Date</TableHead>
                          <TableHead className="font-semibold text-gray-900">Service Type</TableHead>
                          <TableHead className="font-semibold text-gray-900">Provider</TableHead>
                          <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{request.title}</TableCell>
                            <TableCell className="text-gray-600">{request.eventName}</TableCell>
                            <TableCell className="text-gray-600">
                            {format(new Date(request.eventDate), "MMM d, yyyy")}
                          </TableCell>
                            <TableCell className="text-gray-600">{request.serviceType}</TableCell>
                          <TableCell>
                            {request.assignedProviderId ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProviderDetails(request)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                View Provider
                              </Button>
                            ) : (
                                <span className="text-gray-500">Not Assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedRequest(request)}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            >
                              View Details
                            </Button>
                          </TableCell>
                            <TableCell>
                              <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {totalElements > 20 && (
                    <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {currentPage * 20 + 1} to{" "}
                        {Math.min((currentPage + 1) * 20, totalElements)} of{" "}
                        {totalElements} requests
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">Loading requests...</div>
              ) : completedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No completed requests found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900">Title</TableHead>
                          <TableHead className="font-semibold text-gray-900">Event</TableHead>
                          <TableHead className="font-semibold text-gray-900">Date</TableHead>
                          <TableHead className="font-semibold text-gray-900">Service Type</TableHead>
                          <TableHead className="font-semibold text-gray-900">Provider</TableHead>
                          <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{request.title}</TableCell>
                            <TableCell className="text-gray-600">{request.eventName}</TableCell>
                            <TableCell className="text-gray-600">
                            {format(new Date(request.eventDate), "MMM d, yyyy")}
                          </TableCell>
                            <TableCell className="text-gray-600">{request.serviceType}</TableCell>
                          <TableCell>
                            {request.assignedProviderId ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProviderDetails(request)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                View Provider
                              </Button>
                            ) : (
                                <span className="text-gray-500">Not Assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedRequest(request)}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            >
                              View Details
                            </Button>
                          </TableCell>
                            <TableCell>
                              {paymentStatuses[request.id] === "COMPLETED" ? (
                                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Paid
                                </span>
                              ) : paymentStatuses[request.id] === "PENDING" ? (
                                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Payment Pending
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePay(request)}
                                  className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  Pay Now
                                </Button>
                              )}
                            </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {totalElements > 20 && (
                    <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {currentPage * 20 + 1} to{" "}
                        {Math.min((currentPage + 1) * 20, totalElements)} of{" "}
                        {totalElements} requests
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="payment-pending">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">Loading requests...</div>
              ) : paymentPendingRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No payment pending requests found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900">Title</TableHead>
                          <TableHead className="font-semibold text-gray-900">Event</TableHead>
                          <TableHead className="font-semibold text-gray-900">Date</TableHead>
                          <TableHead className="font-semibold text-gray-900">Service Type</TableHead>
                          <TableHead className="font-semibold text-gray-900">Provider</TableHead>
                          <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentPendingRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{request.title}</TableCell>
                            <TableCell className="text-gray-600">{request.eventName}</TableCell>
                            <TableCell className="text-gray-600">
                              {format(new Date(request.eventDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-gray-600">{request.serviceType}</TableCell>
                            <TableCell>
                              {request.assignedProviderId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProviderDetails(request)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  View Provider
                                </Button>
                              ) : (
                                <span className="text-gray-500">Not Assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePaymentComplete(request)}
                              >
                                Payment Complete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              Event: {selectedRequest?.eventName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Event Details</h4>
                <p className="text-sm text-gray-500">
                  Date: {selectedRequest?.eventDate && format(new Date(selectedRequest.eventDate), "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-gray-500">
                  Location: {selectedRequest?.location}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Service Details</h4>
                <p className="text-sm text-gray-500">
                  Type: {selectedRequest?.serviceType}
                </p>
                <p className="text-sm text-gray-500">
                  Budget: ${selectedRequest?.budget}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-1">Description</h4>
              <p className="text-sm text-gray-500">{selectedRequest?.description}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Status</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest?.status || "")}`}>
                {selectedRequest?.status}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Details Dialog */}
      <Dialog open={isProviderDetailsOpen} onOpenChange={setIsProviderDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
            <DialogDescription>
              Information about the assigned provider
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedProvider.firstName} {selectedProvider.lastName}</h3>
                  <p className="text-sm text-gray-500">{selectedProvider.role}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedProvider.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedProvider.mobileNumber || "No mobile number provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedProvider.address || "No address provided"}</span>
                </div>
              </div>
              {selectedProvider.bio && (
                <div>
                  <h4 className="font-medium mb-1">About</h4>
                  <p className="text-sm text-gray-500">{selectedProvider.bio}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Pay for <b>{paymentRequest?.title}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex gap-2 mb-2">
              <CreditCard className="w-8 h-8 text-blue-500" />
              {/* Add more icons here if desired, e.g. Visa/Mastercard SVGs */}
            </div>
            <div className="w-full border-b border-gray-200 mb-4" />
            <form onSubmit={handlePaymentSubmit} className="w-full flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentRequest?.budget || ""}
                  readOnly
                  className="w-full border rounded px-2 py-2 bg-gray-50 text-lg font-semibold text-center focus:outline-none"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full mt-2"
                disabled={processingPayment === paymentRequest?.id}
              >
                {processingPayment === paymentRequest?.id ? "Processing..." : "Pay Now"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Rate and review your experience with this provider
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            onClick={() => setIsReviewOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          {reviewSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-fade-in" />
              <div className="text-green-600 font-semibold text-lg mb-2">Thank you for your review!</div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2 justify-center text-3xl">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={
                        star <= reviewRating
                          ? "text-yellow-400 scale-110 transition-transform hover:scale-125"
                          : "text-gray-300 hover:text-yellow-300 hover:scale-110 transition-all"
                      }
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                <textarea
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={4}
                  maxLength={300}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  required
                  placeholder="Share your experience..."
                />
                <div className="text-xs text-gray-400 text-right mt-1">{reviewComment.length}/300</div>
              </div>
              {reviewError && <div className="text-red-500 text-sm text-center">{reviewError}</div>}
              <Button type="submit" className="w-full mt-2" disabled={reviewSubmitting || reviewRating === 0}>
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          )}
          <style>{`
            .animate-fade-in {
              animation: fadeIn 0.5s ease;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OngoingRequests; 