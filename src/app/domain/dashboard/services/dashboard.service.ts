import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ArtisanProfileResponse,
  InterventionStatsResponse,
  CalendarEventResponse,
  InterventionListItem,
  ClientListItem,
  ServiceListItem,
  CalendarQueryParams,
  ListQueryParams,
  InterventionListQueryParams
} from '../models/dashboard.model';
import {ApiResponse} from "../../../shared/models/api-error-response.interface";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProfile(): Observable<ArtisanProfileResponse> {
    return this.http.get<ApiResponse<ArtisanProfileResponse>>(
      `${this.apiUrl}/auth/profile`
    ).pipe(
      map(response => response.data)
    );
  }

  getStats(params?: CalendarQueryParams): Observable<InterventionStatsResponse> {
    let httpParams = new HttpParams();
    if (params?.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params?.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<ApiResponse<InterventionStatsResponse>>(
      `${this.apiUrl}/calendar/stats`,
      { params: httpParams }
    ).pipe(
      map(response => {
        console.log('Stats API Response:', response);
        console.log('Stats data:', response.data);
        console.log('Raw totalRevenue:', response.data?.totalRevenue);
        console.log('Raw averageCost:', response.data?.averageCost);
        return response.data
      })
    );
  }

  getCalendarEvents(params: CalendarQueryParams): Observable<CalendarEventResponse[]> {
    const httpParams = new HttpParams()
      .set('startDate', params.startDate)
      .set('endDate', params.endDate);

    return this.http.get<ApiResponse<CalendarEventResponse[]>>(
      `${this.apiUrl}/calendar/events`,
      { params: httpParams }
    ).pipe(
      map(response => response.data)
    );
  }

  getInterventions(params?: InterventionListQueryParams): Observable<{
    items: InterventionListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.clientId) {
      httpParams = httpParams.set('clientId', params.clientId);
    }
    if (params?.serviceId) {
      httpParams = httpParams.set('serviceId', params.serviceId);
    }

    return this.http.get<ApiResponse<{
      items: InterventionListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(
      `${this.apiUrl}/interventions`,
      { params: httpParams }
    ).pipe(
      map(response => response.data)
    );
  }

  getClients(params?: ListQueryParams): Observable<{
    items: ClientListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<ApiResponse<{
      items: ClientListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(
      `${this.apiUrl}/clients`,
      { params: httpParams }
    ).pipe(
      map(response => response.data)
    );
  }

  getServices(params?: ListQueryParams): Observable<ServiceListItem[]> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<ServiceListItem[]>>(
      `${this.apiUrl}/services`,
      { params: httpParams }
    ).pipe(
      map(response => response.data)
    );
  }

  loadDashboardData() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return forkJoin({
      profile: this.getProfile(),
      stats: this.getStats({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      }),
      todayEvents: this.getCalendarEvents({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      }),
      upcomingInterventions: this.getInterventions({
        status: 'planned',
        limit: 5,
        sortBy: 'date_intervention',
        sortOrder: 'ASC'
      }),
      recentClients: this.getClients({
        limit: 5,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }),
      topServices: this.getServices({
        limit: 5
      })
    });
  }
}
