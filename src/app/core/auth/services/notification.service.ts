import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
  icon?: string;
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  private defaultDuration = 5000;
  private maxNotifications = 3;

  notifications$ = computed(() => this.notifications());
  hasNotifications$ = computed(() => this.notifications().length > 0);

  show(
    title: string,
    options?: {
      type?: 'success' | 'error' | 'warning' | 'info';
      message?: string;
      duration?: number;
      actions?: NotificationAction[];
      persistent?: boolean;
    }
  ): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      type: options?.type || 'info',
      title,
      message: options?.message,
      duration: options?.persistent ? 0 : (options?.duration || this.defaultDuration),
      actions: options?.actions,
      icon: this.getIconForType(options?.type || 'info'),
      timestamp: new Date()
    };

    this.addNotification(notification);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.dismiss(id), notification.duration);
    }

    return id;
  }

  success(title: string, message?: string, duration?: number): string {
    return this.show(title, { type: 'success', message, duration });
  }

  error(title: string, message?: string, persistent = false): string {
    return this.show(title, {
      type: 'error',
      message,
      persistent,
      duration: persistent ? 0 : 8000
    });
  }

  warning(title: string, message?: string, duration?: number): string {
    return this.show(title, { type: 'warning', message, duration: duration || 6000 });
  }

  info(title: string, message?: string, duration?: number): string {
    return this.show(title, { type: 'info', message, duration });
  }

  dismiss(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  dismissAll(): void {
    this.notifications.set([]);
  }

  private addNotification(notification: Notification): void {
    this.notifications.update(notifications => {
      const updated = [...notifications, notification];

      if (updated.length > this.maxNotifications) {
        return updated.slice(-this.maxNotifications);
      }

      return updated;
    });
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getIconForType(type: 'success' | 'error' | 'warning' | 'info'): string {
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info-circle'
    };
    return icons[type];
  }

  showHttpError(error: any): void {
    if (error.status === 0) {
      this.error(
        'Erreur de connexion',
        'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
        true
      );
    } else if (error.status === 401) {
      this.warning(
        'Session expirée',
        'Veuillez vous reconnecter pour continuer.'
      );
    } else if (error.status === 403) {
      this.error(
        'Accès refusé',
        'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.'
      );
    } else if (error.status === 404) {
      this.error(
        'Ressource introuvable',
        'L\'élément demandé n\'existe pas ou a été supprimé.'
      );
    } else if (error.status === 409) {
      this.error(
        'Conflit',
        error.error?.message || 'Cette action entre en conflit avec l\'état actuel.'
      );
    } else if (error.status === 422) {
      this.error(
        'Données invalides',
        error.error?.message || 'Les données fournies sont invalides.'
      );
    } else if (error.status === 429) {
      this.error(
        'Trop de requêtes',
        'Veuillez patienter avant de réessayer.',
        true
      );
    } else if (error.status >= 500) {
      this.error(
        'Erreur serveur',
        'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.',
        true
      );
    } else {
      this.error(
        'Erreur',
        error.error?.message || error.message || 'Une erreur inattendue s\'est produite.'
      );
    }
  }

  showApiResponse(response: any): void {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      this.success(
        'Succès',
        response.message || 'Opération réussie'
      );
    } else {
      this.error(
        'Erreur',
        response.message || 'Une erreur s\'est produite'
      );
    }
  }
}
