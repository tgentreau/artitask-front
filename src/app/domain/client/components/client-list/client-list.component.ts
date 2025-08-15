import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html'
})
export class ClientListComponent implements OnInit {
  protected clientService = inject(ClientService);
  private router = inject(Router);

  searchTerm = '';
  sortBy = 'nom';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  currentPage = 1;
  limit = 20;

  private searchResults = signal<Client[]>([]);

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getClients(
      this.currentPage,
      this.limit,
      this.sortBy,
      this.sortOrder
    ).subscribe();
  }

  displayedClients() {
    return this.searchTerm ? this.searchResults() : this.clientService.clients();
  }

  totalPages() {
    return Math.ceil(this.clientService.total() / this.limit);
  }

  onSearch() {
    if (this.searchTerm.length >= 2) {
      this.clientService.searchClients(this.searchTerm).subscribe(
        results => this.searchResults.set(results)
      );
    } else {
      this.searchResults.set([]);
    }
  }

  sort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadClients();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadClients();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.loadClients();
    }
  }

  navigateToCreate() {
    this.router.navigate(['/clients/new']);
  }

  viewClient(client: Client) {
    this.router.navigate(['/clients', client.id]);
  }

  editClient(event: Event, client: Client) {
    event.stopPropagation();
    this.router.navigate(['/clients', client.id, 'edit']);
  }

  deleteClient(event: Event, client: Client) {
    event.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${client.nom} ?`)) {
      this.clientService.deleteClient(client.id).subscribe({
        next: () => {},
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du client');
        }
      });
    }
  }

  protected Math = Math;
}
