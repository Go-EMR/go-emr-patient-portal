import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';

interface PharmacyStore {
  id: number;
  name: string;
  address: string;
  area: string;
  distance: string;
  hours: string;
  phone: string;
  medicinesAvailable: number;
  isOpen: boolean;
}

@Component({
  selector: 'app-jan-aushadhi-locator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, InputTextModule, DividerModule],
  template: `
    <div class="jan-aushadhi-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-building"></i>
          </div>
          <div>
            <h1>Jan Aushadhi Pharmacy Locator</h1>
            <p>Find Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) stores near you</p>
          </div>
        </div>
      </header>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About Jan Aushadhi</strong>
          <p>
            Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) provides quality generic
            medicines at affordable prices through dedicated Jan Aushadhi Kendras across India.
            Medicines are up to 50-90% cheaper than branded equivalents while maintaining the
            same efficacy and safety standards.
          </p>
        </div>
      </div>

      <!-- Search -->
      <p-card styleClass="search-card">
        <div class="search-row">
          <div class="search-input-wrap">
            <i class="pi pi-search search-icon-field"></i>
            <input
              pInputText
              type="text"
              placeholder="Enter area name or PIN code (e.g. Andheri, 400053)"
              [(ngModel)]="searchQuery"
              class="search-input"
              (keyup.enter)="searchStores()"
            />
          </div>
          <button
            pButton
            label="Find Stores"
            icon="pi pi-search"
            (click)="searchStores()"
          ></button>
        </div>
        @if (hasSearched()) {
          <div class="search-result-meta">
            <span>Showing {{ filteredStores().length }} Jan Aushadhi Kendra(s) near
              <strong>{{ lastSearchQuery() }}</strong>
            </span>
          </div>
        }
      </p-card>

      @if (hasSearched()) {
        <div class="stores-list">
          @for (store of filteredStores(); track store.id) {
            <p-card styleClass="store-card">
              <div class="store-layout">
                <div class="store-main">
                  <div class="store-header">
                    <div class="store-name-row">
                      <h3 class="store-name">{{ store.name }}</h3>
                      <p-tag
                        [value]="store.isOpen ? 'Open' : 'Closed'"
                        [severity]="store.isOpen ? 'success' : 'danger'"
                      ></p-tag>
                    </div>
                    <span class="store-area">{{ store.area }}</span>
                  </div>
                  <div class="store-details">
                    <div class="detail-item">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ store.address }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-clock"></i>
                      <span>{{ store.hours }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-phone"></i>
                      <span>{{ store.phone }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-box"></i>
                      <span>{{ store.medicinesAvailable }}+ medicines in stock</span>
                    </div>
                  </div>
                </div>
                <div class="store-side">
                  <div class="distance-badge">
                    <i class="pi pi-map"></i>
                    <span class="distance-value">{{ store.distance }}</span>
                    <span class="distance-label">away</span>
                  </div>
                  <div class="store-actions">
                    <button
                      pButton
                      label="Show on Map"
                      icon="pi pi-map"
                      class="p-button-outlined p-button-sm"
                    ></button>
                    <button
                      pButton
                      label="Check Availability"
                      icon="pi pi-check"
                      class="p-button-outlined p-button-sm p-button-success"
                      (click)="checkAvailability(store)"
                    ></button>
                  </div>
                </div>
              </div>
            </p-card>
          }
        </div>

        <!-- Map Placeholder -->
        <p-card styleClass="map-card">
          <div class="map-placeholder">
            <i class="pi pi-map"></i>
            <p>Interactive map view coming soon</p>
            <span>Stores will be shown on an embedded map for easier navigation</span>
          </div>
        </p-card>
      } @else {
        <div class="empty-state">
          <i class="pi pi-building"></i>
          <h3>Find Jan Aushadhi Kendras Near You</h3>
          <p>Enter your area name or PIN code to discover nearby stores offering affordable generic medicines.</p>
        </div>
      }

      <p-divider></p-divider>

      <!-- Stats Banner -->
      <div class="stats-banner">
        <div class="stat-item">
          <span class="stat-value">10,000+</span>
          <span class="stat-label">Kendras across India</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">1,900+</span>
          <span class="stat-label">Generic medicines listed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">50-90%</span>
          <span class="stat-label">Cost savings vs. branded</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">36 States</span>
          <span class="stat-label">Coverage across India</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .jan-aushadhi-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--green-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--green-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--green-800); }
    .info-banner i { font-size: 1.1rem; color: var(--green-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    .search-row { display: flex; gap: 0.75rem; align-items: center; }
    .search-input-wrap { flex: 1; position: relative; }
    .search-icon-field { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-color-secondary); font-size: 0.875rem; }
    .search-input { width: 100%; padding-left: 2.25rem !important; }
    .search-result-meta { margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .stores-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .store-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .store-main { flex: 1; }
    .store-header { margin-bottom: 0.75rem; }
    .store-name-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
    .store-name { margin: 0; font-size: 1rem; font-weight: 600; }
    .store-area { font-size: 0.825rem; color: var(--text-color-secondary); }
    .store-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .detail-item { display: flex; align-items: flex-start; gap: 0.4rem; font-size: 0.825rem; color: var(--text-color-secondary); }
    .detail-item i { font-size: 0.75rem; flex-shrink: 0; margin-top: 0.15rem; color: var(--primary-400); }
    .store-side { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; min-width: 120px; }
    .distance-badge { display: flex; flex-direction: column; align-items: center; padding: 0.75rem; background: var(--surface-ground); border-radius: 8px; border: 1px solid var(--surface-border); text-align: center; }
    .distance-badge i { color: var(--primary-500); margin-bottom: 0.25rem; }
    .distance-value { font-size: 1.1rem; font-weight: 700; color: var(--primary-600); }
    .distance-label { font-size: 0.7rem; color: var(--text-color-secondary); }
    .store-actions { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
    .map-card { margin-top: 1rem; }
    .map-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; color: var(--text-color-secondary); gap: 0.5rem; background: var(--surface-ground); border-radius: 8px; }
    .map-placeholder i { font-size: 2.5rem; color: var(--surface-400); }
    .map-placeholder p { margin: 0; font-weight: 500; }
    .map-placeholder span { font-size: 0.85rem; text-align: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; color: var(--text-color-secondary); gap: 0.75rem; text-align: center; }
    .empty-state i { font-size: 3rem; color: var(--surface-400); }
    .empty-state h3 { margin: 0; color: var(--text-color); }
    .empty-state p { margin: 0; max-width: 400px; line-height: 1.55; }
    .stats-banner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 0.5rem; }
    .stat-item { display: flex; flex-direction: column; align-items: center; padding: 1rem; background: var(--green-50); border: 1px solid var(--green-100); border-radius: var(--border-radius); text-align: center; }
    .stat-value { font-size: 1.3rem; font-weight: 700; color: var(--green-700); }
    .stat-label { font-size: 0.75rem; color: var(--green-600); margin-top: 0.2rem; }
    @media (max-width: 768px) {
      .search-row { flex-direction: column; }
      .store-layout { flex-direction: column; }
      .store-details { grid-template-columns: 1fr; }
      .store-side { flex-direction: row; width: 100%; }
      .stats-banner { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class JanAushadhiLocatorComponent {
  searchQuery = '';
  readonly hasSearched = signal(false);
  readonly lastSearchQuery = signal('');

  private readonly allStores = signal<PharmacyStore[]>([
    {
      id: 1,
      name: 'Jan Aushadhi Kendra - Andheri',
      address: 'Shop 12, Lokhandwala Complex, Andheri West',
      area: 'Andheri West, Mumbai',
      distance: '0.8 km',
      hours: 'Mon-Sat 8:00 AM - 9:00 PM, Sun 9:00 AM - 6:00 PM',
      phone: '+91 98765 43210',
      medicinesAvailable: 850,
      isOpen: true
    },
    {
      id: 2,
      name: 'PMBJP Store - Versova',
      address: 'Near Versova Bus Depot, Versova, Andheri West',
      area: 'Versova, Mumbai',
      distance: '1.4 km',
      hours: 'Mon-Sun 7:30 AM - 10:00 PM',
      phone: '+91 98765 12345',
      medicinesAvailable: 720,
      isOpen: true
    },
    {
      id: 3,
      name: 'Jan Aushadhi Kendra - Juhu',
      address: 'Juhu Tara Road, Near Juhu Beach, Mumbai',
      area: 'Juhu, Mumbai',
      distance: '2.1 km',
      hours: 'Mon-Sat 9:00 AM - 8:00 PM',
      phone: '+91 91234 56789',
      medicinesAvailable: 650,
      isOpen: false
    },
    {
      id: 4,
      name: 'Bharatiya Janaushadhi Kendra',
      address: 'DN Nagar, Andheri West, Near Subway',
      area: 'DN Nagar, Mumbai',
      distance: '2.8 km',
      hours: 'Mon-Fri 8:30 AM - 8:00 PM, Sat 9:00 AM - 6:00 PM',
      phone: '+91 87654 32109',
      medicinesAvailable: 910,
      isOpen: true
    },
    {
      id: 5,
      name: 'PMBJP Jan Aushadhi Store - Oshiwara',
      address: 'Oshiwara Industrial Area, Jogeshwari West',
      area: 'Oshiwara, Mumbai',
      distance: '3.5 km',
      hours: 'Mon-Sun 8:00 AM - 9:30 PM',
      phone: '+91 76543 21098',
      medicinesAvailable: 780,
      isOpen: true
    }
  ]);

  readonly filteredStores = computed(() => this.allStores());

  searchStores(): void {
    if (this.searchQuery.trim()) {
      this.hasSearched.set(true);
      this.lastSearchQuery.set(this.searchQuery.trim());
    }
  }

  checkAvailability(store: PharmacyStore): void {
    // Mock availability check
  }
}
