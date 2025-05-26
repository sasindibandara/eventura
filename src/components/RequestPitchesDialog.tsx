import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pitchService } from "@/services/pitchService";
import { PitchResponse } from "@/types/pitch";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";

interface RequestPitchesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
}

const RequestPitchesDialog = ({ isOpen, onClose, requestId }: RequestPitchesDialogProps) => {
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && requestId) {
      fetchPitches();
    }
  }, [isOpen, requestId]);

  const fetchPitches = async () => {
    try {
      setIsLoading(true);
      const response = await pitchService.getPitchesByRequestId(requestId);
      setPitches(response.content);
    } catch (error) {
      console.error("Error fetching pitches:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pitches for this request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pitches for Request #{requestId}</DialogTitle>
          <DialogDescription>
            View all pitches submitted by providers for this request
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-4">Loading pitches...</div>
        ) : pitches.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No pitches have been submitted for this request yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider ID</TableHead>
                    <TableHead>Proposed Price</TableHead>
                    <TableHead>Pitch Details</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pitches.map((pitch) => (
                    <TableRow key={pitch.id}>
                      <TableCell>{pitch.providerId}</TableCell>
                      <TableCell>${pitch.proposedPrice.toLocaleString()}</TableCell>
                      <TableCell className="max-w-md truncate">{pitch.pitchDetails}</TableCell>
                      <TableCell>
                        {format(new Date(pitch.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement view full pitch details
                            toast({
                              title: "Coming Soon",
                              description: "Full pitch details view will be available soon",
                            });
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestPitchesDialog; 