import {Component, inject, signal} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router, RouterModule, RouterOutlet} from "@angular/router";
import {AuthService} from "../auth/services/auth.service";
import {NotificationComponent} from "../../shared/components/notification/notification.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NotificationComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  showUserMenu = signal(false);
  showMobileMenu = signal(false);

  getUserInitials(): string {
    const user = this.authService.currentUser$();
    if (user?.nomEntreprise) {
      return user.nomEntreprise.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'AR';
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.showMobileMenu.set(false);
    this.authService.logout();
  }
}
