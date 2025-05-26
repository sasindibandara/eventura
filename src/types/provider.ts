export type ServiceType = 'CATERING' | 'WEDDING_PLANNING' | 'VENUE' | 'PHOTOGRAPHY' | 'MUSIC' | 'DECORATION' | 'OTHER';

export interface ProviderProfileRequest {
  companyName: string;
  serviceType: ServiceType;
  address: string;
  mobileNumber: string;
}

export interface ProviderProfileResponse {
  id: number;
  userId: number;
  companyName: string;
  serviceType: ServiceType;
  address: string;
  mobileNumber: string;
  isVerified: boolean;
} 