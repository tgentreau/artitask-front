// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./core/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./domain/intervention/pages/intervention-dashboard.component').then(m => m.InterventionDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'interventions',
    loadComponent: () => import('./domain/intervention/pages/intervention-dashboard.component').then(m => m.InterventionDashboardComponent),
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
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
