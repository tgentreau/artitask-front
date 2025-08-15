import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../services/auth.service';
import { FormErrorHandler } from '../../../../shared/utils/form-error-handler';
import {ApiErrorResponse, getErrorMessage} from "../../../../shared/models/api-error-response.interface";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  registerForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
      nomEntreprise: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      adresse: ['', [Validators.required, Validators.minLength(10)]],
      siret: ['', [Validators.pattern('^[0-9]{14}$')]],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  onSubmit(): void {
    if (!this.registerForm.valid) {
      FormErrorHandler.markAllAsTouched(this.registerForm);
      this.notificationService.warning('Formulaire invalide', 'Veuillez remplir tous les champs requis');
      return;
    }

    this.clearMessages();
    const { confirmPassword, acceptTerms, ...registerData } = this.registerForm.value;

    this.authService.registerAndLogin(registerData).subscribe({
      next: (response) => {
        this.successMessage.set('Inscription réussie ! Redirection en cours...');
        this.notificationService.success('Bienvenue !', 'Votre compte a été créé avec succès');
      },
      error: (error: ApiErrorResponse) => {
        this.handleRegistrationError(error);
      }
    });
  }

  private handleRegistrationError(error: ApiErrorResponse): void {
    const message = getErrorMessage(error);
    this.errorMessage.set(message);

    FormErrorHandler.applyBackendErrors(this.registerForm, error);

    switch (error.statusCode) {
      case 400:
        if (error.errors?.length) {
          this.notificationService.error('Données invalides', 'Veuillez corriger les erreurs dans le formulaire');
        } else {
          this.notificationService.error('Erreur de validation', message);
        }
        break;

      case 409:
        this.notificationService.error('Compte existant', 'Un compte existe déjà avec cet email');
        this.registerForm.get('email')?.setErrors({
          backend: ['Cet email est déjà utilisé']
        });
        break;

      case 422:
        this.notificationService.warning('Règle métier', message);
        break;

      case 0:
        this.notificationService.error('Connexion impossible', 'Le serveur est inaccessible');
        break;

      default:
        this.notificationService.error('Erreur', message);
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    FormErrorHandler.clearBackendErrors(this.registerForm);
  }

  getPasswordStrength(): { level: number; text: string } {
    const password = this.registerForm.get('password')?.value || '';

    if (!password) {
      return { level: 0, text: '' };
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const levels = [
      { level: 1, text: 'Très faible' },
      { level: 2, text: 'Faible' },
      { level: 3, text: 'Moyen' },
      { level: 4, text: 'Fort' },
      { level: 5, text: 'Très fort' }
    ];

    return levels[Math.min(strength - 1, 4)] || levels[0];
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    if (value.length >= 2) {
      value = value.substring(0, 2) + ' ' + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + ' ' + value.substring(5);
    }
    if (value.length >= 8) {
      value = value.substring(0, 8) + ' ' + value.substring(8);
    }
    if (value.length >= 11) {
      value = value.substring(0, 11) + ' ' + value.substring(11);
    }

    input.value = value;
    this.registerForm.get('telephone')?.setValue(value.replace(/\s/g, ''), { emitEvent: false });
  }

  formatSiret(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 14) {
      value = value.substring(0, 14);
    }

    if (value.length > 3) {
      value = value.substring(0, 3) + ' ' + value.substring(3);
    }
    if (value.length > 7) {
      value = value.substring(0, 7) + ' ' + value.substring(7);
    }
    if (value.length > 11) {
      value = value.substring(0, 11) + ' ' + value.substring(11);
    }

    input.value = value;
    this.registerForm.get('siret')?.setValue(value.replace(/\s/g, ''), { emitEvent: false });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getFieldError(fieldName: string): string | null {
    return FormErrorHandler.getFieldError(this.registerForm, fieldName);
  }

  hasFieldError(fieldName: string): boolean {
    return FormErrorHandler.hasFieldError(this.registerForm, fieldName);
  }

  private passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    return valid ? null : { weakPassword: true };
  }

  private passwordMatchValidator(formGroup: AbstractControl): { [key: string]: boolean } | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    if (confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }
}
