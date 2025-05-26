import { useEffect, useState } from "react";
import { ServiceRequestResponse, ServiceRequestStatus } from "@/types/serviceRequest";
import { serviceRequestService } from "@/services/serviceRequestService";
import { userService, UserResponse } from "@/services/userService";
import { pitchService } from "@/services/pitchService";
import { PitchResponse, PitchStatus } from "@/types/pitch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RequestWithClient extends ServiceRequestResponse {
  clientDetails?: UserResponse;
}

interface RequestWithPitches extends RequestWithClient {
  pitches?: (PitchResponse & { providerDetails?: UserResponse })[];
}

const ServiceRequestsTable = () => {
  const [requests, setRequests] = useState<RequestWithPitches[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [serviceType, setServiceType] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<RequestWithPitches | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const { toast } = useToast();
  const pageSize = 5;
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchClientDetails = async (clientId: number): Promise<UserResponse> => {
    try {
      return await userService.getUserById(clientId);
    } catch (err) {
      console.error(`Failed to fetch client details for ID ${clientId}:`, err);
      throw err;
    }
  };

  const fetchProviderDetails = async (providerId: number): Promise<UserResponse> => {
    try {
      return await userService.getUserById(providerId);
    } catch (err) {
      console.error(`Failed to fetch provider details for ID ${providerId}:`, err);
      throw err;
    }
  };

  const fetchPitchesForRequest = async (requestId: number) => {
    try {
      setLoadingPitches(true);
      const response = await pitchService.getPitchesByRequestId(requestId);
      
      // Fetch provider details for each pitch
      const pitchesWithProviderDetails = await Promise.all(
        response.content.map(async (pitch) => {
          try {
            const providerDetails = await fetchProviderDetails(pitch.providerId);
            return { ...pitch, providerDetails };
          } catch (err) {
            console.error(`Failed to fetch provider details for pitch ${pitch.id}:`, err);
            return pitch;
          }
        })
      );
      
      return pitchesWithProviderDetails;
    } catch (err) {
      console.error(`Failed to fetch pitches for request ${requestId}:`, err);
      toast({
        title: "Error",
        description: "Failed to fetch pitches for this request",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoadingPitches(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestService.getAllRequests(
        currentPage,
        pageSize,
        serviceType
      );

      // Fetch client details for each request
      const requestsWithClientDetails = await Promise.all(
        response.content.map(async (request) => {
          try {
            const clientDetails = await fetchClientDetails(request.clientId);
            return { ...request, clientDetails };
          } catch (err) {
            console.error(`Failed to fetch client details for request ${request.id}:`, err);
            return request;
          }
        })
      );

      setRequests(requestsWithClientDetails);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, serviceType]);

  const getStatusBadgeColor = (status: ServiceRequestStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getServiceTypeBadgeColor = (type: string) => {
    switch (type) {
      case "PHOTOGRAPHY":
        return "bg-purple-100 text-purple-800";
      case "CATERING":
        return "bg-orange-100 text-orange-800";
      case "VENUE":
        return "bg-pink-100 text-pink-800";
      case "DECORATION":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      await serviceRequestService.deleteRequestAsAdmin(requestId);
      toast({
        title: "Success",
        description: "Service request deleted successfully",
      });
      // Refresh the requests list
      fetchRequests();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleViewRequest = async (request: RequestWithClient) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
    const pitches = await fetchPitchesForRequest(request.id);
    setSelectedRequest(prev => prev ? { ...prev, pitches } : null);
  };

  if (loading) {
    return <div className="text-center py-4">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Service Requests</h3>
        <Select
          value={serviceType}
          onValueChange={(value) => {
            setServiceType(value);
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PHOTOGRAPHY">Photography</SelectItem>
            <SelectItem value="CATERING">Catering</SelectItem>
            <SelectItem value="VENUE">Venue</SelectItem>
            <SelectItem value="DECORATION">Decoration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>
                  {request.clientDetails ? (
                    <>
                      {request.clientDetails.firstName} {request.clientDetails.lastName}
                      <div className="text-sm text-gray-500">{request.clientDetails.email}</div>
                      <div className="text-sm text-gray-500">{request.clientDetails.mobileNumber}</div>
                    </>
                  ) : (
                    <>
                      {request.clientName}
                      <div className="text-sm text-gray-500">{request.clientEmail}</div>
                      <div className="text-sm text-gray-500">Loading client details...</div>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getServiceTypeBadgeColor(request.serviceType)}>
                    {request.serviceType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      View
                    </Button>
                    {request.status === "OPEN" && (
                      <Button variant="destructive" size="sm">
                        Close
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setRequestToDelete(request.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              View request details and provider pitches
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Request Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Title:</span> {selectedRequest.title}</p>
                    <p><span className="font-medium">Type:</span> {selectedRequest.serviceType}</p>
                    <p><span className="font-medium">Status:</span> {selectedRequest.status}</p>
                    <p><span className="font-medium">Budget:</span> ${selectedRequest.budget}</p>
                    <p><span className="font-medium">Created:</span> {format(new Date(selectedRequest.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Client Information</h3>
                  {selectedRequest.clientDetails ? (
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedRequest.clientDetails.firstName} {selectedRequest.clientDetails.lastName}</p>
                      <p><span className="font-medium">Email:</span> {selectedRequest.clientDetails.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedRequest.clientDetails.mobileNumber}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading client details...</p>
                  )}
                </div>
              </div>

              {/* Pitches Section */}
              <div>
                <h3 className="font-semibold mb-4">Provider Pitches</h3>
                {loadingPitches ? (
                  <div className="text-center py-4">Loading pitches...</div>
                ) : selectedRequest.pitches && selectedRequest.pitches.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRequest.pitches.map((pitch) => (
                      <div key={pitch.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {pitch.providerDetails ? (
                              <>
                                <h4 className="font-medium">
                                  {pitch.providerDetails.firstName} {pitch.providerDetails.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">{pitch.providerDetails.email}</p>
                                <p className="text-sm text-gray-500">{pitch.providerDetails.mobileNumber}</p>
                              </>
                            ) : (
                              <p className="text-gray-500">Loading provider details...</p>
                            )}
                          </div>
                          <Badge className={pitch.status === "WIN" ? "bg-green-100 text-green-800" : 
                                           pitch.status === "LOSE" ? "bg-red-100 text-red-800" : 
                                           "bg-yellow-100 text-yellow-800"}>
                            {pitch.status}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Proposed Price:</span> ${pitch.proposedPrice}</p>
                          <p><span className="font-medium">Details:</span> {pitch.pitchDetails}</p>
                          <p className="text-sm text-gray-500">
                            Submitted: {format(new Date(pitch.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No pitches submitted yet
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service request
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ServiceRequestsTable; 