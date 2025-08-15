import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../services/auth.service';
import { FormErrorHandler } from '../../../../shared/utils/form-error-handler';
import {ApiErrorResponse, getErrorMessage} from "../../../../shared/models/api-error-response.interface";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  loginForm: FormGroup;
  showPassword = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      FormErrorHandler.markAllAsTouched(this.loginForm);
      this.notificationService.warning('Formulaire invalide', 'Veuillez remplir tous les champs requis');
      return;
    }

    this.errorMessage.set('');
    FormErrorHandler.clearBackendErrors(this.loginForm);

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        this.notificationService.success('Connexion réussie', 'Bienvenue dans votre espace artisan');
        this.router.navigate(['/dashboard']);
      },
      error: (error: ApiErrorResponse) => {
        this.handleLoginError(error);
      }
    });
  }

  private handleLoginError(error: ApiErrorResponse): void {
    const message = getErrorMessage(error);
    this.errorMessage.set(message);

    FormErrorHandler.applyBackendErrors(this.loginForm, error);

    switch (error.statusCode) {
      case 401:
        this.notificationService.error('Échec de connexion', 'Email ou mot de passe incorrect');
        break;
      case 400:
        if (error.errors?.length) {
          this.notificationService.error('Données invalides', 'Veuillez vérifier les champs du formulaire');
        } else {
          this.notificationService.error('Erreur', message);
        }
        break;
      case 0:
        this.notificationService.error('Connexion impossible', 'Le serveur est inaccessible');
        break;
      default:
        this.notificationService.error('Erreur', message);
    }
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  getFieldError(fieldName: string): string | null {
    return FormErrorHandler.getFieldError(this.loginForm, fieldName);
  }

  hasFieldError(fieldName: string): boolean {
    return FormErrorHandler.hasFieldError(this.loginForm, fieldName);
  }
}
