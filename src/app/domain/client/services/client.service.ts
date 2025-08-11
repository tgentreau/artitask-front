import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientListResponse,
  ApiResponse
} from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clients`;

  // Signals pour état réactif
  private clientsSignal = signal<Client[]>([]);
  private loadingSignal = signal(false);
  private totalSignal = signal(0);
  private currentPageSignal = signal(1);

  // Computed pour accès public
  clients = computed(() => this.clientsSignal());
  loading = computed(() => this.loadingSignal());
  total = computed(() => this.totalSignal());
  currentPage = computed(() => this.currentPageSignal());

  getClients(page = 1, limit = 20, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Observable<ClientListResponse> {
    this.loadingSignal.set(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (sortBy) {
      params = params.set('sortBy', sortBy);
      if (sortOrder) {
        params = params.set('sortOrder', sortOrder);
      }
    }

    return this.http.get<ApiResponse<ClientListResponse>>(this.apiUrl, { params }).pipe(
      map(response => response.data),
      tap(data => {
        this.clientsSignal.set(data.items);
        this.totalSignal.set(data.total);
        this.currentPageSignal.set(data.page);
        this.loadingSignal.set(false);
      })
    );
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<ApiResponse<Client>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createClient(client: CreateClientRequest): Observable<{ clientId: string }> {
    return this.http.post<ApiResponse<{ clientId: string }>>(this.apiUrl, client).pipe(
      map(response => response.data),
      tap(() => {
        this.getClients(this.currentPageSignal()).subscribe();
      })
    );
  }

  updateClient(id: string, client: UpdateClientRequest): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, client).pipe(
      map(response => response.data || {}),
      tap(() => {
        const clients = this.clientsSignal();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
          clients[index] = { ...clients[index], ...client };
          this.clientsSignal.set([...clients]);
        }
      })
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        // Supprimer localement
        const clients = this.clientsSignal().filter(c => c.id !== id);
        this.clientsSignal.set(clients);
        this.totalSignal.update(t => t - 1);
      })
    );
  }

  searchClients(searchTerm: string): Observable<Client[]> {
    return this.http.post<ApiResponse<Client[]>>(`${this.apiUrl}/search`, { searchTerm }).pipe(
      map(response => response.data)
    );
  }
}
