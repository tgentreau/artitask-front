import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html'
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  clientForm: FormGroup;
  isEditMode = false;
  clientId: string | null = null;
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.clientForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      adresse: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.isEditMode = true;
      this.loadClient(this.clientId);
    }
  }

  loadClient(id: string) {
    this.loading.set(true);
    this.clientService.getClient(id).subscribe({
      next: (client) => {
        this.clientForm.patchValue({
          nom: client.nom,
          email: client.email,
          telephone: client.telephone,
          adresse: client.adresse,
          notes: client.notes || ''
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du client:', error);
        this.errorMessage.set('Impossible de charger le client');
        this.loading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.clientForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const clientData = this.clientForm.value;

      if (this.isEditMode && this.clientId) {
        this.clientService.updateClient(this.clientId, clientData).subscribe({
          next: () => {
            this.router.navigate(['/clients']);
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.errorMessage.set(
              error.error?.message || 'Une erreur est survenue lors de la mise à jour'
            );
            this.loading.set(false);
          }
        });
      } else {
        this.clientService.createClient(clientData).subscribe({
          next: () => {
            this.router.navigate(['/clients']);
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.errorMessage.set(
              error.error?.message || 'Une erreur est survenue lors de la création'
            );
            this.loading.set(false);
          }
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/clients']);
  }
}
