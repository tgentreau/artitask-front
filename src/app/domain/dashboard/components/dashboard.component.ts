import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';
import {DashboardService} from "../services/dashboard.service";
import {
  ArtisanProfileResponse,
  CalendarEventResponse,
  ClientListItem,
  InterventionStatsResponse, ServiceListItem
} from "../models/dashboard.model";
import {InterventionListItem} from "../../intervention/models/intervention.model";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  loading = signal(true);
  profile = signal<ArtisanProfileResponse | null>(null);
  stats = signal<InterventionStatsResponse | null>(null);
  todayEvents = signal<CalendarEventResponse[]>([]);
  upcomingInterventions = signal<InterventionListItem[]>([]);
  recentClients = signal<ClientListItem[]>([]);
  topServices = signal<ServiceListItem[]>([]);

  ngOnInit() {
    this.loadData();

    timer(0, 60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading.set(true);

    this.dashboardService.loadDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Stats reçues:', data.stats);
          console.log('Total Revenue:', data.stats?.totalRevenue);
          console.log('Average Cost:', data.stats?.averageCost);
          console.log('Type of totalRevenue:', typeof data.stats?.totalRevenue);
          console.log('Type of averageCost:', typeof data.stats?.averageCost);

          this.profile.set(data.profile);
          this.stats.set(data.stats);
          this.todayEvents.set(data.todayEvents);
          this.upcomingInterventions.set(data.upcomingInterventions.items);
          this.recentClients.set(data.recentClients.items);
          this.topServices.set(data.topServices);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Erreur chargement dashboard:', error);
          this.loading.set(false);
        }
      });
  }

  refresh() {
    this.loadData();
  }

  viewIntervention(id: string) {
    this.router.navigate(['/interventions', id]);
  }

  viewClient(id: string) {
    this.router.navigate(['/clients', id]);
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '0,00 €';
    }
    const numericAmount = amount;
    if (isNaN(numericAmount)) {
      console.warn('formatCurrency: Invalid amount', amount);
      return '0,00 €';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(numericAmount);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'planned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'urgent': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'normal': 'bg-blue-100 text-blue-800',
      'low': 'bg-gray-100 text-gray-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }
}
