export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
}


export interface PaymentResponse {
  id: number;
  requestId: number;
  clientId: number;
  providerId: number;
  amount: number;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
  transactionId: string;
  createdAt: string;
} 

