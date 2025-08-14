import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/auth/services/notification.service';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(100%)'
        }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            opacity: 1,
            transform: 'translateX(0)'
          })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            opacity: 0,
            transform: 'translateX(100%)'
          })
        )
      ])
    ]),
    trigger('progress', [
      state('active', style({ width: '0%' })),
      transition('* => active', [
        style({ width: '100%' }),
        animate('{{ duration }}ms linear', style({ width: '0%' }))
      ], { params: { duration: 5000 } })
    ])
  ]
})
export class NotificationComponent {
  protected notificationService = inject(NotificationService);

  getNotificationClasses(type: string): string {
    const baseClasses = 'bg-white';
    const typeClasses = {
      success: 'border-l-4 border-green-400',
      error: 'border-l-4 border-red-400',
      warning: 'border-l-4 border-yellow-400',
      info: 'border-l-4 border-blue-400'
    };
    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || ''}`;
  }

  getActionClasses(style: string, notificationType: string): string {
    if (style === 'primary') {
      const colors = {
        success: 'bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-600',
        error: 'bg-red-50 text-red-800 hover:bg-red-100 focus:ring-red-600',
        warning: 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus:ring-yellow-600',
        info: 'bg-blue-50 text-blue-800 hover:bg-blue-100 focus:ring-blue-600'
      };
      return colors[notificationType as keyof typeof colors] || colors.info;
    }
    return 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500';
  }

  getProgressBarColor(type: string): string {
    const colors = {
      success: 'bg-green-400',
      error: 'bg-red-400',
      warning: 'bg-yellow-400',
      info: 'bg-blue-400'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-400';
  }

  handleAction(action: any, notificationId: string): void {
    action.action();
    this.notificationService.dismiss(notificationId);
  }
}
