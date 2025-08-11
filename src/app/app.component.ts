// src/app/app.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { AuthService } from './core/auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
  template: `
    @if (authService.isAuthenticated$()) {
      <app-layout></app-layout>
    }
    @else {
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
}
