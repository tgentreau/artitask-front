import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

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
            this.authService.logout();
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

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          const newToken = response.data.accessToken;
          this.refreshTokenSubject.next(newToken);

          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout();
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

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
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
