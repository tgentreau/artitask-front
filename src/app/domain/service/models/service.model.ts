export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface Service {
  id: string;
  nom: string;
  description: string;
  type: ServiceType;
  tarification: Tarification;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceType {
  value: string;
  label: string;
  description: string;
}

export interface Tarification {
  tarifHoraire?: MoneyAmount | number;
  tarifFixe?: MoneyAmount | number;
  majorationUrgence: number;
  majorationWeekend: number;
  fraisDeplacement?: MoneyAmount | number;
}

export interface CreateServiceRequest {
  nom: string;
  description: string;
  type: string;
  tarifHoraire?: number;
  tarifFixe?: number;
  majorationUrgence?: number;
  majorationWeekend?: number;
  fraisDeplacement?: number;
}

export interface UpdateServiceRequest {
  nom?: string;
  description?: string;
  type?: string;
  tarifHoraire?: number;
  tarifFixe?: number;
  majorationUrgence?: number;
  majorationWeekend?: number;
  fraisDeplacement?: number;
}

export interface CalculateEstimateRequest {
  heuresEstimees?: number;
  estUrgence?: boolean;
  estWeekend?: boolean;
  incluireFraisDeplacement?: boolean;
}

export interface EstimateResponse {
  montantBase: number;
  majorationUrgence?: number;
  majorationWeekend?: number;
  fraisDeplacement?: number;
  montantTotal: number;
  details: string[];
}

export interface ServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceFilters {
  type?: string;
  actif?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
