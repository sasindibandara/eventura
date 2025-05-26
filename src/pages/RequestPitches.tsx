import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { pitchService } from "@/services/pitchService";
import { serviceRequestService } from "@/services/serviceRequestService";
import { userService } from "@/services/userService";
import { portfolioService } from "@/services/portfolioService";
import { PitchResponse } from "@/types/pitch";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { UserResponse } from "@/types/user";
import { PortfolioResponse } from "@/types/portfolio";
import { format } from "date-fns";
import { ArrowLeft, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const RequestPitches = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [request, setRequest] = useState<ServiceRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<PitchResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isAssigning, setIsAssigning] = useState(false);
  const [providerDetails, setProviderDetails] = useState<Record<number, UserResponse>>({});
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);
  const pageSize = 10;

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate("/login", { state: { from: `/requests/${requestId}/pitches` } });
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pitchesResponse, requestResponse] = await Promise.all([
          pitchService.getPitchesByRequestId(Number(requestId), currentPage, pageSize),
          serviceRequestService.getRequestById(Number(requestId))
        ]);

        setPitches(pitchesResponse.content);
        setTotalPages(pitchesResponse.totalPages);
        setTotalElements(pitchesResponse.totalElements);
        setRequest(requestResponse);

        // Fetch provider details for all unique providerIds
        const uniqueProviderIds = Array.from(new Set(pitchesResponse.content.map(p => p.providerId)));
        const details: Record<number, UserResponse> = { ...providerDetails };
        await Promise.all(uniqueProviderIds.map(async (id) => {
          if (!details[id]) {
            try {
              details[id] = await userService.getUserById(id);
            } catch (e) {
              // fallback if user not found
              details[id] = { id, firstName: "Unknown", lastName: "", email: "", mobileNumber: "", role: "PROVIDER", accountStatus: "", address: "", bio: "", createdAt: "" };
            }
          }
        }));
        setProviderDetails(details);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch pitches",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [requestId, currentPage, authState.isAuthenticated, navigate]);

  const handleViewPitchDetails = (pitch: PitchResponse) => {
    setSelectedPitch(pitch);
    setIsDetailsOpen(true);
  };

  const handleAssignProvider = async (providerId: number, pitchId: number) => {
    if (!requestId) return;

    try {
      setIsAssigning(true);
      const selectedPitch = pitches.find(p => p.id === pitchId);
      if (!selectedPitch) throw new Error("Pitch not found");
      // Assign provider and update pitch statuses
      const [updatedRequest, updatedPitch] = await Promise.all([
        serviceRequestService.assignProvider(Number(requestId), providerId),
        pitchService.updatePitchStatus(pitchId, "WIN")
      ]);
      // Update all other pitches to LOSE status
      const otherPitches = pitches.filter(p => p.id !== pitchId);
      await Promise.all(otherPitches.map(pitch => pitchService.updatePitchStatus(pitch.id, "LOSE")));
      // Update the request budget to the assigned pitch's proposedPrice
      const updatedRequestWithBudget = await serviceRequestService.updateRequestBudget(Number(requestId), selectedPitch.proposedPrice);
      setRequest(updatedRequestWithBudget);
      // Update the pitches list to reflect all status changes
      setPitches(pitches.map(pitch => {
        if (pitch.id === pitchId) {
          return { ...pitch, status: "WIN", isAssigned: true };
        }
        return { ...pitch, status: "LOSE" };
      }));
      toast({
        title: "Success",
        description: "Provider assigned, pitch statuses updated, and budget set.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign provider, update pitch statuses, or update budget.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewPortfolio = async (userId: number) => {
    setPortfolioLoading(true);
    setPortfolioError(null);
    setIsPortfolioOpen(true);
    try {
      // Get providerId by userId
      const providerId = await portfolioService.getProviderIdByUserId(userId);
      const page = await portfolioService.getProviderPortfolios(providerId, 0, 10);
      setPortfolio(page.content);
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : "Failed to fetch portfolio");
    } finally {
      setPortfolioLoading(false);
    }
  };

  if (!authState.isAuthenticated) {
    return null;
  }

  const isClient = authState.user?.role === "CLIENT";
  const canAssign = isClient && request?.status !== "ASSIGNED";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Pitches for {request?.title || "Request"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View all pitches submitted for this request
            </p>
          </div>
          <BackButton />
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">Loading pitches...</div>
          ) : pitches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pitches have been submitted for this request yet
            </div>
          ) : (
            <>
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Proposed Price</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pitches.map((pitch) => (
                      <TableRow 
                        key={pitch.id}
                        className={`${
                          pitch.providerId === request?.assignedProviderId 
                            ? "bg-green-50 hover:bg-green-100" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {providerDetails[pitch.providerId]
                              ? `${providerDetails[pitch.providerId].firstName} ${providerDetails[pitch.providerId].lastName}`
                              : `Provider #${pitch.providerId}`}
                            {pitch.providerId === request?.assignedProviderId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {providerDetails[pitch.providerId]?.email}
                          </div>
                        </TableCell>
                        <TableCell>${pitch.proposedPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          {format(new Date(pitch.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPitchDetails(pitch)}
                            >
                              View Details
                            </Button>
                            {canAssign && !request?.assignedProviderId && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAssignProvider(pitch.providerId, pitch.id)}
                                disabled={isAssigning}
                              >
                                Assign
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
                <div className="text-sm text-gray-500">
                  Showing {pitches.length} of {totalElements} pitches
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
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pitch Details</DialogTitle>
            <DialogDescription>
              Detailed information about this pitch
            </DialogDescription>
          </DialogHeader>
          {selectedPitch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="mt-1">
                    {providerDetails[selectedPitch.providerId]
                      ? `${providerDetails[selectedPitch.providerId].firstName} ${providerDetails[selectedPitch.providerId].lastName}`
                      : `Provider #${selectedPitch.providerId}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {providerDetails[selectedPitch.providerId]?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {providerDetails[selectedPitch.providerId]?.mobileNumber ? `Mobile: ${providerDetails[selectedPitch.providerId]?.mobileNumber}` : ""}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleViewPortfolio(providerDetails[selectedPitch.providerId]?.id || selectedPitch.providerId)}
                  >
                    View Portfolio
                  </Button>
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
                  <p className="mt-1">
                    {format(new Date(selectedPitch.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {canAssign && (
                  <Button
                    variant={selectedPitch.providerId === request?.assignedProviderId ? "outline" : "default"}
                    onClick={() => handleAssignProvider(selectedPitch.providerId, selectedPitch.id)}
                    disabled={isAssigning || selectedPitch.providerId === request?.assignedProviderId}
                  >
                    {selectedPitch.providerId === request?.assignedProviderId ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Assigned
                      </>
                    ) : (
                      "Assign Provider"
                    )}
                  </Button>
                )}
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

      {/* Portfolio Dialog */}
      <Dialog open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Provider Portfolio</DialogTitle>
            <DialogDescription>Projects and work by this provider</DialogDescription>
          </DialogHeader>
          {portfolioLoading ? (
            <div className="py-8 text-center">Loading portfolio...</div>
          ) : portfolioError ? (
            <div className="py-8 text-center text-red-500">{portfolioError}</div>
          ) : portfolio.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No portfolio items found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
                  <div className="aspect-video relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.projectDate} • {item.eventType}</p>
                    <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestPitches; 