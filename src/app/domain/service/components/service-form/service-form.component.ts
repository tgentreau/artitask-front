// src/app/domain/service/components/service-form/service-form.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { SERVICE_TYPES, DEFAULT_MAJORATIONS, DEFAULT_TARIFS, SERVICE_VALIDATION_MESSAGES } from '../../models/service.constants';
import { Service } from '../../models/service.model';
import {NotificationService} from "../../../../shared/services/notification.service";

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './service-form.component.html'
})
export class ServiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected serviceService = inject(ServiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  serviceForm: FormGroup;
  serviceId?: string;
  isEditMode = false;
  showAdvancedOptions = signal(false);
  tarifMode = signal<'hourly' | 'fixed'>('hourly');

  // Constantes
  serviceTypes = SERVICE_TYPES;
  validationMessages = SERVICE_VALIDATION_MESSAGES;
  defaultMajorations = DEFAULT_MAJORATIONS;
  defaultTarifs = DEFAULT_TARIFS;

  // État du formulaire
  isSubmitting = signal(false);
  currentService?: Service;

  constructor() {
    this.serviceForm = this.fb.group({
      nom: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      type: ['', Validators.required],
      tarifHoraire: [null, [Validators.min(0), Validators.max(1000)]],
      tarifFixe: [null, [Validators.min(0), Validators.max(10000)]],
      majorationUrgence: [DEFAULT_MAJORATIONS.urgence, [
        Validators.required,
        Validators.min(1),
        Validators.max(3)
      ]],
      majorationWeekend: [DEFAULT_MAJORATIONS.weekend, [
        Validators.required,
        Validators.min(1),
        Validators.max(3)
      ]],
      fraisDeplacement: [null, [Validators.min(0), Validators.max(500)]]
    }, { validators: this.tarifValidator });

    // Écouter les changements de type pour suggérer des tarifs
    this.serviceForm.get('type')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });
  }

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.params['id'];

    if (this.serviceId) {
      this.isEditMode = true;
      this.loadService();
    }
  }

  loadService(): void {
    if (!this.serviceId) return;

    this.serviceService.getService(this.serviceId).subscribe({
      next: (response) => {
        this.currentService = response.data;
        this.populateForm(response.data);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du service:', error);
        this.notificationService.error(
          'Erreur de chargement',
          'Impossible de charger le service'
        );
        this.router.navigate(['/services']);
      }
    });
  }

  populateForm(service: Service): void {
    // Déterminer le mode de tarification
    if (service.tarification.tarifHoraire) {
      this.tarifMode.set('hourly');
    } else if (service.tarification.tarifFixe) {
      this.tarifMode.set('fixed');
    }

    // Remplir le formulaire
    this.serviceForm.patchValue({
      nom: service.nom,
      description: service.description,
      type: service.type.value,
      tarifHoraire: service.tarification.tarifHoraire,
      tarifFixe: service.tarification.tarifFixe,
      majorationUrgence: service.tarification.majorationUrgence,
      majorationWeekend: service.tarification.majorationWeekend,
      fraisDeplacement: service.tarification.fraisDeplacement
    });
  }

  onTypeChange(type: string): void {
    if (!type || this.isEditMode) return;

    // Suggérer des tarifs par défaut selon le type
    const defaults = this.defaultTarifs[type as keyof typeof this.defaultTarifs];
    if (defaults) {
      if ('horaire' in defaults && this.tarifMode() === 'hourly') {
        this.serviceForm.patchValue({
          tarifHoraire: defaults.horaire,
          fraisDeplacement: defaults.deplacement
        });
      } else if ('fixe' in defaults && this.tarifMode() === 'fixed') {
        this.serviceForm.patchValue({
          tarifFixe: defaults.fixe,
          fraisDeplacement: defaults.deplacement
        });
      }
    }
  }

  toggleTarifMode(mode: 'hourly' | 'fixed'): void {
    this.tarifMode.set(mode);

    // Réinitialiser les champs de tarif
    if (mode === 'hourly') {
      this.serviceForm.patchValue({
        tarifFixe: null,
        tarifHoraire: this.serviceForm.get('tarifHoraire')?.value ||
          this.defaultTarifs[this.serviceForm.get('type')?.value as keyof typeof this.defaultTarifs]?.horaire ||
          45
      });
    } else {
      this.serviceForm.patchValue({
        tarifHoraire: null,
        tarifFixe: this.serviceForm.get('tarifFixe')?.value || 150
      });
    }

    // Revalider le formulaire
    this.serviceForm.updateValueAndValidity();
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update(show => !show);
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.markFormTouched();
      this.notificationService.warning(
        'Formulaire invalide',
        'Veuillez corriger les erreurs avant de continuer'
      );
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.prepareFormData();

    const request = this.isEditMode && this.serviceId
      ? this.serviceService.updateService(this.serviceId, formValue)
      : this.serviceService.createService(formValue);

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const message = this.isEditMode ? 'Service modifié' : 'Service créé';
        this.notificationService.success(message, 'Opération réussie');
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Erreur lors de la sauvegarde:', error);
      }
    });
  }

  prepareFormData(): any {
    const formValue = { ...this.serviceForm.value };

    // Nettoyer les tarifs selon le mode
    if (this.tarifMode() === 'hourly') {
      delete formValue.tarifFixe;
    } else {
      delete formValue.tarifHoraire;
    }

    // Supprimer les valeurs null
    Object.keys(formValue).forEach(key => {
      if (formValue[key] === null || formValue[key] === '') {
        delete formValue[key];
      }
    });

    return formValue;
  }

  cancel(): void {
    if (this.serviceForm.dirty) {
      if (confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) {
        this.router.navigate(['/services']);
      }
    } else {
      this.router.navigate(['/services']);
    }
  }

  resetForm(): void {
    if (this.isEditMode && this.currentService) {
      this.populateForm(this.currentService);
    } else {
      this.serviceForm.reset({
        majorationUrgence: DEFAULT_MAJORATIONS.urgence,
        majorationWeekend: DEFAULT_MAJORATIONS.weekend
      });
      this.tarifMode.set('hourly');
    }
  }

  private markFormTouched(): void {
    Object.keys(this.serviceForm.controls).forEach(key => {
      const control = this.serviceForm.get(key);
      control?.markAsTouched();
    });
  }

  private tarifValidator(control: AbstractControl): ValidationErrors | null {
    const tarifHoraire = control.get('tarifHoraire')?.value;
    const tarifFixe = control.get('tarifFixe')?.value;

    if (!tarifHoraire && !tarifFixe) {
      return { tarifRequired: true };
    }

    if (tarifHoraire && tarifFixe) {
      return { tarifConflict: true };
    }

    return null;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.serviceForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    const messages = this.validationMessages[fieldName as keyof typeof this.validationMessages];

    if (!messages) return '';

    if (errors['required']) return messages.required;
    if (errors['minlength']) return messages.minlength;
    if (errors['maxlength']) return messages.maxlength;
    if (errors['min']) return messages.min || 'Valeur trop petite';
    if (errors['max']) return messages.max || 'Valeur trop grande';

    return 'Erreur de validation';
  }

  hasError(fieldName: string): boolean {
    const control = this.serviceForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  formatMajorationDisplay(value: number): string {
    const percentage = Math.round((value - 1) * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  }

  getTypeIcon(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.icon || '📋';
  }

  getTypeDescription(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.description || '';
  }
}
