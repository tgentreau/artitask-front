import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../models/service.model';
import { SERVICE_TYPES } from '../../models/service.constants';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-card.component.html'
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: Service;
  @Input() selected = false;

  @Output() edit = new EventEmitter<Service>();
  @Output() toggle = new EventEmitter<Service>();
  @Output() duplicate = new EventEmitter<Service>();
  @Output() estimate = new EventEmitter<Service>();
  @Output() select = new EventEmitter<string>();

  getServiceIcon(): string {
    const serviceType = SERVICE_TYPES.find(t => t.value === this.service.type.value);
    return serviceType?.icon || '📋';
  }

  formatPrice(price?: number): string {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  formatMajoration(value: number): string {
    const percentage = Math.round((value - 1) * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.service);
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    this.toggle.emit(this.service);
  }

  onDuplicate(event: Event): void {
    event.stopPropagation();
    this.duplicate.emit(this.service);
  }

  onEstimate(event: Event): void {
    event.stopPropagation();
    this.estimate.emit(this.service);
  }

  onSelect(event: Event): void {
    event.stopPropagation();
    this.select.emit(this.service.id);
  }
}
