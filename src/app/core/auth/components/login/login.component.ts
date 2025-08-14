import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import {AuthService} from "../../services/auth.service";

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
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: () => {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          this.notificationService.success('Connexion réussie', 'Bienvenue dans votre espace artisan');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          if (error.status === 401) {
            this.errorMessage.set('Email ou mot de passe incorrect');
            this.notificationService.error('Échec de connexion', 'Vérifiez vos identifiants');
          } else if (error.status === 0) {
            this.errorMessage.set('Impossible de se connecter au serveur');
            this.notificationService.showHttpError(error);
          } else {
            this.errorMessage.set(error.message || 'Une erreur est survenue');
            this.notificationService.showHttpError(error);
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
      this.notificationService.warning('Formulaire invalide', 'Veuillez remplir tous les champs requis');
    }
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
