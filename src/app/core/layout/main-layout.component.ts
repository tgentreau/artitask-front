import {Component, inject, signal} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router, RouterModule} from "@angular/router";
import {AuthService} from "../auth/auth.service";

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  showUserMenu = signal(false);

  getUserInitials(): string {
    const user = this.authService.currentUser$();
    if (user?.companyName) {
      return user.companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'AR';
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
