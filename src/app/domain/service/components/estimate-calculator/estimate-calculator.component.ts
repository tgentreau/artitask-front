import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { Service, EstimateResponse, CalculateEstimateRequest } from '../../models/service.model';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-estimate-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estimate-calculator.component.html'
})
export class EstimateCalculatorComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  service = signal<Service | null>(null);
  loading = signal(false);
  estimation = signal<EstimateResponse | null>(null);

  heuresEstimees = 1;
  estUrgence = false;
  estWeekend = false;
  incluireFraisDeplacement = true;

  ngOnInit(): void {
    const serviceId = this.route.snapshot.params['id'];
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  private loadService(id: string): void {
    this.loading.set(true);
    this.serviceService.getService(id).subscribe({
      next: (response) => {
        this.service.set(response.data);
        this.loading.set(false);
        this.calculateEstimate();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du service:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de charger le service'
        );
        this.loading.set(false);
        this.router.navigate(['/services']);
      }
    });
  }

  calculateEstimate(): void {
    const currentService = this.service();
    if (!currentService) return;

    const request: CalculateEstimateRequest = {
      heuresEstimees: this.heuresEstimees,
      estUrgence: this.estUrgence,
      estWeekend: this.estWeekend,
      incluireFraisDeplacement: this.incluireFraisDeplacement
    };

    this.loading.set(true);
    this.serviceService.calculateEstimate(currentService.id, request).subscribe({
      next: (response) => {
        this.estimation.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du calcul:', error);
        this.notificationService.error(
          'Erreur',
          'Impossible de calculer l\'estimation'
        );
        this.loading.set(false);
      }
    });
  }

  onParameterChange(): void {
    if (this.service()) {
      this.calculateEstimate();
    }
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  copyEstimate(): void {
    const est = this.estimation();
    const srv = this.service();
    if (!est || !srv) return;

    const text = `
ESTIMATION - ${srv.nom}
========================
${srv.description}

Paramètres:
- Durée estimée: ${this.heuresEstimees}h
${this.estUrgence ? '- Intervention urgente: OUI' : ''}
${this.estWeekend ? '- Weekend/Jour férié: OUI' : ''}
${this.incluireFraisDeplacement ? '- Frais de déplacement inclus: OUI' : ''}

Détail:
- Montant de base: ${this.formatPrice(est.montantBase)}
${est.majorationUrgence ? `- Majoration urgence: ${this.formatPrice(est.majorationUrgence)}` : ''}
${est.majorationWeekend ? `- Majoration weekend: ${this.formatPrice(est.majorationWeekend)}` : ''}
${est.fraisDeplacement ? `- Frais de déplacement: ${this.formatPrice(est.fraisDeplacement)}` : ''}

TOTAL: ${this.formatPrice(est.montantTotal)}
========================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.success(
        'Copié !',
        'L\'estimation a été copiée dans le presse-papier'
      );
    });
  }

  createDevis(): void {
    const srv = this.service();
    const est = this.estimation();
    if (!srv || !est) return;

    this.router.navigate(['/devis/new'], {
      queryParams: {
        serviceId: srv.id,
        montant: est.montantTotal,
        heures: this.heuresEstimees,
        urgence: this.estUrgence,
        weekend: this.estWeekend
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }
}
