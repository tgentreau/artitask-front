import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  companyName: string;
  role: 'artisan' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);
  private loading = signal<boolean>(false);

  // API publique
  readonly currentUser$ = this.currentUser.asReadonly();
  readonly isAuthenticated$ = this.isAuthenticated.asReadonly();
  readonly loading$ = this.loading.asReadonly();

  constructor(private router: Router) {
    // Vérifier si l'utilisateur est déjà connecté
    this.checkStoredAuth();
  }

  login(request: LoginRequest): Observable<User> {
    this.loading.set(true);

    // Validation simple (remplacer par vraie API)
    if (request.email === 'artisan@test.com' && request.password === 'password') {
      const user: User = {
        id: 'user_001',
        email: request.email,
        companyName: 'Dupont Plomberie',
        role: 'artisan'
      };

      // Stocker en localStorage (en attendant JWT)
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');

      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.loading.set(false);

      return of(user).pipe(delay(500));
    } else {
      this.loading.set(false);
      return throwError(() => new Error('Email ou mot de passe incorrect')).pipe(delay(500));
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth']);
  }

  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem('currentUser');
    const isAuth = localStorage.getItem('isAuthenticated');

    if (storedUser && isAuth === 'true') {
      this.currentUser.set(JSON.parse(storedUser));
      this.isAuthenticated.set(true);
    }
  }
}
