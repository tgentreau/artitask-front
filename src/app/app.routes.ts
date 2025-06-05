import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./core/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./domain/intervention/pages/intervention-dashboard.component').then(m => m.InterventionDashboardComponent)
      },
      {
        path: 'interventions',
        loadComponent: () => import('./domain/intervention/pages/intervention-dashboard.component').then(m => m.InterventionDashboardComponent)
      }
    ]
  }
];
