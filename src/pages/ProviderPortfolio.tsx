import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioService } from "@/services/portfolioService";
import { PortfolioRequest, PortfolioResponse, EventType } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { providerService } from "@/services/providerService";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
  DialogDescription as ConfirmDialogDescription,
  DialogFooter as ConfirmDialogFooter,
} from "@/components/ui/dialog";
import BackButton from "@/components/BackButton";

const PAGE_SIZE = 10;

const ProviderPortfolio = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState<PortfolioRequest>({
    title: "",
    description: "",
    imageUrl: "",
    projectDate: "",
    eventType: "WEDDING",
  });
  const [portfolioEnabled, setPortfolioEnabled] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [providerIdLoading, setProviderIdLoading] = useState(true);
  const [providerIdError, setProviderIdError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Fetch providerId on mount
  useEffect(() => {
    const fetchProviderIdAndPortfolio = async () => {
      if (!authState.user?.id) return;
      setProviderIdLoading(true);
      setProviderIdError(null);
      try {
        const id = await portfolioService.getProviderIdByUserId(authState.user.id);
        setProviderId(id);
        // After getting providerId, check if any portfolios exist
        const portfolios = await portfolioService.getProviderPortfolios(id, 0, 1);
        if (portfolios.content.length > 0) {
          setPortfolioEnabled(true);
        }
      } catch (err) {
        setProviderIdError(err instanceof Error ? err.message : "Failed to fetch provider ID");
      } finally {
        setProviderIdLoading(false);
      }
    };
    if (authState.isAuthenticated && authState.user?.role === "PROVIDER") {
      fetchProviderIdAndPortfolio();
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.role]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        await providerService.getProfile();
        setProfileExists(true);
      } catch (err) {
        if (err instanceof Error && err.message.includes("Provider not found")) {
          setProfileExists(false);
        } else {
          setProfileExists(null);
        }
      }
    };
    if (authState.isAuthenticated && authState.user?.role === "PROVIDER") {
      checkProfile();
    }
  }, [authState.isAuthenticated, authState.user?.id, authState.user?.role]);

  // Only fetch portfolios if providerId is loaded and portfolioEnabled is true
  const { data: portfoliosData, isLoading } = useQuery({
    queryKey: ["providerPortfolios", providerId, page],
    queryFn: () => portfolioService.getProviderPortfolios(providerId!, page, PAGE_SIZE),
    enabled: !!providerId && portfolioEnabled,
  });

  const createMutation = useMutation({
    mutationFn: (data: PortfolioRequest) =>
      portfolioService.createPortfolio(providerId!, data),
    onSuccess: () => {
      setPortfolioEnabled(true);
      queryClient.invalidateQueries({ queryKey: ["providerPortfolios"] });
      setIsCreateDialogOpen(false);
      setNewPortfolio({
        title: "",
        description: "",
        imageUrl: "",
        projectDate: "",
        eventType: "WEDDING",
      });
      toast({
        title: "Success",
        description: "Portfolio item created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create portfolio item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ portfolioId }: { portfolioId: number }) =>
      portfolioService.deletePortfolio(providerId!, portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerPortfolios"] });
      toast({
        title: "Success",
        description: "Portfolio item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete portfolio item",
        variant: "destructive",
      });
    },
  });

  if (!authState.isAuthenticated || authState.user?.role !== "PROVIDER") {
    navigate("/login");
    return null;
  }

  if (profileExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-700 mb-4">You must set up your provider profile before creating a portfolio.</p>
        <Button onClick={() => navigate('/provider/profile')}>Set Up Provider Profile</Button>
      </div>
    );
  }

  if (providerIdLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500 text-lg">Loading portfolio...</span>
      </div>
    );
  }

  if (providerIdError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-red-500 text-lg">{providerIdError}</span>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newPortfolio);
  };

  const handleDelete = (portfolioId: number) => {
    setConfirmDeleteId(portfolioId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId !== null) {
      deleteMutation.mutate({ portfolioId: confirmDeleteId });
    }
    setIsConfirmOpen(false);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl bg-white rounded-2xl mt-8 mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Portfolio</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your portfolio items and showcase your work
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
            <BackButton />
          </div>
        </div>

        {portfolioEnabled ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading portfolio items...</div>
            ) : portfoliosData?.content.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No portfolio items found. Add your first project!
              </div>
            ) : (
              portfoliosData?.content.map((item: PortfolioResponse) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(item.projectDate), "MMMM d, yyyy")} • {item.eventType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p>You have not set up your portfolio yet.</p>
            <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
          </div>
        )}

        {portfolioEnabled && portfoliosData && portfoliosData.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="py-2 px-4 text-sm text-gray-600">
              Page {page + 1} of {portfoliosData.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(portfoliosData.totalPages - 1, p + 1))}
              disabled={page >= portfoliosData.totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Portfolio Item</DialogTitle>
              <DialogDescription>
                Add a new project to your portfolio
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newPortfolio.title}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPortfolio.description}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={newPortfolio.imageUrl}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, imageUrl: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projectDate">Project Date</Label>
                  <Input
                    id="projectDate"
                    type="date"
                    value={newPortfolio.projectDate}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, projectDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={newPortfolio.eventType}
                    onValueChange={(value: EventType) =>
                      setNewPortfolio({ ...newPortfolio, eventType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEDDING">Wedding</SelectItem>
                      <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <ConfirmDialogContent>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>Confirm Deletion</ConfirmDialogTitle>
              <ConfirmDialogDescription>
                Are you sure you want to delete this portfolio item? This action cannot be undone.
              </ConfirmDialogDescription>
            </ConfirmDialogHeader>
            <ConfirmDialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
            </ConfirmDialogFooter>
          </ConfirmDialogContent>
        </ConfirmDialog>
      </div>
    </div>
  );
};

export default ProviderPortfolio; 