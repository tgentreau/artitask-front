import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '../../models/service.model';
import { ServiceService } from '../../services/service.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { SERVICE_TYPES, DEFAULT_TARIFS, SERVICE_VALIDATION_MESSAGES } from '../../models/service.constants';

interface TarifDefaults {
  horaire?: number;
  fixe?: number;
  deplacement?: number;
}

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-form.component.html'
})
export class ServiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private serviceService = inject(ServiceService);
  private notificationService = inject(NotificationService);

  serviceForm!: FormGroup;
  isEditMode = false;
  serviceId?: string;
  currentService?: Service;
  serviceTypes = SERVICE_TYPES;
  validationMessages = SERVICE_VALIDATION_MESSAGES;
  defaultTarifs: { [key: string]: TarifDefaults } = DEFAULT_TARIFS;

  tarifMode = signal<'hourly' | 'fixed'>('hourly');
  showAdvancedOptions = signal(false);
  loading = signal(false);

  currentTypeLabel = computed(() => {
    const typeValue = this.serviceForm?.get('type')?.value;
    const type = this.serviceTypes.find(t => t.value === typeValue);
    return type?.label || 'Type de service';
  });

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  initializeForm(): void {
    this.serviceForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: ['', Validators.required],
      tarifHoraire: [null],
      tarifFixe: [null],
      majorationUrgence: [0, [Validators.min(0), Validators.max(5)]],
      majorationWeekend: [0, [Validators.min(0), Validators.max(3)]],
      fraisDeplacement: [0, [Validators.min(0)]]
    });

    this.setInitialValidators();
  }

  setInitialValidators(): void {
    this.serviceForm.get('tarifHoraire')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(1000)
    ]);
    this.serviceForm.get('tarifFixe')?.disable();
  }

  checkEditMode(): void {
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
    const hasTarifHoraire = service.tarification.tarifHoraire !== null &&
      service.tarification.tarifHoraire !== undefined;
    const hasTarifFixe = service.tarification.tarifFixe !== null &&
      service.tarification.tarifFixe !== undefined;

    if (hasTarifHoraire) {
      this.tarifMode.set('hourly');
      this.serviceForm.get('tarifHoraire')?.enable();
      this.serviceForm.get('tarifFixe')?.disable();
    } else if (hasTarifFixe) {
      this.tarifMode.set('fixed');
      this.serviceForm.get('tarifFixe')?.enable();
      this.serviceForm.get('tarifHoraire')?.disable();
    }

    const majorationUrgence = service.tarification.majorationUrgence !== null &&
    service.tarification.majorationUrgence !== undefined
      ? service.tarification.majorationUrgence
      : 0;

    const majorationWeekend = service.tarification.majorationWeekend !== null &&
    service.tarification.majorationWeekend !== undefined
      ? service.tarification.majorationWeekend
      : 0;

    const fraisDeplacement = service.tarification.fraisDeplacement !== null &&
    service.tarification.fraisDeplacement !== undefined
      ? service.tarification.fraisDeplacement
      : 0;

    this.serviceForm.patchValue({
      nom: service.nom,
      description: service.description,
      type: service.type.value,
      tarifHoraire: hasTarifHoraire ? service.tarification.tarifHoraire : null,
      tarifFixe: hasTarifFixe ? service.tarification.tarifFixe : null,
      majorationUrgence: majorationUrgence,
      majorationWeekend: majorationWeekend,
      fraisDeplacement: fraisDeplacement
    });

    this.serviceForm.get('type')?.disable();
  }

  toggleTarifMode(mode: 'hourly' | 'fixed'): void {
    this.tarifMode.set(mode);

    if (mode === 'hourly') {
      this.serviceForm.get('tarifFixe')?.clearValidators();
      this.serviceForm.get('tarifFixe')?.setValue(null);
      this.serviceForm.get('tarifFixe')?.disable();
      this.serviceForm.get('tarifFixe')?.updateValueAndValidity();

      this.serviceForm.get('tarifHoraire')?.enable();
      const currentHoraire = this.serviceForm.get('tarifHoraire')?.value;
      if (!currentHoraire) {
        const typeValue = this.serviceForm.get('type')?.value;
        const defaults = typeValue ? this.defaultTarifs[typeValue] : null;
        const defaultValue = (defaults && 'horaire' in defaults) ? defaults.horaire : 50;
        this.serviceForm.get('tarifHoraire')?.setValue(defaultValue);
      }
      this.serviceForm.get('tarifHoraire')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(1000)
      ]);
      this.serviceForm.get('tarifHoraire')?.updateValueAndValidity();
    } else {
      this.serviceForm.get('tarifHoraire')?.clearValidators();
      this.serviceForm.get('tarifHoraire')?.setValue(null);
      this.serviceForm.get('tarifHoraire')?.disable();
      this.serviceForm.get('tarifHoraire')?.updateValueAndValidity();

      this.serviceForm.get('tarifFixe')?.enable();
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
  }

  prepareCreateData(): CreateServiceRequest {
    const formValue = this.serviceForm.getRawValue();

    const data: CreateServiceRequest = {
      nom: formValue.nom,
      description: formValue.description,
      type: formValue.type,
      majorationUrgence: formValue.majorationUrgence || 0,
      majorationWeekend: formValue.majorationWeekend || 0
    };

    if (this.tarifMode() === 'hourly') {
      data.tarifHoraire = formValue.tarifHoraire;
    } else {
      data.tarifFixe = formValue.tarifFixe;
    }

    if (formValue.fraisDeplacement !== null && formValue.fraisDeplacement !== undefined) {
      data.fraisDeplacement = formValue.fraisDeplacement;
    }

    Object.keys(data).forEach(key => {
      if (data[key as keyof CreateServiceRequest] === null ||
        data[key as keyof CreateServiceRequest] === undefined) {
        delete data[key as keyof CreateServiceRequest];
      }
    });

    return data;
  }

  prepareUpdateData(): UpdateServiceRequest {
    const formValue = this.serviceForm.getRawValue();

    const data: UpdateServiceRequest = {
      nom: formValue.nom,
      description: formValue.description,
      majorationUrgence: formValue.majorationUrgence || 0,
      majorationWeekend: formValue.majorationWeekend || 0
    };

    if (this.tarifMode() === 'hourly') {
      data.tarifHoraire = formValue.tarifHoraire;
    } else {
      data.tarifFixe = formValue.tarifFixe;
    }

    if (formValue.fraisDeplacement !== null && formValue.fraisDeplacement !== undefined) {
      data.fraisDeplacement = formValue.fraisDeplacement;
    }

    Object.keys(data).forEach(key => {
      if (data[key as keyof UpdateServiceRequest] === null ||
        data[key as keyof UpdateServiceRequest] === undefined) {
        delete data[key as keyof UpdateServiceRequest];
      }
    });

    return data;
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.markFormGroupTouched(this.serviceForm);
      return;
    }

    this.loading.set(true);

    if (this.isEditMode && this.serviceId) {
      this.updateService();
    } else {
      this.createService();
    }
  }

  createService(): void {
    const data = this.prepareCreateData();

    if (data.tarifHoraire && data.tarifFixe) {
      console.error('ERREUR: Les deux tarifs sont présents!', data);
      this.notificationService.error(
        'Erreur de tarification',
        'Impossible d\'avoir deux modes de tarification simultanés'
      );
      this.loading.set(false);
      return;
    }

    this.serviceService.createService(data).subscribe({
      next: () => {
        this.notificationService.success(
          'Service créé',
          'Le service a été créé avec succès'
        );
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Erreur lors de la création:', error);
      }
    });
  }

  updateService(): void {
    if (!this.serviceId) return;

    const data = this.prepareUpdateData();

    if (data.tarifHoraire && data.tarifFixe) {
      console.error('ERREUR: Les deux tarifs sont présents!', data);
      this.notificationService.error(
        'Erreur de tarification',
        'Impossible d\'avoir deux modes de tarification simultanés'
      );
      this.loading.set(false);
      return;
    }

    this.serviceService.updateService(this.serviceId, data).subscribe({
      next: () => {
        this.notificationService.success(
          'Service modifié',
          'Le service a été modifié avec succès'
        );
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.serviceForm.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (fieldName === 'nom') {
      if (errors['required']) return this.validationMessages.nom.required;
      if (errors['minlength']) return this.validationMessages.nom.minlength;
      if (errors['maxlength']) return this.validationMessages.nom.maxlength;
    }

    if (fieldName === 'description') {
      if (errors['required']) return this.validationMessages.description.required;
      if (errors['minlength']) return this.validationMessages.description.minlength;
      if (errors['maxlength']) return this.validationMessages.description.maxlength;
    }

    if (fieldName === 'type') {
      if (errors['required']) return this.validationMessages.type.required;
    }

    if (fieldName === 'tarifHoraire' || fieldName === 'tarifFixe') {
      if (errors['required']) return 'Ce tarif est requis';
      if (errors['min']) return this.validationMessages.tarif.min;
      if (errors['max']) return this.validationMessages.tarif.max;
    }

    if (fieldName === 'majorationUrgence' || fieldName === 'majorationWeekend') {
      if (errors['min']) return this.validationMessages.majoration.min;
      if (errors['max']) return this.validationMessages.majoration.max;
    }

    if (fieldName === 'fraisDeplacement') {
      if (errors['min']) return this.validationMessages.fraisDeplacement.min;
    }

    return '';
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.set(!this.showAdvancedOptions());
  }

  protected readonly Math = Math;
}
