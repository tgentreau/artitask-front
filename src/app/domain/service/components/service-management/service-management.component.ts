import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './service-management.component.html'
})
export class ServiceManagementComponent {}
