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
    }, { validators: this.tarifExclusiveValidator });

    this.serviceForm.get('type')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });

    // S'assurer qu'au démarrage, seul le mode horaire a une valeur
    this.toggleTarifMode('hourly');
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

    this.serviceForm.get('type')?.disable();
  }

  onTypeChange(type: string): void {
    if (!type || this.isEditMode) return;

    const defaults = this.defaultTarifs[type];
    if (!defaults) return;

    // Ne mettre à jour que le tarif correspondant au mode actuel
    if (this.tarifMode() === 'hourly' && 'horaire' in defaults) {
      this.serviceForm.patchValue({
        tarifHoraire: defaults.horaire,
        fraisDeplacement: defaults.deplacement
      });
    } else if (this.tarifMode() === 'fixed' && 'fixe' in defaults) {
      this.serviceForm.patchValue({
        tarifFixe: defaults.fixe,
        fraisDeplacement: defaults.deplacement
      });
    }
  }

  toggleTarifMode(mode: 'hourly' | 'fixed'): void {
    this.tarifMode.set(mode);

    if (mode === 'hourly') {
      // Forcer le tarif fixe à null SANS valeur par défaut
      this.serviceForm.get('tarifFixe')?.setValue(null);
      this.serviceForm.get('tarifFixe')?.clearValidators();
      this.serviceForm.get('tarifFixe')?.updateValueAndValidity();

      // Définir le tarif horaire avec valeur par défaut si vide
      const currentHoraire = this.serviceForm.get('tarifHoraire')?.value;
      if (!currentHoraire) {
        const typeValue = this.serviceForm.get('type')?.value;
        const defaults = typeValue ? this.defaultTarifs[typeValue] : null;
        const defaultValue = (defaults && 'horaire' in defaults) ? defaults.horaire : 45;
        this.serviceForm.get('tarifHoraire')?.setValue(defaultValue);
      }

      this.serviceForm.get('tarifHoraire')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(1000)
      ]);
      this.serviceForm.get('tarifHoraire')?.updateValueAndValidity();
    } else {
      // Forcer le tarif horaire à null SANS valeur par défaut
      this.serviceForm.get('tarifHoraire')?.setValue(null);
      this.serviceForm.get('tarifHoraire')?.clearValidators();
      this.serviceForm.get('tarifHoraire')?.updateValueAndValidity();

      // Définir le tarif fixe avec valeur par défaut si vide
      const currentFixe = this.serviceForm.get('tarifFixe')?.value;
      if (!currentFixe) {
        const typeValue = this.serviceForm.get('type')?.value;
        const defaults = typeValue ? this.defaultTarifs[typeValue] : null;
        const defaultValue = (defaults && 'fixe' in defaults) ? defaults.fixe : 150;
        this.serviceForm.get('tarifFixe')?.setValue(defaultValue);
      }

      this.serviceForm.get('tarifFixe')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(10000)
      ]);
      this.serviceForm.get('tarifFixe')?.updateValueAndValidity();
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

    // S'assurer qu'on n'envoie QU'UN SEUL type de tarif
    if (this.tarifMode() === 'hourly') {
      data.tarifHoraire = formValue.tarifHoraire;
      // PAS de tarifFixe même si il y a une valeur dans le form
    } else {
      data.tarifFixe = formValue.tarifFixe;
      // PAS de tarifHoraire même si il y a une valeur dans le form
    }

    if (formValue.fraisDeplacement) {
      data.fraisDeplacement = formValue.fraisDeplacement;
    }

    return data;
  }

  prepareUpdateData(): UpdateServiceRequest {
    const formValue = this.serviceForm.getRawValue();

    const data: UpdateServiceRequest = {
      nom: formValue.nom,
      description: formValue.description,
      type: formValue.type,
      majorationUrgence: formValue.majorationUrgence,
      majorationWeekend: formValue.majorationWeekend
    };

    // S'assurer qu'on n'envoie QU'UN SEUL type de tarif
    if (this.tarifMode() === 'hourly') {
      data.tarifHoraire = formValue.tarifHoraire;
      data.tarifFixe = undefined;
    } else {
      data.tarifFixe = formValue.tarifFixe;
      data.tarifHoraire = undefined;
    }

    if (formValue.fraisDeplacement !== null) {
      data.fraisDeplacement = formValue.fraisDeplacement;
    }

    return data;
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.markFormTouched();

      const tarifError = this.getFormError();
      if (tarifError) {
        this.notificationService.error('Erreur de tarification', tarifError);
      } else {
        this.notificationService.warning(
          'Formulaire invalide',
          'Veuillez corriger les erreurs avant de continuer'
        );
      }
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode && this.serviceId) {
      const updateData = this.prepareUpdateData();
      this.serviceService.updateService(this.serviceId, updateData).subscribe({
        next: () => {
          this.notificationService.success(
            'Service modifié',
            'Le service a été mis à jour avec succès'
          );
          this.router.navigate(['/services']);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.notificationService.error(
            'Erreur',
            'Impossible de mettre à jour le service'
          );
          this.isSubmitting.set(false);
        }
      });
    } else {
      const createData = this.prepareCreateData();
      this.serviceService.createService(createData).subscribe({
        next: () => {
          this.notificationService.success(
            'Service créé',
            'Le nouveau service a été ajouté avec succès'
          );
          this.router.navigate(['/services']);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.notificationService.error(
            'Erreur',
            'Impossible de créer le service'
          );
          this.isSubmitting.set(false);
        }
      });
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

    if (field === 'tarifHoraire' || field === 'tarifFixe') {
      if (errors['required']) return 'Ce tarif est requis pour le mode sélectionné';
      if (errors['min']) return this.validationMessages.tarif.min;
      if (errors['max']) return this.validationMessages.tarif.max;
    }

    if (field === 'majorationUrgence' || field === 'majorationWeekend') {
      if (errors['min']) return this.validationMessages.majoration.min;
      if (errors['max']) return this.validationMessages.majoration.max;
    }

    if (field === 'fraisDeplacement') {
      if (errors['min']) return this.validationMessages.fraisDeplacement.min;
    }

    return 'Erreur de validation';
  }

  getFormError(): string | null {
    if (this.serviceForm.errors?.['tarifRequired']) {
      return this.validationMessages.tarif.required;
    }
    if (this.serviceForm.errors?.['tarifConflict']) {
      return this.validationMessages.tarif.conflict;
    }
    return null;
  }

  getTypeDescription(type: string): string {
    const serviceType = this.serviceTypes.find(t => t.value === type);
    return serviceType?.description || '';
  }

  formatMajorationDisplay(value: number): string {
    const percentage = Math.round((value - 1) * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  }

  private tarifExclusiveValidator(control: AbstractControl): ValidationErrors | null {
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

  private markFormTouched(): void {
    Object.keys(this.serviceForm.controls).forEach(key => {
      const control = this.serviceForm.get(key);
      control?.markAsTouched();
    });
  }
}
