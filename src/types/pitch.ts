export type PitchStatus = "PENDING" | "WIN" | "LOSE";

export interface PitchRequest {
  requestId: number;
  pitchDetails: string;
  proposedPrice: number;
}

export interface PitchResponse {
  id: number;
  requestId: number;
  providerId: number;
  pitchDetails: string;
  proposedPrice: number;
  createdAt: string;
  status: PitchStatus;
}

export interface Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface Pageable {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PitchPage {
  content: PitchResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
} 