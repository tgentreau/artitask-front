export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientRequest {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  notes?: string;
}

export interface UpdateClientRequest {
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  notes?: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
