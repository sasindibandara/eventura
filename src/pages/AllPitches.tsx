import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { pitchService } from "@/services/pitchService";
import { serviceRequestService } from "@/services/serviceRequestService";
import { PitchResponse } from "@/types/pitch";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { Trash2, Search, Filter, ArrowUpDown } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AllPitches = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pitchToDelete, setPitchToDelete] = useState<number | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<PitchResponse | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestResponse | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [pitchStatuses, setPitchStatuses] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("DATE_DESC");

  useEffect(() => {
    if (!authState.isAuthenticated) {
      // Clear all state when not authenticated
      setPitches([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
      setPitchToDelete(null);
      setSelectedPitch(null);
      setSelectedRequest(null);
      navigate("/login", { state: { from: "/all-pitches" } });
      return;
    }

    if (authState.user?.role !== "PROVIDER") {
      navigate("/dashboard");
      return;
    }

    fetchPitches(currentPage);
  }, [authState.isAuthenticated, authState.user?.role, navigate, currentPage]);

  const fetchPitchStatus = async (pitchId: number) => {
    try {
      const status = await pitchService.getPitchStatus(pitchId);
      setPitchStatuses(prev => ({
        ...prev,
        [pitchId]: status
      }));
    } catch (error) {
      console.error("Error fetching pitch status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WIN":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "LOSE":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "PENDING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const fetchPitches = async (page: number) => {
    try {
      const response = await pitchService.getMyPitches(page, 10);
      setPitches(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      
      // Fetch status for each pitch
      response.content.forEach(pitch => {
        fetchPitchStatus(pitch.id);
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pitches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (pitchId: number) => {
    try {
      setIsDetailsLoading(true);
      const pitchDetails = await pitchService.getPitchById(pitchId);
      setSelectedPitch(pitchDetails);
      // Fetch request details
      setIsRequestLoading(true);
      const requestDetails = await serviceRequestService.getRequestById(pitchDetails.requestId);
      setSelectedRequest(requestDetails);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch details",
        variant: "destructive",
      });
    } finally {
      setIsDetailsLoading(false);
      setIsRequestLoading(false);
    }
  };

  const handleDeletePitch = async (pitchId: number) => {
    try {
      await pitchService.deletePitch(pitchId);
      toast({
        title: "Success",
        description: "Pitch deleted successfully",
      });
      // Refresh the pitches list
      fetchPitches(currentPage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pitch",
        variant: "destructive",
      });
    } finally {
      setPitchToDelete(null);
    }
  };

  const filteredAndSortedPitches = pitches
    .filter(pitch => {
      const matchesSearch = pitch.pitchDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pitch.id.toString().includes(searchQuery);
      const matchesStatus = statusFilter === "ALL" || pitchStatuses[pitch.id] === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "PRICE_ASC":
          return a.proposedPrice - b.proposedPrice;
        case "PRICE_DESC":
          return b.proposedPrice - a.proposedPrice;
        case "DATE_ASC":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "DATE_DESC":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl  bg-white rounded-2xl mt-8 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your Pitches</h1>
            <p className="text-sm text-gray-500">Track your proposals</p>
          </div>
          <BackButton />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
              <div>
                <CardTitle className="text-base">All Pitches</CardTitle>
                <CardDescription className="text-xs">View and manage proposals</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="WIN">Won</SelectItem>
                    <SelectItem value="LOSE">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATE_DESC">Newest</SelectItem>
                    <SelectItem value="DATE_ASC">Oldest</SelectItem>
                    <SelectItem value="PRICE_DESC">Price ↓</SelectItem>
                    <SelectItem value="PRICE_ASC">Price ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="text-center py-2 text-sm text-gray-500">Loading...</div>
            ) : filteredAndSortedPitches.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No pitches found</p>
                {searchQuery || statusFilter !== "ALL" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedPitches.map((pitch) => (
                  <div key={pitch.id} className="p-3 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">#{pitch.id}</h3>
                          {pitchStatuses[pitch.id] && (
                            <Badge className={`${getStatusColor(pitchStatuses[pitch.id])} text-xs font-normal`}>
                              {pitchStatuses[pitch.id]}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <span>{format(new Date(pitch.createdAt), "MMM d, yyyy")}</span>
                          <span>${pitch.proposedPrice.toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-1">
                          {pitch.pitchDetails}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-gray-600"
                          onClick={() => setPitchToDelete(pitch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleViewDetails(pitch.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-gray-500">
                  {filteredAndSortedPitches.length} of {totalElements} pitches
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    Prev
                  </Button>
                  <span className="px-2 py-1 text-xs text-gray-500">
                    {currentPage + 1}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={pitchToDelete !== null} onOpenChange={() => setPitchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your pitch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pitchToDelete && handleDeletePitch(pitchToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pitch Details Dialog */}
      <Dialog open={selectedPitch !== null} onOpenChange={() => {
        setSelectedPitch(null);
        setSelectedRequest(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pitch Details</DialogTitle>
            <DialogDescription>
              Detailed information about your pitch and the associated request
            </DialogDescription>
          </DialogHeader>
          {isDetailsLoading || isRequestLoading ? (
            <div className="text-center py-4">Loading details...</div>
          ) : selectedPitch && selectedRequest && (
            <div className="space-y-6">
              {/* Pitch Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Your Pitch</h3>
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
              </div>

              {/* Request Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Request</h3>
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedRequest.status === "OPEN" ? "bg-green-100 text-green-800" :
                        selectedRequest.status === "ASSIGNED" ? "bg-blue-100 text-blue-800" :
                        selectedRequest.status === "COMPLETED" ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {selectedRequest.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1">{selectedRequest.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/all-requests')}
                >
                  View Full Request Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPitch(null);
                    setSelectedRequest(null);
                  }}
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

export default AllPitches;