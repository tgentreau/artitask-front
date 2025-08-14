import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import {AuthService} from "../../services/auth.service";

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
    if (this.registerForm.valid) {
      this.errorMessage.set('');
      this.successMessage.set('');

      const { confirmPassword, acceptTerms, ...registerData } = this.registerForm.value;

      this.authService.registerAndLogin(registerData).subscribe({
        next: () => {
          this.successMessage.set('Inscription réussie ! Connexion en cours...');
          this.notificationService.success(
            'Compte créé avec succès',
            'Vous allez être redirigé vers votre tableau de bord'
          );
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          if (error.status === 409) {
            this.errorMessage.set('Cet email est déjà utilisé');
            this.notificationService.error('Email déjà utilisé', 'Utilisez un autre email ou connectez-vous');
          } else if (error.status === 400) {
            this.errorMessage.set(error.error?.message || 'Données invalides');
            this.notificationService.error('Données invalides', 'Vérifiez les informations saisies');
          } else {
            this.errorMessage.set(error.message || 'Erreur lors de l\'inscription');
            this.notificationService.showHttpError(error);
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
      this.notificationService.warning('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
    }
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getPasswordStrength(): { level: number; text: string } {
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) {
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

  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

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

    event.target.value = value;
    this.registerForm.get('telephone')?.setValue(value.replace(/\s/g, ''));
  }

  formatSiret(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

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

    event.target.value = value;
    this.registerForm.get('siret')?.setValue(value.replace(/\s/g, ''));
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  private passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;

    return valid ? null : { weakPassword: true };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
