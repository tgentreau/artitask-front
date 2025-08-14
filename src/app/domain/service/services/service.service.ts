// src/app/domain/service/services/service.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  CalculateEstimateRequest,
  EstimateResponse,
  ServiceListResponse,
  ApiResponse,
  ServiceFilters
} from '../models/service.model';
import {NotificationService} from "../../../shared/services/notification.service";

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private apiUrl = `${environment.apiUrl}/services`;

  // Signals pour la gestion de l'état
  private servicesSignal = signal<Service[]>([]);
  private currentServiceSignal = signal<Service | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private totalSignal = signal(0);
  private currentPageSignal = signal(1);
  private pageSizeSignal = signal(20);

  // Computed signals pour l'accès en lecture
  services$ = computed(() => this.servicesSignal());
  currentService$ = computed(() => this.currentServiceSignal());
  loading$ = computed(() => this.loadingSignal());
  error$ = computed(() => this.errorSignal());
  total$ = computed(() => this.totalSignal());
  currentPage$ = computed(() => this.currentPageSignal());
  totalPages$ = computed(() => Math.ceil(this.totalSignal() / this.pageSizeSignal()));

  // Computed signals pour les filtres
  activeServices$ = computed(() =>
    this.servicesSignal().filter(s => s.actif)
  );

  inactiveServices$ = computed(() =>
    this.servicesSignal().filter(s => !s.actif)
  );

  servicesByType$ = computed(() => {
    const services = this.servicesSignal();
    return services.reduce((acc, service) => {
      const type = service.type.value;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  });

  /**
   * Récupère la liste des services avec pagination et filtres
   */
  getServices(
    page = 1,
    limit = 20,
    filters?: ServiceFilters
  ): Observable<ApiResponse<ServiceListResponse>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Ajout des filtres
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.actif !== undefined) {
      params = params.set('actif', filters.actif.toString());
    }
    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters?.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<ApiResponse<ServiceListResponse>>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.servicesSignal.set(response.data.items);
        this.totalSignal.set(response.data.total);
        this.currentPageSignal.set(response.data.page);
        this.pageSizeSignal.set(response.data.limit);
        this.loadingSignal.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Récupère un service par son ID
   */
  getService(id: string): Observable<ApiResponse<Service>> {
    this.loadingSignal.set(true);

    return this.http.get<ApiResponse<Service>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        this.currentServiceSignal.set(response.data);
        this.loadingSignal.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crée un nouveau service
   */
  createService(data: CreateServiceRequest): Observable<ApiResponse<{ serviceId: string }>> {
    this.loadingSignal.set(true);

    // Validation côté client
    if (!this.validateServiceData(data)) {
      return throwError(() => new Error('Données invalides'));
    }

    return this.http.post<ApiResponse<{ serviceId: string }>>(this.apiUrl, data).pipe(
      tap(response => {
        this.loadingSignal.set(false);
        this.notificationService.success(
          'Service créé',
          `Le service "${data.nom}" a été créé avec succès`
        );
        // Rafraîchir la liste
        this.refreshServices();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Met à jour un service existant
   */
  updateService(id: string, data: UpdateServiceRequest): Observable<ApiResponse<void>> {
    this.loadingSignal.set(true);

    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => {
        this.loadingSignal.set(false);
        this.notificationService.success(
          'Service modifié',
          'Les modifications ont été enregistrées'
        );
        // Mettre à jour localement
        this.updateLocalService(id, data);
        // Rafraîchir depuis le serveur pour être sûr
        this.getService(id).subscribe();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Active un service
   */
  activateService(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      tap(() => {
        this.notificationService.success(
          'Service activé',
          'Le service est maintenant disponible'
        );
        this.updateServiceStatus(id, true);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Désactive un service
   */
  deactivateService(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      tap(() => {
        this.notificationService.warning(
          'Service désactivé',
          'Le service n\'est plus disponible'
        );
        this.updateServiceStatus(id, false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Calcule une estimation pour un service
   */
  calculateEstimate(
    id: string,
    data: CalculateEstimateRequest
  ): Observable<ApiResponse<EstimateResponse>> {
    this.loadingSignal.set(true);

    return this.http.post<ApiResponse<EstimateResponse>>(
      `${this.apiUrl}/${id}/estimate`,
      data
    ).pipe(
      tap(response => {
        this.loadingSignal.set(false);
        const total = response.data.montantTotal;
        this.notificationService.info(
          'Estimation calculée',
          `Montant total estimé : ${this.formatCurrency(total)}`
        );
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recherche de services par nom
   */
  searchServices(query: string): Observable<Service[]> {
    if (!query || query.length < 2) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const filtered = this.servicesSignal().filter(service =>
      service.nom.toLowerCase().includes(query.toLowerCase()) ||
      service.description.toLowerCase().includes(query.toLowerCase())
    );

    return new Observable(observer => {
      observer.next(filtered);
      observer.complete();
    });
  }

  /**
   * Efface le service courant
   */
  clearCurrentService(): void {
    this.currentServiceSignal.set(null);
  }

  /**
   * Rafraîchit la liste des services
   */
  refreshServices(): void {
    this.getServices(
      this.currentPageSignal(),
      this.pageSizeSignal()
    ).subscribe();
  }

  /**
   * Réinitialise les erreurs
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Met à jour un service localement dans la liste
   */
  private updateLocalService(id: string, updates: UpdateServiceRequest): void {
    this.servicesSignal.update(services =>
      services.map(service => {
        if (service.id === id) {
          // Mise à jour partielle en préservant la structure complète
          const updatedService: Service = {
            ...service,
            nom: updates.nom ?? service.nom,
            description: updates.description ?? service.description,
            type: updates.type ? {
              value: updates.type,
              label: updates.type,
              description: ''
            } : service.type,
            tarification: {
              ...service.tarification,
              tarifHoraire: updates.tarifHoraire ?? service.tarification.tarifHoraire,
              tarifFixe: updates.tarifFixe ?? service.tarification.tarifFixe,
              majorationUrgence: updates.majorationUrgence ?? service.tarification.majorationUrgence,
              majorationWeekend: updates.majorationWeekend ?? service.tarification.majorationWeekend,
              fraisDeplacement: updates.fraisDeplacement ?? service.tarification.fraisDeplacement
            },
            updatedAt: new Date()
          };
          return updatedService;
        }
        return service;
      })
    );
  }

  /**
   * Met à jour le statut d'un service localement
   */
  private updateServiceStatus(id: string, actif: boolean): void {
    this.servicesSignal.update(services =>
      services.map(service => {
        if (service.id === id) {
          return { ...service, actif };
        }
        return service;
      })
    );

    // Mettre à jour aussi le service courant si c'est lui
    const currentService = this.currentServiceSignal();
    if (currentService && currentService.id === id) {
      this.currentServiceSignal.set({ ...currentService, actif });
    }
  }

  /**
   * Valide les données d'un service
   */
  private validateServiceData(data: CreateServiceRequest): boolean {
    // Vérifier qu'il y a soit un tarif horaire, soit un tarif fixe, mais pas les deux
    if (!data.tarifHoraire && !data.tarifFixe) {
      this.notificationService.error(
        'Tarif requis',
        'Vous devez spécifier un tarif horaire ou un tarif fixe'
      );
      return false;
    }

    if (data.tarifHoraire && data.tarifFixe) {
      this.notificationService.error(
        'Conflit de tarification',
        'Vous ne pouvez pas spécifier à la fois un tarif horaire et un tarif fixe'
      );
      return false;
    }

    // Vérifier les majorations
    if (data.majorationUrgence && (data.majorationUrgence < 1 || data.majorationUrgence > 3)) {
      this.notificationService.error(
        'Majoration invalide',
        'La majoration urgence doit être entre 1 et 3'
      );
      return false;
    }

    if (data.majorationWeekend && (data.majorationWeekend < 1 || data.majorationWeekend > 3)) {
      this.notificationService.error(
        'Majoration invalide',
        'La majoration weekend doit être entre 1 et 3'
      );
      return false;
    }

    return true;
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    this.loadingSignal.set(false);

    let errorMessage = 'Une erreur est survenue';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur';
    } else if (error.status === 404) {
      errorMessage = 'Service non trouvé';
    } else if (error.status === 409) {
      errorMessage = 'Un service avec ce nom existe déjà';
    }

    this.errorSignal.set(errorMessage);
    this.notificationService.showHttpError(error);

    return throwError(() => error);
  }

  /**
   * Formate un montant en devise
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
