import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.getAccessToken();

    if (token && !this.isPublicEndpoint(request.url)) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401 && !this.isAuthEndpoint(request.url)) {
            return this.handle401Error(request, next);
          }

          if (error.status === 403) {
            this.logout();
            return throwError(() => ({
              message: 'Accès refusé. Veuillez vous reconnecter.',
              status: error.status
            }));
          }

          if (error.status === 0) {
            return throwError(() => ({
              message: 'Erreur de connexion au serveur. Vérifiez votre connexion internet.',
              status: error.status
            }));
          }

          if (error.status >= 500) {
            return throwError(() => ({
              message: 'Erreur serveur. Veuillez réessayer plus tard.',
              status: error.status,
              details: error.error?.message
            }));
          }

          return throwError(() => ({
            message: error.error?.message || 'Une erreur est survenue',
            status: error.status,
            details: error.error
          }));
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        this.logout();
        return throwError(() => new Error('No refresh token available'));
      }

      return this.refreshTokenRequest(refreshToken, next).pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          const newToken = response.data.accessToken;
          this.storeTokens(response.data.accessToken, response.data.refreshToken);
          this.refreshTokenSubject.next(newToken);

          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }

  private refreshTokenRequest(refreshToken: string, next: HttpHandler): Observable<any> {
    const request = new HttpRequest('POST', '/api/auth/refresh', { refreshToken });
    return next.handle(request);
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']);
  }

  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh'
    ];

    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/');
  }
}
