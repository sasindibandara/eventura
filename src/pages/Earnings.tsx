import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import { PaymentResponse } from "@/types/common";
import { userService, UserResponse } from "@/services/userService";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, User, Phone, Mail, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PAGE_SIZE = 20;

interface PaymentWithClient extends PaymentResponse {
  clientDetails?: UserResponse;
}

const Earnings = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("DATE_DESC");
  const [paymentsWithClient, setPaymentsWithClient] = useState<PaymentWithClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["providerPayments", page],
    queryFn: () => paymentService.getProviderPayments(page, PAGE_SIZE),
    enabled: authState.isAuthenticated && authState.user?.role === "PROVIDER",
  });

  const payments = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalEarnings = payments
    .filter((p: PaymentResponse) => p.paymentStatus === "COMPLETED")
    .reduce((sum: number, p: PaymentResponse) => sum + p.amount, 0);

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!payments.length) return;
      
      setIsLoadingClients(true);
      try {
        const paymentsWithDetails = await Promise.all(
          payments.map(async (payment) => {
            try {
              const clientDetails = await userService.getUserById(payment.clientId);
              return { ...payment, clientDetails };
            } catch (error) {
              console.error(`Failed to fetch client details for ID ${payment.clientId}:`, error);
              return { ...payment, clientDetails: undefined };
            }
          })
        );
        setPaymentsWithClient(paymentsWithDetails);
      } catch (error) {
        console.error("Error fetching client details:", error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClientDetails();
  }, [payments]);

  const filteredAndSortedPayments = paymentsWithClient
    .filter((payment) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        payment.requestId.toString().includes(searchQuery) ||
        payment.amount.toString().includes(searchQuery) ||
        format(new Date(payment.createdAt), "MMM d, yyyy").toLowerCase().includes(searchLower) ||
        payment.paymentStatus.toLowerCase().includes(searchLower) ||
        payment.clientDetails?.firstName.toLowerCase().includes(searchLower) ||
        payment.clientDetails?.lastName.toLowerCase().includes(searchLower) ||
        payment.clientDetails?.email.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "ALL" || payment.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "AMOUNT_ASC":
          return a.amount - b.amount;
        case "AMOUNT_DESC":
          return b.amount - a.amount;
        case "DATE_ASC":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "DATE_DESC":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (!authState.isAuthenticated || authState.user?.role !== "PROVIDER") {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl bg-white rounded-2xl mt-8 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Earnings</h1>
            <p className="text-sm text-gray-500">Track your payments and earnings</p>
          </div>
          <BackButton />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
              <div>
                <CardTitle className="text-base">Payment History</CardTitle>
                <CardDescription className="text-xs">View and track your earnings</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by ID, amount, date, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATE_DESC">Newest</SelectItem>
                    <SelectItem value="DATE_ASC">Oldest</SelectItem>
                    <SelectItem value="AMOUNT_DESC">Amount ↓</SelectItem>
                    <SelectItem value="AMOUNT_ASC">Amount ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">Total Earnings</span>
                <span className="text-2xl font-semibold text-emerald-700">${totalEarnings.toLocaleString()}</span>
              </div>
            </div>

            {isLoading || isLoadingClients ? (
              <div className="text-center py-2 text-sm text-gray-500">Loading payments...</div>
            ) : filteredAndSortedPayments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No payments found</p>
                {searchQuery || statusFilter !== "ALL" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500 w-[20%]">Date</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 w-[20%]">Request ID</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 w-[25%] text-center">Client</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 w-[15%]">Amount</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 w-[20%]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(payment.createdAt), "MMM d, yyyy")}</span>
                            <span className="text-xs text-gray-500">{format(new Date(payment.createdAt), "h:mm a")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          <span className="font-medium">#{payment.requestId}</span>
                        </TableCell>
                        <TableCell className="text-sm py-3 text-center">
                          {payment.clientDetails ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 mx-auto"
                              onClick={() => {
                                setSelectedClient(payment.clientDetails);
                                setIsDialogOpen(true);
                              }}
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Client Details
                            </Button>
                          ) : (
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              <User className="h-4 w-4" />
                              <span className="text-sm">Loading client...</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          <span className="font-semibold text-emerald-700">${payment.amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                            payment.paymentStatus === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : payment.paymentStatus === "PENDING"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}>
                            {payment.paymentStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-gray-500">
                  {filteredAndSortedPayments.length} of {payments.length} payments
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Prev
                  </Button>
                  <span className="px-2 py-1 text-xs text-gray-500">
                    {page + 1}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Information about the client
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <p className="text-xs text-gray-500">Full Name</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{selectedClient.email}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              {selectedClient.mobileNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedClient.mobileNumber}</p>
                    <p className="text-xs text-gray-500">Mobile Number</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Earnings; 