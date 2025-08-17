import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { Service, ServiceFilters, MoneyAmount } from '../../models/service.model';
import { SERVICE_TYPES, STATUS_COLORS } from '../../models/service.constants';
import { NotificationService } from "../../../../shared/services/notification.service";
import { ServiceCardComponent } from '../service-card/service-card.component';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceCardComponent],
  templateUrl: './service-list.component.html'
})
export class ServiceListComponent implements OnInit {
  protected serviceService = inject(ServiceService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  selectedType = '';
  showActiveOnly = true;
  searchQuery = '';
  sortBy = 'nom';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  currentPage = 1;
  limit = 12;

  showFilters = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');
  selectedServices = signal<Set<string>>(new Set());

  serviceTypes = SERVICE_TYPES;
  statusColors = STATUS_COLORS;

  private searchResults = signal<Service[]>([]);

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    const filters: ServiceFilters = {
      type: this.selectedType || undefined,
      actif: this.showActiveOnly ? true : undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.serviceService.getServices(
      this.currentPage,
      this.limit,
      filters
    ).subscribe({
      error: (error) => {
        console.error('Erreur lors du chargement des services:', error);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadServices();
  }

  onSearchChange(): void {
    if (this.searchQuery.length >= 2) {
      this.serviceService.searchServices(this.searchQuery).subscribe({
        next: (results) => {
          this.searchResults.set(results);
        }
      });
    } else {
      this.searchResults.set([]);
      this.loadServices();
    }
  }

  toggleSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadServices();
  }

  createService(): void {
    this.router.navigate(['/services/new']);
  }

  editService(service: Service): void {
    this.router.navigate(['/services', service.id, 'edit']);
  }

  duplicateService(service: Service): void {
    const extractAmount = (value: MoneyAmount | number | undefined): number => {
      if (!value) return 0;
      if (typeof value === 'object' && 'amount' in value) {
        return value.amount;
      }
      return value;
    };

    const newService = {
      nom: `${service.nom} (copie)`,
      description: service.description,
      type: service.type.value,
      tarifHoraire: extractAmount(service.tarification.tarifHoraire),
      tarifFixe: extractAmount(service.tarification.tarifFixe),
      majorationUrgence: service.tarification.majorationUrgence,
      majorationWeekend: service.tarification.majorationWeekend,
      fraisDeplacement: extractAmount(service.tarification.fraisDeplacement)
    };

    this.serviceService.createService(newService).subscribe({
      next: () => {
        this.notificationService.success(
          'Service dupliqué',
          'Le service a été dupliqué avec succès'
        );
        this.loadServices();
      },
      error: (error) => {
        console.error('Erreur lors de la duplication:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de dupliquer le service'
        );
      }
    });
  }

  toggleServiceStatus(service: Service, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const action = service.actif ? 'deactivateService' : 'activateService';
    this.serviceService[action](service.id).subscribe({
      next: () => {
        this.notificationService.success(
          'Statut modifié',
          `Le service a été ${service.actif ? 'désactivé' : 'activé'}`
        );
        this.loadServices();
      },
      error: (error) => {
        console.error('Erreur lors du changement de statut:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de modifier le statut du service'
        );
      }
    });
  }

  estimateService(service: Service): void {
    this.router.navigate(['/services', service.id, 'estimate']);
  }

  // Méthodes pour les événements du ServiceCardComponent (vue grille)
  // Ces méthodes reçoivent EXACTEMENT ce que le composant enfant émet
  onCardEdit(service: Service): void {
    this.editService(service);
  }

  onCardToggle(service: Service): void {
    this.toggleServiceStatus(service);
  }

  onCardDuplicate(service: Service): void {
    this.duplicateService(service);
  }

  onCardEstimate(service: Service): void {
    this.estimateService(service);
  }

  onCardSelect(serviceId: string): void {
    this.selectedServices.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      return newSelected;
    });
  }

  // Méthodes utilitaires pour la vue
  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }

  toggleServiceSelection(serviceId: string, event: Event): void {
    event.stopPropagation();
    this.selectedServices.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      return newSelected;
    });
  }

  selectAllServices(): void {
    const services = this.displayedServices();
    if (this.selectedServices().size === services.length) {
      this.selectedServices.set(new Set());
    } else {
      this.selectedServices.set(new Set(services.map(s => s.id)));
    }
  }

  bulkActivate(): void {
    const selected = Array.from(this.selectedServices());
    if (selected.length === 0) return;

    if (confirm(`Activer ${selected.length} service(s) ?`)) {
      selected.forEach(id => {
        this.serviceService.activateService(id).subscribe();
      });
      this.selectedServices.set(new Set());
    }
  }

  bulkDeactivate(): void {
    const selected = Array.from(this.selectedServices());
    if (selected.length === 0) return;

    if (confirm(`Désactiver ${selected.length} service(s) ?`)) {
      selected.forEach(id => {
        this.serviceService.deactivateService(id).subscribe();
      });
      this.selectedServices.set(new Set());
    }
  }

  clearSelection(): void {
    this.selectedServices.set(new Set());
  }

  displayedServices(): Service[] {
    return this.searchQuery.length >= 2
      ? this.searchResults()
      : this.serviceService.services$();
  }

  getTotalPages(): number {
    return Math.ceil(this.serviceService.total$() / this.limit);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadServices();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.loadServices();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadServices();
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  formatPrice(price?: MoneyAmount | number): string {
    let value: number | undefined;

    if (price && typeof price === 'object' && 'amount' in price) {
      value = price.amount;
    } else if (typeof price === 'number') {
      value = price;
    }

    if (!value) return '-';

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getServiceTypeIcon(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.icon || '📋';
  }
}
