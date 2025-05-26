import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { serviceRequestService } from "@/services/serviceRequestService";

const MyWorks: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await serviceRequestService.getAllRequests(currentPage, pageSize);
      setRequests(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your work",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, pageSize]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default MyWorks; 