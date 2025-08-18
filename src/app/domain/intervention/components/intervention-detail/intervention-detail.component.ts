import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterventionService } from '../../services/intervention.service';
import { InterventionResponse } from '../../models/intervention.model';

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intervention-detail.component.html'
})
export class InterventionDetailComponent implements OnInit {
  private interventionService = inject(InterventionService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);

  intervention = signal<InterventionResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  interventionId!: string;

  showCancelModal = signal<boolean>(false);
  cancelReason = '';

  showCompleteModal = signal<boolean>(false);
  coutReel = 0;

  showPhotoModal = signal<boolean>(false);
  photoType = signal<'before' | 'during' | 'after'>('before');
  photoUrl = '';
  photoDescription = '';

  ngOnInit(): void {
    this.interventionId = this.route.snapshot.paramMap.get('id')!;
    if (this.interventionId) {
      this.loadIntervention();
    }
  }

  loadIntervention(): void {
    this.loading.set(true);
    this.error.set(null);

    this.interventionService.getById(this.interventionId).subscribe({
      next: (data: InterventionResponse) => {
        this.intervention.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement de l\'intervention');
        this.loading.set(false);
        console.error('Error loading intervention:', err);
      }
    });
  }

  canStart(): boolean {
    const status = this.intervention()?.status.value;
    return status === 'planned';
  }

  canComplete(): boolean {
    const status = this.intervention()?.status.value;
    return status === 'in_progress' || status === 'paused';
  }

  canCancel(): boolean {
    const status = this.intervention()?.status.value;
    return status === 'planned' || status === 'in_progress' || status === 'paused';
  }

  canPause(): boolean {
    const status = this.intervention()?.status.value;
    return status === 'in_progress';
  }

  canResume(): boolean {
    const status = this.intervention()?.status.value;
    return status === 'paused';
  }

  startIntervention(): void {
    this.loading.set(true);
    this.interventionService.start(this.interventionId).subscribe({
      next: () => {
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors du démarrage de l\'intervention');
        this.loading.set(false);
        console.error('Error starting intervention:', err);
      }
    });
  }

  pauseIntervention(): void {
    this.loading.set(true);
    this.interventionService.pause(this.interventionId).subscribe({
      next: () => {
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors de la mise en pause');
        this.loading.set(false);
        console.error('Error pausing intervention:', err);
      }
    });
  }

  resumeIntervention(): void {
    this.loading.set(true);
    this.interventionService.resume(this.interventionId).subscribe({
      next: () => {
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors de la reprise');
        this.loading.set(false);
        console.error('Error resuming intervention:', err);
      }
    });
  }

  openCompleteModal(): void {
    const estimatedCost = this.intervention()?.coutEstime?.amount;
    this.coutReel = estimatedCost || 0;
    this.showCompleteModal.set(true);
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
  }

  completeIntervention(): void {
    if (this.coutReel <= 0) {
      this.error.set('Le coût réel doit être supérieur à 0');
      return;
    }

    this.loading.set(true);
    this.interventionService.complete(this.interventionId, {
      coutReel: this.coutReel
    }).subscribe({
      next: () => {
        this.closeCompleteModal();
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors de la complétion de l\'intervention');
        this.loading.set(false);
        console.error('Error completing intervention:', err);
      }
    });
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelReason = '';
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  cancelIntervention(): void {
    const reason = this.cancelReason.trim();
    if (reason.length < 10) {
      this.error.set('La raison doit contenir au moins 10 caractères');
      return;
    }

    this.loading.set(true);
    this.interventionService.cancel(this.interventionId, { reason }).subscribe({
      next: () => {
        this.closeCancelModal();
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors de l\'annulation');
        this.loading.set(false);
        console.error('Error cancelling intervention:', err);
      }
    });
  }

  openPhotoModal(type: 'before' | 'during' | 'after'): void {
    this.photoType.set(type);
    this.showPhotoModal.set(true);
    this.photoUrl = '';
    this.photoDescription = '';
  }

  closePhotoModal(): void {
    this.showPhotoModal.set(false);
  }

  addPhoto(): void {
    const url = this.photoUrl.trim();
    if (!url) {
      this.error.set('L\'URL de la photo est obligatoire');
      return;
    }

    this.loading.set(true);
    this.interventionService.addPhoto(this.interventionId, {
      url,
      type: this.photoType(),
      description: this.photoDescription.trim() || undefined
    }).subscribe({
      next: () => {
        this.closePhotoModal();
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors de l\'ajout de la photo');
        this.loading.set(false);
        console.error('Error adding photo:', err);
      }
    });
  }

  goToReport(): void {
    this.router.navigate(['/interventions', this.interventionId, 'report']);
  }

  editIntervention(): void {
    this.router.navigate(['/interventions', this.interventionId, 'edit']);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleTimeString('fr-FR', {
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

  formatDuration(hours: number): string {
    if (!hours || hours === 0) return '-';

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'planned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'paused': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(color: string): string {
    const colorClasses: Record<string, string> = {
      'green': 'text-green-600',
      'yellow': 'text-yellow-600',
      'red': 'text-red-600'
    };
    return colorClasses[color] || 'text-gray-600';
  }

  getPhotosByType(type: string) {
    return this.intervention()?.photos.filter(p => p.type === type) || [];
  }

  getPhotoTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'before': 'Avant',
      'during': 'Pendant',
      'after': 'Après'
    };
    return labels[type] || type;
  }
}
