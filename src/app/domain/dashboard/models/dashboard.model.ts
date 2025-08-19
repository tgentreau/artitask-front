export interface ArtisanProfileResponse {
  id: string;
  email: string;
  nomEntreprise: string;
  telephone: string;
  adresse: string;
  siret?: string;
  compteActif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterventionStatsResponse {
  total: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  planned: number;
  averageDuration: number;
  totalRevenue: number;
  completionRate: number;
  averageCost: number;
}

export interface CalendarEventResponse {
  id: string;
  title: string;
  start: Date;
  clientId: string;
  serviceId: string;
  status: string;
  priority: string;
  location?: string;
  isUrgent: boolean;
  estimatedDuration?: number;
}

export interface InterventionListItem {
  id: string;
  clientId: string;
  serviceId: string;
  status: { status: string; label: string };
  dateIntervention: Date;
  descriptionDemande: string;
  priority: { priority: string; label: string; color: string };
  location?: string;
  isUrgent: boolean;
  timeTracking: {
    totalHours: number;
    formattedDuration: string;
    isStarted: boolean;
  };
  coutEstime?: { amount: number; currency: string };
}

export interface ClientListItem {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface ServiceListItem {
  id: string;
  nom: string;
  description: string;
  type: { value: string; label: string };
  tarifHoraire?: number;
  tarifFixe?: number;
  actif: boolean;
}

export interface CalendarQueryParams {
  startDate: string;
  endDate: string;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InterventionListQueryParams extends ListQueryParams {
  status?: string;
  clientId?: string;
  serviceId?: string;
}
