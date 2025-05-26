import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProviderProfileResponse } from "@/types/provider";
import { providerService } from "@/services/providerService";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { portfolioService } from "@/services/portfolioService";
import { PortfolioResponse } from "@/types/portfolio";
import BackButton from "@/components/BackButton";

const getRoleGradient = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-gradient-to-br from-[#849fe3] to-[#4a6eb0]';
    case 'CLIENT':
      return 'bg-gradient-to-br from-[#8184b3] to-[#4a6eb0]';
    case 'PROVIDER':
      return 'bg-gradient-to-br from-[#849fe3] to-[#8184b3]';
    default:
      return 'bg-gradient-to-br from-[#849fe3] to-[#4a6eb0]';
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'text-[#849fe3] border-[#849fe3]';
    case 'CLIENT':
      return 'text-[#8184b3] border-[#8184b3]';
    case 'PROVIDER':
      return 'text-[#4a6eb0] border-[#4a6eb0]';
    default:
      return 'text-[#849fe3] border-[#849fe3]';
  }
};

const ProviderDetails = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provider, setProvider] = useState<ProviderProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    document.title = "Provider Details | Eventura";
    loadProvider();
  }, [providerId]);

  const loadProvider = async () => {
    if (!providerId) return;

    try {
      const data = await providerService.getProviderById(parseInt(providerId));
      setProvider(data);
      // Load portfolio
      setPortfolioLoading(true);
      const portfolioPage = await portfolioService.getProviderPortfolios(parseInt(providerId), 0, 10);
      setPortfolio(portfolioPage.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load provider details",
        variant: "destructive",
      });
      navigate("/providers");
    } finally {
      setIsLoading(false);
      setPortfolioLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">Loading provider details...</div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Provider Not Found</h2>
            <p className="mt-2 text-gray-600">The provider you're looking for doesn't exist.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/providers")}
            >
              Back to Providers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center">
              <BackButton />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Details</h1>
              <p className="text-sm text-gray-600">View provider information and portfolio</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Profile Header */}
                <div className={cn("h-64 relative", getRoleGradient('PROVIDER'))}>
                  <div className="absolute right-16 top-8">
                    <div className="w-40 h-40 rounded-full bg-white/20 border-4 border-white/20 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-20 h-20 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-12 relative">
                  <div className={cn(
                    "absolute -top-4 right-10 bg-white rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg",
                    getRoleBadgeColor('PROVIDER')
                  )}>
                    Provider
                  </div>

                  <div className="mb-10">
                    <h2 className="text-3xl font-medium text-[#2c2c2c] mb-1.5">
                      {provider.companyName}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Active Now</span>
                      </div>
                      <Badge variant={provider.isVerified ? "default" : "secondary"}>
                        {provider.isVerified ? "Verified Provider" : "Pending Verification"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-gray-500">Service Type</Label>
                        <div className="text-base font-medium">{provider.serviceType}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-gray-500">Location</Label>
                        <div className="text-base font-medium">{provider.address}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-gray-500">Contact</Label>
                        <div className="text-base font-medium">{provider.mobileNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={() => navigate("/providers")}>
                        Back to Providers
                      </Button>
                      <Button onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Contact and booking features will be available soon!",
                        });
                      }}>
                        Contact Provider
                      </Button>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-12 text-xs text-gray-500 tracking-wider">
                    Copyright © Eventura. ALL RIGHTS RESERVED
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
                <div className="p-6">
                  <h2 className="text-2xl font-medium text-[#2c2c2c] mb-6">Portfolio</h2>
                  {portfolioLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : portfolio.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No portfolio items found.</div>
                  ) : (
                    <div className="space-y-6">
                      {portfolio.map((item) => (
                        <Card key={item.id} className="overflow-hidden border border-gray-200">
                          <div className="aspect-video relative">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <CardDescription>
                              {item.projectDate} • {item.eventType}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetails; 