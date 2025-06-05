import {Component, inject} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {InterventionService} from "../services/intervention.service";

@Component({
  selector: 'app-pages',
  imports: [CommonModule, RouterModule],
  templateUrl: './intervention-dashboard.component.html',
  styleUrl: './intervention-dashboard.component.css'
})
export class InterventionDashboardComponent {
  protected interventionService = inject(InterventionService);

  ngOnInit(): void {
    this.loadInterventions();
  }

  loadInterventions(): void {
    this.interventionService.getInterventions().subscribe({
      next: () => {
        // Les données sont automatiquement mises à jour via les signals
      },
      error: (error) => {
        console.error('Error loading interventions:', error);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'scheduled': 'Planifiée',
      'in_progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  startIntervention(id: string): void {
    this.interventionService.startIntervention(id).subscribe({
      next: () => {
        console.log('Intervention started');
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  completeIntervention(id: string): void {
    this.interventionService.completeIntervention(id, 'Intervention terminée avec succès').subscribe({
      next: () => {
        console.log('Intervention completed');
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
