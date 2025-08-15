import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import {NotificationService} from "../services/notification.service";
import {ApiErrorResponse, ERROR_CODES, isApiErrorResponse} from "../models/api-error-response.interface";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.transformToApiError(error);

        this.handleErrorByCode(apiError);

        return throwError(() => apiError);
      })
    );
  }

  private transformToApiError(error: HttpErrorResponse): ApiErrorResponse {
    if (error.error && isApiErrorResponse(error.error)) {
      return error.error;
    }

    const apiError: ApiErrorResponse = {
      statusCode: error.status,
      error: this.determineErrorCode(error),
      message: this.determineErrorMessage(error),
      timestamp: new Date().toISOString(),
      path: error.url || ''
    };

    if (error.error?.errors) {
      apiError.errors = error.error.errors;
    }

    if (error.error?.context) {
      apiError.context = error.error.context;
    }

    return apiError;
  }

  private determineErrorCode(error: HttpErrorResponse): string {
    if (error.error?.error) {
      return error.error.error;
    }

    switch (error.status) {
      case 0:
        return 'NETWORK_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return ERROR_CODES.UNAUTHORIZED_OPERATION;
      case 404:
        return ERROR_CODES.ENTITY_NOT_FOUND;
      case 422:
        return ERROR_CODES.BUSINESS_RULE_VIOLATION;
      case 400:
        return ERROR_CODES.VALIDATION_ERROR;
      default:
        return error.status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.HTTP_ERROR;
    }
  }

  private determineErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 0:
        return 'Impossible de se connecter au serveur';
      case 401:
        return 'Authentification requise';
      case 403:
        return 'Accès refusé';
      case 404:
        return 'Ressource non trouvée';
      case 422:
        return 'Règle métier violée';
      case 400:
        return 'Données invalides';
      default:
        return error.status >= 500
          ? 'Erreur serveur inattendue'
          : `Erreur HTTP ${error.status}`;
    }
  }

  private handleErrorByCode(error: ApiErrorResponse): void {
    switch (error.error) {
      case 'UNAUTHORIZED':
        if (!window.location.pathname.includes('/auth')) {
          this.router.navigate(['/auth/login']);
          this.notificationService.warning('Session expirée', 'Veuillez vous reconnecter');
        }
        break;

      case ERROR_CODES.ENTITY_NOT_FOUND:
        this.notificationService.error('Non trouvé', error.message);
        break;

      case ERROR_CODES.VALIDATION_ERROR:
        const message = error.errors?.length
          ? `Erreurs de validation: ${error.errors.map(e => e.field).join(', ')}`
          : error.message;
        this.notificationService.error('Validation échouée', message);
        break;

      case ERROR_CODES.BUSINESS_RULE_VIOLATION:
        this.notificationService.warning('Règle métier', error.message);
        break;

      case ERROR_CODES.INTERNAL_ERROR:
        this.notificationService.error('Erreur serveur', 'Une erreur inattendue s\'est produite', true);
        break;

      case 'NETWORK_ERROR':
        this.notificationService.error('Connexion', 'Impossible de contacter le serveur', true);
        break;
    }
  }
}
