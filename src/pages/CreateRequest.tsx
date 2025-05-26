import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import { serviceRequestService } from "@/services/serviceRequestService";

const CreateRequest = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { toast } = useToast();

  if (!authState.isAuthenticated || authState.user?.role !== "CLIENT") {
    navigate("/login", { state: { from: "/create-request" } });
    return null;
  }

  const handleSubmit = async (data: any) => {
    try {
      await serviceRequestService.createRequest(data);
      toast({
        title: "Success",
        description: "Service request created successfully",
      });
      navigate("/requests");
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Service Request</h1>
            <p className="mt-2 text-gray-600">
              Fill out the form below to create a new service request
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <ServiceRequestForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest; 