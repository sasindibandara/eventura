export type EventType = "WEDDING" | "BIRTHDAY" | "CORPORATE" | "OTHER";

export interface PortfolioRequest {
  title: string;
  description: string;
  imageUrl: string;
  projectDate: string;
  eventType: EventType;
}

export interface PortfolioResponse {
  id: number;
  providerId: number;
  title: string;
  description: string;
  imageUrl: string;
  projectDate: string;
  eventType: EventType;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface PortfolioPage {
  content: PortfolioResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
} 