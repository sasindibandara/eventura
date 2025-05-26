import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ServiceRequestResponse, ServiceType } from "@/types/serviceRequest";
import { serviceRequestService } from "@/services/serviceRequestService";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

const ServiceRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authState } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "ALL">("ALL");
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    document.title = "Service Requests | Eventura";
    if (!authState.isAuthenticated) {
      navigate("/login", { state: { from: "/requests" } });
      return;
    }
    fetchRequests();
  }, [currentPage, authState.isAuthenticated]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await serviceRequestService.getAvailableRequests(currentPage, pageSize, serviceType === "ALL" ? undefined : serviceType);
      setRequests(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestClick = (requestId: number) => {
    navigate(`/requests/${requestId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesServiceType = serviceType === "ALL" || request.serviceType === serviceType;
    return matchesSearch && matchesServiceType;
  });

  if (!authState.isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service ss
            {authState.user?.role === "CLIENT" ? "View your service requests" : "Browse all service requests"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by title, event name, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {authState.user?.role !== "CLIENT" && (
            <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType | "ALL")}>
              <SelectTrigger className="w-[180px]">
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
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredRequests.length} of {totalElements} requests
        </div>

        {/* Card Grid */}
        <div className="grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between min-h-[260px] transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-lg">{request.title}</div>
                <Badge variant="secondary" className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
              <div className="text-gray-500 text-sm mb-1">{request.eventName}</div>
              <div className="flex gap-2 mb-3">
                <Badge className="bg-gray-100 text-gray-700 capitalize">{request.serviceType}</Badge>
              </div>
              <div className="text-gray-600 text-sm mb-1">
                <span className="font-medium">Event Date:</span> {format(new Date(request.eventDate), "MMM dd, yyyy")}
              </div>
              <div className="text-gray-600 text-sm mb-1">
                <span className="font-medium">Location:</span> {request.location}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="font-bold text-base">Rs. {request.budget.toLocaleString()}</div>
                <Button className="rounded-lg px-4 py-2" onClick={() => handleRequestClick(request.id)}>
                  Apply now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <div className="flex items-center px-4">
              Page {currentPage + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No requests found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequests; 