import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Intervention, CreateInterventionRequest, UpdateInterventionRequest, InterventionStatus } from '../models/intervention.interface';

@Injectable({
  providedIn: 'root'
})
export class InterventionService {

  // State management avec signals
  private interventions = signal<Intervention[]>(this.getMockData());
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // API publique en lecture seule
  readonly interventions$ = this.interventions.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  // Computed signals pour les statistiques
  readonly todayInterventions = computed(() => {
    const today = new Date().toDateString();
    return this.interventions().filter(intervention =>
      new Date(intervention.interventionDate).toDateString() === today
    );
  });

  readonly urgentInterventions = computed(() => {
    return this.interventions().filter(intervention =>
      intervention.isUrgent && intervention.status !== 'completed'
    );
  });

  readonly interventionsByStatus = computed(() => {
    const interventions = this.interventions();
    return {
      scheduled: interventions.filter(i => i.status === 'scheduled').length,
      in_progress: interventions.filter(i => i.status === 'in_progress').length,
      completed: interventions.filter(i => i.status === 'completed').length,
      cancelled: interventions.filter(i => i.status === 'cancelled').length
    };
  });

  // Méthodes CRUD
  getInterventions(): Observable<Intervention[]> {
    this.loading.set(true);
    this.error.set(null);

    return of(this.interventions()).pipe(
      delay(500), // Simuler appel API
    );
  }

  getIntervention(id: string): Observable<Intervention | null> {
    this.loading.set(true);
    const intervention = this.interventions().find(i => i.id === id) || null;

    if (!intervention) {
      return throwError(() => new Error(`Intervention ${id} not found`));
    }

    return of(intervention).pipe(delay(300));
  }

  createIntervention(request: CreateInterventionRequest): Observable<Intervention> {
    this.loading.set(true);
    this.error.set(null);

    // Validation métier
    const validationError = this.validateIntervention(request);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const newIntervention: Intervention = {
      id: this.generateId(),
      ...request,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mise à jour du state
    const current = this.interventions();
    this.interventions.set([...current, newIntervention]);
    this.loading.set(false);

    return of(newIntervention).pipe(delay(300));
  }

  updateIntervention(id: string, request: UpdateInterventionRequest): Observable<Intervention> {
    this.loading.set(true);
    this.error.set(null);

    const current = this.interventions();
    const index = current.findIndex(i => i.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Intervention ${id} not found`));
    }

    const updated: Intervention = {
      ...current[index],
      ...request,
      updatedAt: new Date()
    };

    // Validation des transitions d'état
    const stateError = this.validateStatusTransition(current[index].status, updated.status);
    if (stateError) {
      return throwError(() => new Error(stateError));
    }

    // Mise à jour du state
    const newList = [...current];
    newList[index] = updated;
    this.interventions.set(newList);
    this.loading.set(false);

    return of(updated).pipe(delay(300));
  }

  deleteIntervention(id: string): Observable<void> {
    this.loading.set(true);
    const current = this.interventions();
    const filtered = current.filter(i => i.id !== id);

    if (filtered.length === current.length) {
      return throwError(() => new Error(`Intervention ${id} not found`));
    }

    this.interventions.set(filtered);
    this.loading.set(false);
    return of(void 0).pipe(delay(300));
  }

  // Méthodes métier spécifiques
  startIntervention(id: string): Observable<Intervention> {
    return this.updateIntervention(id, {
      status: 'in_progress',
      startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
  }

  completeIntervention(id: string, notes?: string, timeSpent?: number): Observable<Intervention> {
    return this.updateIntervention(id, {
      status: 'completed',
      endTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      notes,
      timeSpent
    });
  }

  // Méthodes de validation métier
  private validateIntervention(request: CreateInterventionRequest): string | null {
    if (!request.clientName?.trim()) {
      return 'Client name is required';
    }

    if (!request.clientPhone?.trim()) {
      return 'Client phone is required';
    }

    if (!request.serviceType?.trim()) {
      return 'Service type is required';
    }

    if (!request.description?.trim()) {
      return 'Description is required';
    }

    // Validation de la date (pas dans le passé sauf si urgence)
    const interventionDate = new Date(request.interventionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (interventionDate < today && !request.isUrgent) {
      return 'Intervention date cannot be in the past (except for urgent interventions)';
    }

    return null;
  }

  private validateStatusTransition(currentStatus: InterventionStatus, newStatus: InterventionStatus): string | null {
    const validTransitions: Record<InterventionStatus, InterventionStatus[]> = {
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Pas de transition depuis completed
      'cancelled': ['scheduled'] // Possibilité de replanifier
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed.includes(newStatus)) {
      return `Invalid transition: ${currentStatus} -> ${newStatus}`;
    }

    return null;
  }

  private generateId(): string {
    return 'INT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getMockData(): Intervention[] {
    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: 'INT_001',
        clientName: 'Jean Dupont',
        clientPhone: '06 12 34 56 78',
        clientAddress: '123 Rue de la République, 75001 Paris',
        serviceType: 'Plomberie',
        interventionDate: today,
        startTime: '09:00',
        status: 'scheduled',
        description: 'Réparation fuite d\'eau salle de bain',
        isUrgent: true,
        createdAt: new Date(now.getTime() - 86400000), // Hier
        updatedAt: new Date(now.getTime() - 86400000)
      },
      {
        id: 'INT_002',
        clientName: 'Marie Martin',
        clientPhone: '06 98 76 54 32',
        clientAddress: '456 Avenue des Champs, 75008 Paris',
        serviceType: 'Électricité',
        interventionDate: today,
        startTime: '14:00',
        endTime: '16:30',
        status: 'completed',
        description: 'Installation prises électriques cuisine',
        isUrgent: false,
        notes: 'Travail terminé, client satisfait',
        timeSpent: 150,
        createdAt: new Date(now.getTime() - 172800000), // Avant-hier
        updatedAt: new Date()
      },
      {
        id: 'INT_003',
        clientName: 'Pierre Durand',
        clientPhone: '06 11 22 33 44',
        clientAddress: '789 Boulevard Saint-Michel, 75005 Paris',
        serviceType: 'Chauffage',
        interventionDate: tomorrow,
        startTime: '10:30',
        status: 'scheduled',
        description: 'Maintenance chaudière gaz',
        isUrgent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}
