import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateInterventionRequest,
  CompleteInterventionRequest,
  CancelInterventionRequest,
  InterventionResponse,
  InterventionListResult,
  ListInterventionsQuery,
  GenerateReportRequest,
  AddPhotoRequest,
  CalendarQuery,
  CalendarEvent
} from '../models/intervention.model';
import {ApiResponse} from "../../../shared/models/api-error-response.interface";

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/interventions`;

  create(data: CreateInterventionRequest): Observable<{ interventionId: string }> {
    return this.http.post<ApiResponse<{ interventionId: string }>>(
      this.apiUrl,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getById(interventionId: string): Observable<InterventionResponse> {
    return this.http.get<ApiResponse<InterventionResponse>>(
      `${this.apiUrl}/${interventionId}`
    ).pipe(
      map(response => response.data)
    );
  }

  list(query?: ListInterventionsQuery): Observable<InterventionListResult> {
    let params = new HttpParams();

    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.status) params = params.set('status', query.status);
      if (query.clientId) params = params.set('clientId', query.clientId);
      if (query.serviceId) params = params.set('serviceId', query.serviceId);
      if (query.dateStart) params = params.set('dateStart', query.dateStart);
      if (query.dateEnd) params = params.set('dateEnd', query.dateEnd);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);
    }

    return this.http.get<ApiResponse<InterventionListResult>>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  start(interventionId: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${interventionId}/start`,
      {}
    ).pipe(
      map(() => void 0)
    );
  }

  pause(interventionId: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${interventionId}/pause`,
      {}
    ).pipe(
      map(() => void 0)
    );
  }

  resume(interventionId: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${interventionId}/resume`,
      {}
    ).pipe(
      map(() => void 0)
    );
  }

  complete(interventionId: string, data: CompleteInterventionRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${interventionId}/complete`,
      data
    ).pipe(
      map(() => void 0)
    );
  }

  cancel(interventionId: string, data: CancelInterventionRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${interventionId}/cancel`,
      data
    ).pipe(
      map(() => void 0)
    );
  }

  generateReport(interventionId: string, data: GenerateReportRequest): Observable<{ reportId: string }> {
    return this.http.post<ApiResponse<{ reportId: string }>>(
      `${this.apiUrl}/${interventionId}/report`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getReport(interventionId: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/${interventionId}/report`
    ).pipe(
      map(response => response.data)
    );
  }

  addPhoto(interventionId: string, data: AddPhotoRequest): Observable<{ photoId: string }> {
    return this.http.post<ApiResponse<{ photoId: string }>>(
      `${this.apiUrl}/${interventionId}/photos`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getCalendarEvents(query: CalendarQuery): Observable<CalendarEvent[]> {
    let params = new HttpParams()
      .set('startDate', query.startDate)
      .set('endDate', query.endDate);

    return this.http.get<ApiResponse<CalendarEvent[]>>(
      `${environment.apiUrl}/calendar/events`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  getStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/calendar/stats`
    ).pipe(
      map(response => response.data)
    );
  }
}
