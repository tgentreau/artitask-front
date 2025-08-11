import {Component, inject, signal} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "./services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['artisan@test.com', [Validators.required, Validators.email]],
      password: ['password', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error.message);
        }
      });
    }
  }
}
