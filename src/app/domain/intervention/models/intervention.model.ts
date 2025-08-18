export interface CoordinatesGPS {
  latitude: number;
  longitude: number;
}

export interface CreateInterventionRequest {
  clientId: string;
  serviceId: string;
  dateIntervention: string;
  descriptionDemande: string;
  urgence?: boolean;
  adresseIntervention?: string;
  coordonneesGPS?: CoordinatesGPS;
  coutEstime?: number;
}

export interface CompleteInterventionRequest {
  coutReel: number;
}

export interface CancelInterventionRequest {
  reason: string;
}

export interface InterventionStatus {
  value: string;
  label: string;
  description: string;
}

export interface InterventionPriority {
  value: string;
  label: string;
  level: number;
  color: string;
}

export interface InterventionLocation {
  adresse: string;
  coordonnees?: CoordinatesGPS;
}

export interface InterventionTimeTracking {
  heureDebut?: Date;
  heureFin?: Date;
  totalHours: number;
  formattedDuration: string;
  isStarted: boolean;
  isFinished: boolean;
  isPaused: boolean;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface CostVariance {
  variance: Money;
  percentage: number;
}

export interface PhotoResponse {
  id: string;
  url: string;
  type: string;
  typeLabel: string;
  filename?: string;
  description?: string;
  createdAt: Date;
}

export interface InterventionReportResponse {
  id: string;
  travauxEffectues: string;
  materielUtilise: string;
  tempsPasse: number;
  signatureClient?: string;
  observations?: string;
  createdAt: Date;
}

export interface InterventionResponse {
  id: string;
  clientId: string;
  serviceId: string;
  status: InterventionStatus;
  dateIntervention: Date;
  descriptionDemande: string;
  priority: InterventionPriority;
  location?: InterventionLocation;
  timeTracking: InterventionTimeTracking;
  coutEstime?: Money;
  coutReel?: Money;
  costVariance?: CostVariance;
  photos: PhotoResponse[];
  report?: InterventionReportResponse;
  createdAt: Date;
  updatedAt: Date;
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
  coutEstime?: Money;
}

export interface ListInterventionsQuery {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  serviceId?: string;
  dateStart?: string;
  dateEnd?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InterventionListResult {
  items: InterventionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenerateReportRequest {
  travauxEffectues: string;
  materielUtilise: string;
  signatureClient?: string;
  observations?: string;
}

export interface AddPhotoRequest {
  url: string;
  type: 'before' | 'during' | 'after';
  filename?: string;
  mimeType?: string;
  size?: number;
  description?: string;
}

export interface CalendarQuery {
  startDate: string;
  endDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  intervention: {
    id: string;
    clientId: string;
    status: string;
    priority: string;
  };
}
