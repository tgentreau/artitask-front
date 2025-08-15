import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { SERVICE_TYPES, DEFAULT_MAJORATIONS, DEFAULT_TARIFS, SERVICE_VALIDATION_MESSAGES } from '../../models/service.constants';
import { CreateServiceRequest, Service, UpdateServiceRequest } from '../../models/service.model';
import { NotificationService } from "../../../../shared/services/notification.service";

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

  serviceTypes = SERVICE_TYPES;
  validationMessages = SERVICE_VALIDATION_MESSAGES;
  defaultMajorations = DEFAULT_MAJORATIONS;
  defaultTarifs = DEFAULT_TARIFS;

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
    if (service.tarification.tarifHoraire) {
      this.tarifMode.set('hourly');
    } else if (service.tarification.tarifFixe) {
      this.tarifMode.set('fixed');
    }

    const tarifHoraire = typeof service.tarification.tarifHoraire === 'object'
      ? (service.tarification.tarifHoraire as any).amount
      : service.tarification.tarifHoraire;

    const tarifFixe = typeof service.tarification.tarifFixe === 'object'
      ? (service.tarification.tarifFixe as any).amount
      : service.tarification.tarifFixe;

    const fraisDeplacement = typeof service.tarification.fraisDeplacement === 'object'
      ? (service.tarification.fraisDeplacement as any).amount
      : service.tarification.fraisDeplacement;

    this.serviceForm.patchValue({
      nom: service.nom,
      description: service.description,
      type: service.type.value || service.type,
      tarifHoraire: tarifHoraire,
      tarifFixe: tarifFixe,
      majorationUrgence: service.tarification.majorationUrgence || DEFAULT_MAJORATIONS.urgence,
      majorationWeekend: service.tarification.majorationWeekend || DEFAULT_MAJORATIONS.weekend,
      fraisDeplacement: fraisDeplacement
    });
  }

  onTypeChange(type: string): void {
    if (!type || this.isEditMode) return;

    const defaults = this.defaultTarifs[type];
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

    if (mode === 'hourly') {
      const currentHoraire = this.serviceForm.get('tarifHoraire')?.value;
      const defaults = this.defaultTarifs[this.serviceForm.get('type')?.value];

      this.serviceForm.patchValue({
        tarifFixe: null,
        tarifHoraire: currentHoraire || (defaults && 'horaire' in defaults ? defaults.horaire : 45)
      });
    } else {
      this.serviceForm.patchValue({
        tarifHoraire: null,
        tarifFixe: this.serviceForm.get('tarifFixe')?.value || 150
      });
    }

    this.serviceForm.updateValueAndValidity();
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update(show => !show);
  }

  prepareCreateData(): CreateServiceRequest {
    const formValue = this.serviceForm.value;

    const data: CreateServiceRequest = {
      nom: formValue.nom,
      description: formValue.description,
      type: formValue.type,
      majorationUrgence: formValue.majorationUrgence,
      majorationWeekend: formValue.majorationWeekend
    };

    if (this.tarifMode() === 'hourly' && formValue.tarifHoraire) {
      data.tarifHoraire = Number(formValue.tarifHoraire);
    } else if (formValue.tarifFixe) {
      data.tarifFixe = Number(formValue.tarifFixe);
    }

    if (formValue.fraisDeplacement) {
      data.fraisDeplacement = Number(formValue.fraisDeplacement);
    }

    return data;
  }

  prepareUpdateData(): UpdateServiceRequest {
    const formValue = this.serviceForm.value;

    const data: UpdateServiceRequest = {
      nom: formValue.nom,
      description: formValue.description,
      type: formValue.type,
      majorationUrgence: formValue.majorationUrgence,
      majorationWeekend: formValue.majorationWeekend
    };

    if (this.tarifMode() === 'hourly') {
      data.tarifHoraire = formValue.tarifHoraire ? Number(formValue.tarifHoraire) : undefined;
      data.tarifFixe = undefined;
    } else {
      data.tarifFixe = formValue.tarifFixe ? Number(formValue.tarifFixe) : undefined;
      data.tarifHoraire = undefined;
    }

    data.fraisDeplacement = formValue.fraisDeplacement ? Number(formValue.fraisDeplacement) : undefined;

    return data;
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

    if (this.isEditMode && this.serviceId) {
      const updateData = this.prepareUpdateData();
      this.serviceService.updateService(this.serviceId, updateData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.success('Service modifié', 'Les modifications ont été enregistrées');
          this.router.navigate(['/services']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Erreur lors de la modification:', error);
          this.notificationService.error(
            'Erreur de sauvegarde',
            error.error?.message || 'Une erreur est survenue lors de la modification'
          );
        }
      });
    } else {
      const createData = this.prepareCreateData();
      this.serviceService.createService(createData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.success('Service créé', 'Le service a été créé avec succès');
          this.router.navigate(['/services']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Erreur lors de la création:', error);
          this.notificationService.error(
            'Erreur de sauvegarde',
            error.error?.message || 'Une erreur est survenue lors de la création'
          );
        }
      });
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

  cancel(): void {
    this.router.navigate(['/services']);
  }

  hasError(field: string): boolean {
    const control = this.serviceForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.serviceForm.get(field);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (field === 'nom') {
      if (errors['required']) return this.validationMessages.nom.required;
      if (errors['minlength']) return this.validationMessages.nom.minlength;
      if (errors['maxlength']) return this.validationMessages.nom.maxlength;
    }

    if (field === 'description') {
      if (errors['required']) return this.validationMessages.description.required;
      if (errors['minlength']) return this.validationMessages.description.minlength;
      if (errors['maxlength']) return this.validationMessages.description.maxlength;
    }

    if (field === 'type') {
      if (errors['required']) return this.validationMessages.type.required;
    }

    if (field === 'tarif') {
      if (errors['required']) return this.validationMessages.tarif.required;
      if (errors['conflict']) return this.validationMessages.tarif.conflict;
      if (errors['min']) return this.validationMessages.tarif.min;
      if (errors['max']) return this.validationMessages.tarif.max;
    }

    if (field === 'majoration') {
      if (errors['min']) return this.validationMessages.majoration.min;
      if (errors['max']) return this.validationMessages.majoration.max;
    }

    if (field === 'fraisDeplacement') {
      if (errors['min']) return this.validationMessages.fraisDeplacement.min;
    }

    return 'Erreur de validation';
  }

  getTypeDescription(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.description || '';
  }

  formatMajoration(value: number): string {
    const percentage = Math.round((value - 1) * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
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

    return null;
  }
}
