import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./domain/dashboard/components/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clients',
    loadComponent: () => import('./domain/client/components/client-list/client-list.component').then(m => m.ClientListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clients/new',
    loadComponent: () => import('./domain/client/components/client-form/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clients/:id/edit',
    loadComponent: () => import('./domain/client/components/client-form/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'services',
    loadChildren: () => import('./domain/service/service.routes').then(m => m.serviceRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'interventions',
    loadChildren: () => import('./domain/intervention/intervention.routes').then(m => m.interventionsRoutes),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
