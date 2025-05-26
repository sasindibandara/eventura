export type ServiceType = "CATERING" | "WEDDING_PLANNING" | "VENUE" | "PHOTOGRAPHY" | "MUSIC" | "DECORATION" | "OTHER";
export type RequestStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type ServiceRequestStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED" | "DRAFT" | "DELETED";

export interface ServiceRequestRequest {
  title: string;
  eventName: string;
  eventDate: string;
  location: string;
  serviceType: ServiceType;
  description: string;
  budget: number;
}

export interface ServiceRequestResponse {
  id: number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  title: string;
  eventName: string;
  eventDate: string;
  location: string;
  serviceType: ServiceType;
  description: string;
  budget: number;
  status: ServiceRequestStatus;
  assignedProviderId?: number;
  createdAt: string;
  pitchCount?: number;
}

export interface ServiceRequestPage {
  content: ServiceRequestResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
} 