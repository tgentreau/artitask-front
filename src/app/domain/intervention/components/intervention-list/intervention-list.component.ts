import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InterventionService } from '../../services/intervention.service';
import {
  InterventionListItem,
  ListInterventionsQuery,
  InterventionListResult
} from '../../models/intervention.model';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intervention-list.component.html'
})
export class InterventionListComponent implements OnInit {
  private interventionService = inject(InterventionService);
  private router = inject(Router);

  interventions = signal<InterventionListItem[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  currentPage = 1;
  pageSize = 20;
  totalItems = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

  searchTerm = '';
  filterStatus = '';
  filterClientId = '';
  filterServiceId = '';
  filterDateStart = '';
  filterDateEnd = '';
  sortBy = 'date_intervention';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'planned', label: 'Planifiée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'paused', label: 'En pause' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  sortOptions = [
    { value: 'date_intervention', label: 'Date d\'intervention' },
    { value: 'status', label: 'Statut' },
    { value: 'priority', label: 'Priorité' },
    { value: 'created_at', label: 'Date de création' }
  ];

  displayedInterventions = computed(() => {
    const allInterventions = this.interventions();

    if (!this.searchTerm || this.searchTerm.length < 2) {
      return allInterventions;
    }

    const searchLower = this.searchTerm.toLowerCase();
    return allInterventions.filter(intervention =>
      intervention.descriptionDemande.toLowerCase().includes(searchLower) ||
      intervention.clientId.toLowerCase().includes(searchLower) ||
      intervention.clientNom?.toLowerCase().includes(searchLower) ||
      intervention.serviceId?.toLowerCase().includes(searchLower) ||
      intervention.serviceNom?.toLowerCase().includes(searchLower) ||
      intervention.status.label.toLowerCase().includes(searchLower)
    );
  });

  ngOnInit(): void {
    this.loadInterventions();
  }

  loadInterventions(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: ListInterventionsQuery = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.filterStatus && { status: this.filterStatus }),
      ...(this.filterClientId && { clientId: this.filterClientId }),
      ...(this.filterServiceId && { serviceId: this.filterServiceId }),
      ...(this.filterDateStart && { dateStart: this.filterDateStart }),
      ...(this.filterDateEnd && { dateEnd: this.filterDateEnd }),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.interventionService.list(query).subscribe({
      next: (result: InterventionListResult) => {
        this.interventions.set(result.items);
        this.totalItems.set(result.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement des interventions');
        this.loading.set(false);
        console.error('Error loading interventions:', err);
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.length === 0 || this.searchTerm.length >= 2) {
      this.currentPage = 1;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInterventions();
  }

  onSortChange(): void {
    this.loadInterventions();
  }

  sort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadInterventions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInterventions();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.loadInterventions();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInterventions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.loadInterventions();
    }
  }

  viewIntervention(id: string): void {
    this.router.navigate(['/interventions', id]);
  }

  editIntervention(id: string): void {
    this.router.navigate(['/interventions', id, 'edit']);
  }

  createIntervention(): void {
    this.router.navigate(['/interventions/new']);
  }

  startIntervention(id: string): void {
    this.interventionService.start(id).subscribe({
      next: () => {
        this.loadInterventions();
      },
      error: (err) => {
        this.error.set('Erreur lors du démarrage de l\'intervention');
        console.error('Error starting intervention:', err);
      }
    });
  }

  completeIntervention(id: string): void {
    this.router.navigate(['/interventions', id, 'report']);
  }

  cancelIntervention(id: string): void {
    const reason = prompt('Raison de l\'annulation (min 10 caractères):');
    if (reason && reason.length >= 10) {
      this.interventionService.cancel(id, { reason }).subscribe({
        next: () => {
          this.loadInterventions();
        },
        error: (err) => {
          this.error.set('Erreur lors de l\'annulation');
          console.error('Error cancelling intervention:', err);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'planned': 'badge-info',
      'in_progress': 'badge-warning',
      'paused': 'badge-secondary',
      'completed': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  getPriorityClass(color: string): string {
    const colorClasses: Record<string, string> = {
      'green': 'text-success',
      'yellow': 'text-warning',
      'red': 'text-danger'
    };
    return colorClasses[color] || 'text-secondary';
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  protected Math = Math;
}
