import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const serviceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/service-management/service-management.component')
        .then(m => m.ServiceManagementComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/service-list/service-list.component')
            .then(m => m.ServiceListComponent)
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/service-form/service-form.component')
            .then(m => m.ServiceFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/service-form/service-form.component')
            .then(m => m.ServiceFormComponent)
      },
      {
        path: ':id/estimate',
        loadComponent: () =>
          import('./components/estimate-calculator/estimate-calculator.component')
            .then(m => m.EstimateCalculatorComponent)
      }
    ]
  }
];
