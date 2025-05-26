import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface SuspensionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuspensionPopup = ({ isOpen, onClose }: SuspensionPopupProps) => {
  const handleContactAdmin = () => {
    // You can implement email or contact form functionality here
    window.location.href = "mailto:admin@eventura.com";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Account Suspended</DialogTitle>
          <DialogDescription className="pt-4">
            <div className="space-y-4">
              <p>
                Your account has been suspended. This may be due to a violation of our terms of service
                or suspicious activity.
              </p>
              <p>
                If you believe this is a mistake or would like to appeal this decision, please contact
                our admin team.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleContactAdmin} className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuspensionPopup; 