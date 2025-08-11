import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ApiResponse,
  AuthResponse,
  ArtisanResponse,
  RegisterResponse,
  User,
  DecodedToken
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal(false);
  private loadingSignal = signal(false);

  currentUser$ = computed(() => this.currentUserSignal());
  isAuthenticated$ = computed(() => this.isAuthenticatedSignal());
  loading$ = computed(() => this.loadingSignal());

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * POST /auth/register
   * @Body RegisterArtisanDto
   * @Returns { statusCode, message, data: { artisanId } }
   */
  register(data: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    this.loadingSignal.set(true);

    return this.http.post<ApiResponse<RegisterResponse>>(
      `${this.apiUrl}/register`,
      data
    ).pipe(
      tap(response => {
        this.loadingSignal.set(false);
        console.log('Inscription réussie:', response.data.artisanId);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /auth/login
   * @Body AuthenticateDto
   * @Returns { statusCode, message, data: AuthResponseDto }
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.loadingSignal.set(true);

    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap(response => {
        // Stocker les tokens
        this.storeTokens(response.data.accessToken, response.data.refreshToken);

        // Transformer et stocker l'utilisateur
        const user: User = {
          id: response.data.artisan.id,
          email: response.data.artisan.email,
          nomEntreprise: response.data.artisan.nomEntreprise,
          telephone: '', // Sera complété par getProfile
          adresse: '',
          compteActif: true
        };

        this.setCurrentUser(user);
        this.loadingSignal.set(false);

        // Charger le profil complet après login
        this.getProfile().subscribe();
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /auth/profile
   * @Headers Authorization: Bearer token
   * @Returns { statusCode, message, data: ArtisanResponseDto }
   */
  getProfile(): Observable<ApiResponse<ArtisanResponse>> {
    return this.http.get<ApiResponse<ArtisanResponse>>(
      `${this.apiUrl}/profile`
    ).pipe(
      tap(response => {
        const user: User = {
          id: response.data.id,
          email: response.data.email,
          nomEntreprise: response.data.nomEntreprise,
          telephone: response.data.telephone,
          adresse: response.data.adresse,
          siret: response.data.siret,
          compteActif: response.data.compteActif
        };

        this.setCurrentUser(user);
      }),
      catchError(error => {
        // Si erreur 401, le token est invalide
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /auth/refresh
   * @Body RefreshTokenDto
   * @Returns { statusCode, message, data: AuthResponseDto }
   */
  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/refresh`,
      request
    ).pipe(
      tap(response => {
        this.storeTokens(response.data.accessToken, response.data.refreshToken);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion (local uniquement, pas d'endpoint backend)
   */
  logout(): void {
    this.clearTokens();
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/auth']);
  }

  /**
   * Inscription + Login automatique
   */
  registerAndLogin(data: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.register(data).pipe(
      tap(response => {
        console.log('Inscription réussie, connexion automatique...', response.data.artisanId);

        // Après inscription, login automatique
        setTimeout(() => {
          this.login({
            email: data.email,
            password: data.password
          }).subscribe({
            next: () => {
              console.log('Connexion automatique réussie');
              this.router.navigate(['/dashboard']);
            },
            error: (error) => {
              console.error('Erreur lors de la connexion automatique:', error);
            }
          });
        }, 500);
      }),
      catchError(error => {
        console.error('Erreur lors de l\'inscription:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier l'état d'authentification au démarrage
   */
  private checkAuthStatus(): void {
    const token = this.getAccessToken();

    if (token) {
      if (!this.isTokenExpired(token)) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser) as User;
            this.setCurrentUser(user);
            this.getProfile().subscribe({
              error: () => {
                this.refreshToken().subscribe({
                  error: () => this.logout()
                });
              }
            });
          } catch {
            this.logout();
          }
        }
      } else {
        this.refreshToken().subscribe({
          error: () => this.logout()
        });
      }
    }
  }

  /**
   * Stocker l'utilisateur actuel
   */
  private setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Stocker les tokens
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Nettoyer les tokens et l'utilisateur
   */
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Récupérer l'access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Récupérer le refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Vérifier si un token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      const payload = JSON.parse(atob(parts[1])) as DecodedToken;
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}
