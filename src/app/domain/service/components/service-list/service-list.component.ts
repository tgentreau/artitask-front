import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { Service, ServiceFilters } from '../../models/service.model';
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

  toggleServiceStatus(service: Service, event: Event): void {
    event.stopPropagation();

    if (service.actif) {
      if (confirm(`Êtes-vous sûr de vouloir désactiver le service "${service.nom}" ?`)) {
        this.serviceService.deactivateService(service.id).subscribe({
          error: (error) => {
            console.error('Erreur lors de la désactivation:', error);
          }
        });
      }
    } else {
      this.serviceService.activateService(service.id).subscribe({
        error: (error) => {
          console.error('Erreur lors de l\'activation:', error);
        }
      });
    }
  }

  viewService(service: Service): void {
    this.router.navigate(['/services', service.id]);
  }

  editService(service: Service, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/services', service.id, 'edit']);
  }

  createService(): void {
    this.router.navigate(['/services/new']);
  }

  duplicateService(service: Service, event: Event): void {
    event.stopPropagation();
    const newService = {
      nom: `${service.nom} (copie)`,
      description: service.description,
      type: service.type.value,
      tarifHoraire: service.tarification.tarifHoraire,
      tarifFixe: service.tarification.tarifFixe,
      majorationUrgence: service.tarification.majorationUrgence,
      majorationWeekend: service.tarification.majorationWeekend,
      fraisDeplacement: service.tarification.fraisDeplacement
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
      }
    });
  }

  calculateEstimate(service: Service, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/services', service.id, 'estimate']);
  }

  onCardEdit(service: Service): void {
    this.editService(service, new Event('click'));
  }

  onCardToggle(service: Service): void {
    this.toggleServiceStatus(service, new Event('click'));
  }

  onCardDuplicate(service: Service): void {
    this.duplicateService(service, new Event('click'));
  }

  onCardEstimate(service: Service): void {
    this.calculateEstimate(service, new Event('click'));
  }

  onCardSelect(serviceId: string): void {
    this.toggleServiceSelection(serviceId, new Event('click'));
  }

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

  formatPrice(price?: number): string {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  getServiceTypeIcon(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.icon || '📋';
  }
}
