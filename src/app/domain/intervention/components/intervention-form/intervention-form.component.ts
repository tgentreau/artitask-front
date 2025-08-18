import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InterventionService } from '../../services/intervention.service';
import { CreateInterventionRequest, InterventionResponse } from '../../models/intervention.model';
import { ServiceService } from '../../../service/services/service.service';
import { ClientService } from '../../../client/services/client.service';

@Component({
  selector: 'app-intervention-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './intervention-form.component.html'
})
export class InterventionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private interventionService = inject(InterventionService);
  private serviceService = inject(ServiceService);
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  interventionForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  interventionId = signal<string | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  clients = signal<any[]>([]);
  services = signal<any[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadClients();
    this.loadServices();
  }

  initializeForm(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.interventionForm = this.fb.group({
      clientId: ['', [Validators.required]],
      serviceId: ['', [Validators.required]],
      dateIntervention: [tomorrow.toISOString().split('T')[0], [Validators.required]],
      heureIntervention: ['09:00', [Validators.required]],
      descriptionDemande: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]],
      urgence: [false],
      adresseIntervention: ['', [
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      useGPS: [false],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
      coutEstime: [null, [
        Validators.min(0),
        Validators.max(100000)
      ]]
    });

    this.interventionForm.get('useGPS')?.valueChanges.subscribe(useGPS => {
      const latControl = this.interventionForm.get('latitude');
      const lngControl = this.interventionForm.get('longitude');

      if (useGPS) {
        latControl?.setValidators([
          Validators.required,
          Validators.min(-90),
          Validators.max(90)
        ]);
        lngControl?.setValidators([
          Validators.required,
          Validators.min(-180),
          Validators.max(180)
        ]);
      } else {
        latControl?.clearValidators();
        lngControl?.clearValidators();
        latControl?.setValue(null);
        lngControl?.setValue(null);
      }

      latControl?.updateValueAndValidity();
      lngControl?.updateValueAndValidity();
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.interventionId.set(id);
      this.loadIntervention(id);
    }
  }

  loadIntervention(id: string): void {
    this.loading.set(true);
    this.interventionService.getById(id).subscribe({
      next: (intervention: InterventionResponse) => {
        const dateTime = new Date(intervention.dateIntervention);

        this.interventionForm.patchValue({
          clientId: intervention.clientId,
          serviceId: intervention.serviceId,
          dateIntervention: dateTime.toISOString().split('T')[0],
          heureIntervention: dateTime.toTimeString().slice(0, 5),
          descriptionDemande: intervention.descriptionDemande,
          urgence: intervention.priority.level >= 3,
          adresseIntervention: intervention.location?.adresse,
          useGPS: !!intervention.location?.coordonnees,
          latitude: intervention.location?.coordonnees?.latitude,
          longitude: intervention.location?.coordonnees?.longitude,
          coutEstime: intervention.coutEstime?.amount
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement de l\'intervention');
        this.loading.set(false);
        console.error('Error loading intervention:', err);
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients(1, 100).subscribe({
      next: (result) => {
        this.clients.set(result.items || []);
      },
      error: (err) => {
        console.error('Error loading clients:', err);
      }
    });
  }

  loadServices(): void {
    this.serviceService.getServices(1, 100).subscribe({
      next: (response: any) => {
        this.services.set(response.data?.items || []);
      },
      error: (err) => {
        console.error('Error loading services:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.interventionForm.invalid) {
      Object.keys(this.interventionForm.controls).forEach(key => {
        const control = this.interventionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.interventionForm.value;
    const dateTime = new Date(formValue.dateIntervention + 'T' + formValue.heureIntervention);

    const request: CreateInterventionRequest = {
      clientId: formValue.clientId,
      serviceId: formValue.serviceId,
      dateIntervention: dateTime.toISOString(),
      descriptionDemande: formValue.descriptionDemande,
      urgence: formValue.urgence,
      adresseIntervention: formValue.adresseIntervention,
      coordonneesGPS: formValue.useGPS ? {
        latitude: formValue.latitude,
        longitude: formValue.longitude
      } : undefined,
      coutEstime: formValue.coutEstime
    };

    if (this.isEditMode()) {
      this.error.set('La modification n\'est pas encore implémentée');
      this.loading.set(false);
    } else {
      this.interventionService.create(request).subscribe({
        next: (result) => {
          this.router.navigate(['/interventions', result.interventionId]);
        },
        error: (err) => {
          this.error.set('Erreur lors de la création de l\'intervention');
          this.loading.set(false);
          console.error('Error creating intervention:', err);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/interventions']);
  }

  getFieldError(fieldName: string): string {
    const control = this.interventionForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (control.errors['minlength']) {
        return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      }
      if (control.errors['min']) {
        return `La valeur minimale est ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `La valeur maximale est ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  getFieldLength(fieldName: string): number {
    const control = this.interventionForm.get(fieldName);
    const value = control?.value;

    if (typeof value === 'string') {
      return value.length;
    }

    return 0;
  }
}
