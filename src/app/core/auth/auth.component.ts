import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = signal(true);
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage = signal('');
  successMessage = signal('');
  rememberMe = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

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

  toggleMode(): void {
    this.isLoginMode.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      this.successMessage.set('');

      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: () => {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          if (error.status === 401) {
            this.errorMessage.set('Email ou mot de passe incorrect');
          } else if (error.status === 0) {
            this.errorMessage.set('Impossible de se connecter au serveur');
          } else {
            this.errorMessage.set(error.message || 'Une erreur est survenue');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set('');
      this.successMessage.set('');

      const { confirmPassword, acceptTerms, ...registerData } = this.registerForm.value;

      this.authService.registerAndLogin(registerData).subscribe({
        next: () => {
          this.successMessage.set('Inscription réussie ! Connexion en cours...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          if (error.status === 409) {
            this.errorMessage.set('Cet email est déjà utilisé');
          } else if (error.status === 400) {
            this.errorMessage.set(error.error?.message || 'Données invalides');
          } else {
            this.errorMessage.set(error.message || 'Erreur lors de l\'inscription');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
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

  getPasswordStrength(): { level: number; text: string; color: string } {
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) {
      return { level: 0, text: '', color: '' };
    }

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const levels = [
      { level: 1, text: 'Très faible', color: 'bg-red-500' },
      { level: 2, text: 'Faible', color: 'bg-orange-500' },
      { level: 3, text: 'Moyen', color: 'bg-yellow-500' },
      { level: 4, text: 'Fort', color: 'bg-green-500' },
      { level: 5, text: 'Très fort', color: 'bg-green-600' }
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
}
