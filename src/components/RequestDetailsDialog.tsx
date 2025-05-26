import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceRequestResponse } from "@/types/serviceRequest";
import { UserResponse, userService } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface RequestDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequestResponse | null;
}

const RequestDetailsDialog = ({ isOpen, onClose, request }: RequestDetailsDialogProps) => {
  const { toast } = useToast();
  const [clientDetails, setClientDetails] = useState<UserResponse | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!request) return;
      
      setIsLoadingClient(true);
      try {
        const userData = await userService.getUserById(request.clientId);
        setClientDetails(userData);
      } catch (error) {
        console.error("Error fetching client details:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch client details",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClient(false);
      }
    };

    if (isOpen && request) {
      fetchClientDetails();
    }
  }, [isOpen, request, toast]);

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          <DialogDescription>
            Event: {request.eventName} • {format(new Date(request.eventDate), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Request Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Service Type</p>
                <p className="font-medium">{request.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-medium">${request.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium">{request.location}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium">{request.status}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Client Information</h3>
            {isLoadingClient ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : clientDetails ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{`${clientDetails.firstName} ${clientDetails.lastName}`}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{clientDetails.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{clientDetails.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account Status</p>
                  <p className="font-medium">{clientDetails.accountStatus}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Failed to load client details</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsDialog; 