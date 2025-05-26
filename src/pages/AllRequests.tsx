import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { serviceRequestService } from "@/services/serviceRequestService";
import { pitchService } from "@/services/pitchService";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { PitchResponse } from "@/types/pitch";
import { format } from "date-fns";
import { Eye, MessageSquare, CheckCircle2, Info, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PitchDialog from "@/components/PitchDialog";
import RequestDetailsDialog from "@/components/RequestDetailsDialog";
import RequestPitchesDialog from "@/components/RequestPitchesDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";

const AllRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pitchedRequests, setPitchedRequests] = useState<ServiceRequestResponse[]>([]);
  const [isPitchedLoading, setIsPitchedLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<PitchResponse | null>(null);
  const [isPitchDetailsOpen, setIsPitchDetailsOpen] = useState(false);
  const [isPitchLoading, setIsPitchLoading] = useState(false);
  const [myPitches, setMyPitches] = useState<PitchResponse[]>([]);
  const [activeTab, setActiveTab] = useState("available");
  const [myRequests, setMyRequests] = useState<ServiceRequestResponse[]>([]);
  const [isMyRequestsLoading, setIsMyRequestsLoading] = useState(true);
  const [selectedRequestForPitches, setSelectedRequestForPitches] = useState<number | null>(null);
  const [pitchStatuses, setPitchStatuses] = useState<Record<number, string>>({});
  const pageSize = 30;

  const fetchMyRequests = async () => {
    try {
      setIsMyRequestsLoading(true);
      const response = await serviceRequestService.getMyRequests(0, 100);
      setMyRequests(response.content);
    } catch (error) {
      console.error("Error fetching my requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your requests",
        variant: "destructive",
      });
    } finally {
      setIsMyRequestsLoading(false);
    }
  };

  const fetchMyPitches = async () => {
    const response = await pitchService.getMyPitches(0, 100);
    setMyPitches(response.content);
  };

  const fetchRequests = async (page: number, type?: string) => {
    try {
      setIsLoading(true);
      const serviceType = type === "ALL" ? undefined : type;
      
      if (activeTab === "available") {
        const response = await serviceRequestService.getAvailableRequests(page, pageSize, serviceType);
        setRequests(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } 
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch requests",
        variant: "destructive",
      });
      setRequests([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPitchedRequests = async () => {
    try {
      setIsPitchedLoading(true);
      const response = await pitchService.getMyPitches(0, 100);
      const pitchedIds = response.content.map(pitch => pitch.requestId);
      
      const pitchedRequestsPromises = pitchedIds.map(id => 
        serviceRequestService.getRequestById(id)
      );
      
      const pitchedRequestsData = await Promise.all(pitchedRequestsPromises);
      setPitchedRequests(pitchedRequestsData);
    } catch (error) {
      console.error("Error fetching pitched requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pitched requests",
        variant: "destructive",
      });
    } finally {
      setIsPitchedLoading(false);
    }
  };

  const fetchProviderPitches = async () => {
    try {
      const response = await pitchService.getMyPitches(0, 100);
      setMyPitches(response.content);
    } catch (error) {
      console.error("Error fetching provider pitches:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your pitches",
        variant: "destructive",
      });
    }
  };

  const handleViewPitch = async (requestId: number) => {
    try {
      setIsPitchLoading(true);
      const pitch = myPitches.find(p => p.requestId === requestId);
      if (pitch) {
        setSelectedPitch(pitch);
        setIsPitchDetailsOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Pitch details not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pitch details",
        variant: "destructive",
      });
    } finally {
      setIsPitchLoading(false);
    }
  };

  useEffect(() => {
    if (!authState.isAuthenticated) {
      // Clear all state when not authenticated
      setRequests([]);
      setPitchedRequests([]);
      setMyRequests([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
      setSelectedRequestId(null);
      setSelectedRequest(null);
      navigate("/login", { state: { from: "/all-requests" } });
      return;
    }

    if (location.state) {
      const { initialRequests, totalPages: pages, totalElements: elements } = location.state as any;
      setRequests(initialRequests);
      setTotalPages(pages);
      setTotalElements(elements);
      setIsLoading(false);
    } else {
      fetchRequests(0);
    }
    fetchMyPitches();
    fetchPitchedRequests();
    if (authState.user?.role === "CLIENT") {
      fetchMyRequests();
    }
  }, [location.state, authState.isAuthenticated, authState.user?.role]);

  // Handle service type changes
  useEffect(() => {
    if (currentPage === 0) {
      fetchRequests(0, serviceType);
    } else {
      setCurrentPage(0);
      fetchRequests(0, serviceType);
    }
  }, [serviceType]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm("");
    setServiceType("ALL");
    setCurrentPage(0);
    
    switch (value) {
      case "available":
        fetchRequests(0);
        break;
      case "pitched":
        fetchPitchedRequests();
        break;
      case "my-requests":
        if (authState.user?.role === "CLIENT") {
          fetchMyRequests();
        }
        break;
    }
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

  const pitchedRequestIds = new Set(myPitches.map(pitch => pitch.requestId));
  const filteredRequests = requests.filter(
    request => !pitchedRequestIds.has(request.id) &&
      (
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handlePageChange = (newPage: number) => {
    fetchRequests(newPage, serviceType);
  };

  const handlePitchSuccess = () => {
    fetchRequests(currentPage, serviceType);
    fetchMyPitches();
    fetchProviderPitches();
    fetchPitchedRequests();

    // Update pitchedRequestIds to include the newly pitched request
    pitchService.getMyPitches(0, 100).then(response => {
      const pitchedIds = new Set(response.content.map(pitch => pitch.requestId));
    });
  };

  const handleViewDetails = (request: ServiceRequestResponse) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      const statuses: Record<number, string> = {};
      await Promise.all(
        myPitches.map(async (pitch) => {
          try {
            const res = await pitchService.getPitchStatus(pitch.id);
            statuses[pitch.id] = res;
          } catch {
            statuses[pitch.id] = "UNKNOWN";
          }
        })
      );
      setPitchStatuses(statuses);
    };
    if (myPitches.length > 0) fetchStatuses();
  }, [myPitches]);

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl   bg-white rounded-2xl mt-8 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Service Requests</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse and manage your service requests
            </p>
          </div>
          <BackButton />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="available" className="flex-1 sm:flex-none">Available Requests</TabsTrigger>
            <TabsTrigger value="pitched" className="flex-1 sm:flex-none">Pitched Requests</TabsTrigger>
            {authState.user?.role === "CLIENT" && (
              <TabsTrigger value="my-requests" className="flex-1 sm:flex-none">Your Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="available">
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Services</SelectItem>
                  <SelectItem value="CATERING">Catering</SelectItem>
                  <SelectItem value="WEDDING_PLANNING">Wedding Planning</SelectItem>
                  <SelectItem value="VENUE">Venue</SelectItem>
                  <SelectItem value="PHOTOGRAPHY">Photography</SelectItem>
                  <SelectItem value="MUSIC">Music</SelectItem>
                  <SelectItem value="DECORATION">Decoration</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">Loading requests...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No requests found matching your criteria
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((request) => (
                      <Card key={request.id} className="bg-gray-200 rounded-2xl shadow-md p-6 flex flex-col justify-between min-h-[260px] transition hover:shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-lg">{request.title}</div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{request.status}</span>
                        </div>
                        <div className="text-gray-500 text-sm mb-1">{request.eventName}</div>
                        <div className="flex gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-gray-500 text-white text-xs capitalize font-semibold shadow-sm border border-gray-200">
                            {request.serviceType}
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm mb-1">
                          <span className="font-medium">Event Date:</span> {format(new Date(request.eventDate), "MMM dd, yyyy")}
                        </div>
                        <div className="text-gray-600 text-sm mb-1">
                          <span className="font-medium">Location:</span> {request.location}
                        </div>
                        <div className="flex items-center justify-between mt-4 gap-2">
                          <div className="font-bold text-base">${request.budget.toLocaleString()}</div>
                          <div className="flex gap-2">
                            <button
                              className="rounded-lg px-4 py-2 bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                              onClick={() => handleViewDetails(request)}
                            >
                              View Details
                            </button>
                            <button
                              className="rounded-lg px-4 py-2 bg-black text-white font-semibold hover:bg-gray-900 transition"
                              onClick={() => setSelectedRequestId(request.id)}
                            >
                              Pitch now
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
                    <div className="text-sm text-gray-500">
                      Showing {filteredRequests.length} of {totalElements} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pitched">
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              {isPitchedLoading ? (
                <div className="p-8 text-center">Loading your pitches...</div>
              ) : pitchedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  You haven't pitched for any requests yet
                </div>
              ) : (
                <>
                  <div className="min-w-[800px]">
                    <Table className="w-full bg-gray-200">
                      <TableHeader className="bg-gray-300">
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Pitch Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pitchedRequests.map((request) => {
                          const myPitchForRequest = myPitches.find(pitch => pitch.requestId === request.id);
                          const pitchStatus = myPitchForRequest ? pitchStatuses[myPitchForRequest.id] : undefined;
                          return (
                            <TableRow key={request.id} className="bg-gray-200">
                              <TableCell className="font-medium">{request.title}</TableCell>
                              <TableCell>{request.eventName}</TableCell>
                              <TableCell>{format(new Date(request.eventDate), "MMM d, yyyy")}</TableCell>
                              <TableCell>{request.location}</TableCell>
                              <TableCell>{request.serviceType}</TableCell>
                              <TableCell>${request.budget.toLocaleString()}</TableCell>
                              <TableCell>
                                {pitchStatus ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                    ${pitchStatus === "WIN" ? "bg-green-100 text-green-800" : pitchStatus === "LOSE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                                    {pitchStatus}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(request)}
                                  title="View Request Details"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (myPitchForRequest) {
                                      setSelectedPitch(myPitchForRequest);
                                      setIsPitchDetailsOpen(true);
                                    }
                                  }}
                                  disabled={!myPitchForRequest}
                                  title="View Your Pitch"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-requests">
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              {isMyRequestsLoading ? (
                <div className="p-8 text-center">Loading your requests...</div>
              ) : myRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  You haven't created any requests yet
                </div>
              ) : (
                <>
                  <div className="min-w-[800px]">
                    <Table className="w-full bg-gray-200">
                      <TableHeader className="bg-gray-300">
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myRequests.map((request) => (
                          <TableRow key={request.id} className="bg-gray-200">
                            <TableCell className="font-medium bg-gray-200">{request.title}</TableCell>
                            <TableCell className="bg-gray-200">{request.eventName}</TableCell>
                            <TableCell className="bg-gray-200">{format(new Date(request.eventDate), "MMM d, yyyy")}</TableCell>
                            <TableCell className="bg-gray-200">{request.location}</TableCell>
                            <TableCell className="bg-gray-200">{request.serviceType}</TableCell>
                            <TableCell className="bg-gray-200">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </TableCell>
                            <TableCell className="bg-gray-200">${request.budget.toLocaleString()}</TableCell>
                            <TableCell className="text-right space-x-2 bg-gray-200">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(request)}
                                title="View Details"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedRequestForPitches(request.id)}
                                title="View Pitches"
                              >
                                <Eye className="h-4 w-4" />
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

      <PitchDialog
        isOpen={selectedRequestId !== null}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId || 0}
        onSuccess={handlePitchSuccess}
      />

      <RequestDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRequest}
      />

      <RequestPitchesDialog
        isOpen={selectedRequestForPitches !== null}
        onClose={() => setSelectedRequestForPitches(null)}
        requestId={selectedRequestForPitches || 0}
      />

      <Dialog open={isPitchDetailsOpen} onOpenChange={() => setIsPitchDetailsOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Pitch Details</DialogTitle>
            <DialogDescription>
              Details of your pitch for this request
            </DialogDescription>
          </DialogHeader>
          {isPitchLoading ? (
            <div className="text-center py-4">Loading pitch details...</div>
          ) : selectedPitch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pitch ID</p>
                  <p className="mt-1">{selectedPitch.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Proposed Price</p>
                  <p className="mt-1">${selectedPitch.proposedPrice.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Pitch Details</p>
                  <p className="mt-1">{selectedPitch.pitchDetails}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Submitted On</p>
                  <p className="mt-1">{format(new Date(selectedPitch.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPitchDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default AllRequests; 