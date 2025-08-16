import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceListResponse,
  ServiceFilters,
  CalculateEstimateRequest,
  EstimateResponse,
  MoneyAmount,
  Tarification
} from '../models/service.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/services`;

  private extractAmount(value: MoneyAmount | number | undefined): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    return value.amount;
  }

  private normalizeTarification(tarification: any): Tarification {
    return {
      tarifHoraire: this.extractAmount(tarification.tarifHoraire),
      tarifFixe: this.extractAmount(tarification.tarifFixe),
      majorationUrgence: tarification.majorationUrgence ?? 0,
      majorationWeekend: tarification.majorationWeekend ?? 0,
      fraisDeplacement: this.extractAmount(tarification.fraisDeplacement)
    };
  }

  private normalizeService(service: any): Service {
    return {
      ...service,
      tarification: this.normalizeTarification(service.tarification)
    };
  }

  getServices(filters?: ServiceFilters): Observable<ServiceListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.actif !== undefined) params = params.set('actif', filters.actif.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<ApiResponse<ServiceListResponse>>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response.data,
        items: response.data.items.map(service => this.normalizeService(service))
      }))
    );
  }

  getService(id: string): Observable<ApiResponse<Service>> {
    return this.http.get<ApiResponse<Service>>(`${this.apiUrl}/${id}`).pipe(
      map(response => ({
        ...response,
        data: this.normalizeService(response.data)
      }))
    );
  }

  createService(data: CreateServiceRequest): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(this.apiUrl, data);
  }

  updateService(id: string, data: UpdateServiceRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}`, data);
  }

  deleteService(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  toggleService(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/toggle`, {});
  }

  calculateEstimate(
    serviceId: string,
    data: CalculateEstimateRequest
  ): Observable<ApiResponse<EstimateResponse>> {
    return this.http.post<ApiResponse<EstimateResponse>>(
      `${this.apiUrl}/${serviceId}/estimate`,
      data
    );
  }
}
