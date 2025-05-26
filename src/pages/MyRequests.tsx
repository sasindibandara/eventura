import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { serviceRequestService } from "@/services/serviceRequestService";
import { pitchService } from "@/services/pitchService";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { format } from "date-fns";
import { Trash2, Eye, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";

const MyRequests = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { toast } = useToast();
  const [activeRequests, setActiveRequests] = useState<ServiceRequestResponse[]>([]);
  const [deletedRequests, setDeletedRequests] = useState<ServiceRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequestResponse | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState("active");
  const pageSize = 30;
  const [pitchCounts, setPitchCounts] = useState<Record<number, number>>({});

  const fetchPitchCounts = async (requests: ServiceRequestResponse[]) => {
    const counts: Record<number, number> = {};
    await Promise.all(
      requests.map(async (request) => {
        try {
          const response = await pitchService.getPitchesForRequest(request.id);
          counts[request.id] = response.totalElements;
        } catch (error) {
          console.error(`Failed to fetch pitches for request ${request.id}:`, error);
          counts[request.id] = 0;
        }
      })
    );
    setPitchCounts(counts);
  };

  const fetchRequests = async () => {
    try {
      const response = await serviceRequestService.getMyRequests(currentPage, pageSize);
      const active = response.content.filter(req => req.status !== "DELETED");
      const deleted = response.content.filter(req => req.status === "DELETED");
      
      setActiveRequests(active);
      setDeletedRequests(deleted);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);

      // Fetch pitch counts for all requests
      await fetchPitchCounts([...active, ...deleted]);
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
    if (!authState.isAuthenticated || authState.user?.role !== "CLIENT") {
      navigate("/login", { state: { from: "/requests" } });
      return;
    }
    fetchRequests();
  }, [authState.isAuthenticated, authState.user?.role, navigate, currentPage]);

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

  const handleViewDetails = (request: ServiceRequestResponse) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(0); // Reset to first page when changing tabs
  };

  if (!authState.isAuthenticated || authState.user?.role !== "CLIENT") {
    return null;
  }

  const renderRequestsTable = (requests: ServiceRequestResponse[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Service Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pitches</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">{request.title}</TableCell>
            <TableCell>{request.eventName}</TableCell>
            <TableCell>{format(new Date(request.eventDate), "MMM d, yyyy")}</TableCell>
            <TableCell>{request.serviceType}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/requests/${request.id}/pitches`)}
                className="flex items-center gap-2"
              >
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                  {pitchCounts[request.id] || 0}
                </span>
                View Pitches
              </Button>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewDetails(request)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {request.status !== "DELETED" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRequestToDelete(request)}
                      title="Delete Request"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <BackButton />
      </div>
      <div className="bg-white rounded-2xl shadow  container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your service requests
            </p>
          </div>
          <Button onClick={() => navigate("/create-request")}>
            Create New Request
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">Loading requests...</div>
          ) : activeRequests.length === 0 && deletedRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No requests found. Create your first request!
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="px-4 pt-4">
                <TabsList>
                  <TabsTrigger value="active">
                    Active Requests ({activeRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="deleted">
                    Deleted Requests ({deletedRequests.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0">
                {activeRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No active requests found
                  </div>
                ) : (
                  <>
                    {renderRequestsTable(activeRequests)}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
                      <div className="text-sm text-gray-500">
                        Showing {activeRequests.length} of {totalElements} requests
                      </div>
                      {totalElements > pageSize && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="deleted" className="mt-0">
                {deletedRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No deleted requests found
                  </div>
                ) : (
                  <>
                    {renderRequestsTable(deletedRequests)}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
                      <div className="text-sm text-gray-500">
                        Showing {deletedRequests.length} of {totalElements} requests
                      </div>
                      {totalElements > pageSize && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about this request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Title</p>
                  <p className="mt-1">{selectedRequest.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Name</p>
                  <p className="mt-1">{selectedRequest.eventName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Date</p>
                  <p className="mt-1">{format(new Date(selectedRequest.eventDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="mt-1">{selectedRequest.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Service Type</p>
                  <p className="mt-1">{selectedRequest.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Budget</p>
                  <p className="mt-1">${selectedRequest.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-1">{selectedRequest.description}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyRequests; 