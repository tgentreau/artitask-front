import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { InterventionService } from '../../services/intervention.service';
import { InterventionResponse } from '../../models/intervention.model';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [
    FormsModule
  ],
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
    this.loadIntervention();
  }

  loadIntervention(): void {
    this.loading.set(true);
    this.error.set(null);

    this.interventionService.getById(this.interventionId).subscribe({
      next: (intervention) => {
        this.intervention.set(intervention);
        this.loading.set(false);

        if (intervention.coutEstime) {
          this.coutReel = intervention.coutEstime.amount;
        }
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement de l\'intervention');
        this.loading.set(false);
        console.error('Error loading intervention:', err);
      }
    });
  }

  canStart(): boolean {
    const intervention = this.intervention();
    return intervention?.status.value === 'planned';
  }

  canPause(): boolean {
    const intervention = this.intervention();
    return intervention?.status.value === 'in_progress';
  }

  canResume(): boolean {
    const intervention = this.intervention();
    return intervention?.status.value === 'paused';
  }

  canComplete(): boolean {
    const intervention = this.intervention();
    return intervention?.status.value === 'in_progress' ||
      intervention?.status.value === 'paused';
  }

  canCancel(): boolean {
    const intervention = this.intervention();
    return intervention?.status.value === 'planned' ||
      intervention?.status.value === 'in_progress' ||
      intervention?.status.value === 'paused';
  }

  startIntervention(): void {
    this.loading.set(true);
    this.interventionService.start(this.interventionId).subscribe({
      next: () => {
        this.loadIntervention();
      },
      error: (err) => {
        this.error.set('Erreur lors du démarrage');
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
        this.router.navigate(['/interventions', this.interventionId, 'report']);
      },
      error: (err) => {
        this.error.set('Erreur lors de la finalisation');
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
    this.cancelReason = '';
  }

  cancelIntervention(): void {
    const reason = this.cancelReason.trim();
    if (reason.length < 10) {
      this.error.set('La raison doit faire au moins 10 caractères');
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

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getPhotosByType(type: string) {
    return this.intervention()?.photos.filter(p => p.type === type) || [];
  }
}
