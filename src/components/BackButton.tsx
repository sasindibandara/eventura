import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  className?: string;
}

const BackButton = ({ to = "/dashboard", className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`rounded-full ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Dashboard
    </Button>
  );
};

export default BackButton; 