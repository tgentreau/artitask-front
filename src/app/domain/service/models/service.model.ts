/**
 * Interface principale Service alignée avec le backend
 */
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

/**
 * Type de service avec métadonnées
 */
export interface ServiceType {
  value: string;
  label: string;
  description: string;
}

/**
 * Tarification du service
 */
export interface Tarification {
  tarifHoraire?: number;
  tarifFixe?: number;
  majorationUrgence: number;
  majorationWeekend: number;
  fraisDeplacement?: number;
}

/**
 * DTO pour créer un service - aligné avec CreateServiceDto backend
 */
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

/**
 * DTO pour mettre à jour un service - aligné avec UpdateServiceDto backend
 */
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

/**
 * DTO pour calculer une estimation - aligné avec CalculateEstimateDto backend
 */
export interface CalculateEstimateRequest {
  heuresEstimees?: number;
  estUrgence?: boolean;
  estWeekend?: boolean;
  incluireFraisDeplacement?: boolean;
}

/**
 * Réponse d'estimation - alignée avec EstimateResponseDto backend
 */
export interface EstimateResponse {
  montantBase: number;
  majorationUrgence?: number;
  majorationWeekend?: number;
  fraisDeplacement?: number;
  montantTotal: number;
  details: string[];
}

/**
 * Réponse paginée pour la liste des services
 */
export interface ServiceListResponse {
  items: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Structure de réponse standard du backend
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Filtres pour la recherche de services
 */
export interface ServiceFilters {
  type?: string;
  actif?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
