import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';

interface BulkBillingClinic {
  id: number;
  name: string;
  address: string;
  suburb: string;
  distance: string;
  bulkBillingStatus: 'Full' | 'Partial';
  gpAvailability: string;
  phone: string;
  hours: string;
  acceptingNewPatients: boolean;
  telehealth: boolean;
  rating: number;
}

@Component({
  selector: 'app-bulk-billing-locator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, InputTextModule, DividerModule, CheckboxModule],
  template: `
    <div class="bulk-billing-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-dollar"></i>
          </div>
          <div>
            <h1>Bulk-Billing Clinic Locator</h1>
            <p>Find GP clinics that bulk-bill - no out-of-pocket cost with a valid Medicare card</p>
          </div>
        </div>
      </header>

      <!-- Medicare Info Banner -->
      <div class="medicare-banner">
        <div class="medicare-logo">
          <i class="pi pi-shield"></i>
          <span>Medicare</span>
        </div>
        <div class="medicare-info">
          <strong>Bulk-billing means $0 out-of-pocket</strong>
          <p>
            When a doctor bulk-bills, they charge the Medicare Benefits Schedule (MBS) fee directly
            to Medicare. You pay nothing. A valid Medicare card is required. Some concession or
            Commonwealth Seniors Health Card holders may be eligible where standard patients are not.
          </p>
        </div>
      </div>

      <!-- Search + Filter -->
      <p-card styleClass="search-card">
        <div class="search-row">
          <div class="search-input-wrap">
            <i class="pi pi-search search-icon-field"></i>
            <input
              pInputText
              type="text"
              placeholder="Enter suburb or postcode (e.g. Bondi Junction, 2022)"
              [(ngModel)]="searchQuery"
              class="search-input"
              (keyup.enter)="searchClinics()"
            />
          </div>
          <button
            pButton
            label="Search"
            icon="pi pi-search"
            (click)="searchClinics()"
          ></button>
        </div>
        <div class="filter-row">
          <p-checkbox
            [(ngModel)]="fullBulkBillingOnly"
            [binary]="true"
            label="Full bulk-billing only"
            (onChange)="applyFilters()"
          ></p-checkbox>
          <p-checkbox
            [(ngModel)]="newPatientsOnly"
            [binary]="true"
            label="Accepting new patients"
            (onChange)="applyFilters()"
          ></p-checkbox>
          <p-checkbox
            [(ngModel)]="telehealthOnly"
            [binary]="true"
            label="Telehealth available"
            (onChange)="applyFilters()"
          ></p-checkbox>
        </div>
        @if (hasSearched()) {
          <div class="search-result-meta">
            Showing <strong>{{ displayedClinics().length }}</strong> clinics near
            <strong>{{ lastSearchQuery() }}</strong>
          </div>
        }
      </p-card>

      @if (hasSearched()) {
        <div class="clinics-list">
          @for (clinic of displayedClinics(); track clinic.id) {
            <p-card styleClass="clinic-card">
              <div class="clinic-layout">
                <div class="clinic-main">
                  <div class="clinic-header">
                    <div class="clinic-name-row">
                      <h3 class="clinic-name">{{ clinic.name }}</h3>
                      <p-tag
                        [value]="clinic.bulkBillingStatus + ' Bulk-Billing'"
                        [severity]="clinic.bulkBillingStatus === 'Full' ? 'success' : 'warning'"
                      ></p-tag>
                    </div>
                    <div class="clinic-tags">
                      @if (clinic.acceptingNewPatients) {
                        <span class="clinic-tag accepting">
                          <i class="pi pi-user-plus"></i> Accepting New Patients
                        </span>
                      }
                      @if (clinic.telehealth) {
                        <span class="clinic-tag telehealth">
                          <i class="pi pi-video"></i> Telehealth
                        </span>
                      }
                    </div>
                  </div>
                  <div class="clinic-details">
                    <div class="detail-item">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ clinic.address }}, {{ clinic.suburb }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-clock"></i>
                      <span>{{ clinic.hours }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-phone"></i>
                      <span>{{ clinic.phone }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="pi pi-user-md"></i>
                      <span>GP Availability: {{ clinic.gpAvailability }}</span>
                    </div>
                  </div>
                  <div class="star-rating">
                    @for (star of getStars(clinic.rating); track $index) {
                      <i class="pi pi-star-fill star-filled"></i>
                    }
                    @for (star of getEmptyStars(clinic.rating); track $index) {
                      <i class="pi pi-star star-empty"></i>
                    }
                    <span class="rating-value">{{ clinic.rating.toFixed(1) }}</span>
                  </div>
                </div>
                <div class="clinic-side">
                  <div class="distance-badge">
                    <i class="pi pi-map"></i>
                    <span class="distance-value">{{ clinic.distance }}</span>
                    <span class="distance-label">away</span>
                  </div>
                  <div class="clinic-actions">
                    <button
                      pButton
                      label="Book via HotDoc"
                      icon="pi pi-calendar-plus"
                      class="p-button-sm p-button-primary"
                    ></button>
                    <button
                      pButton
                      label="Get Directions"
                      icon="pi pi-map"
                      class="p-button-outlined p-button-sm"
                    ></button>
                    <button
                      pButton
                      [label]="clinic.phone"
                      icon="pi pi-phone"
                      class="p-button-outlined p-button-sm p-button-secondary"
                    ></button>
                  </div>
                </div>
              </div>
            </p-card>
          }
        </div>
      } @else {
        <div class="empty-state">
          <i class="pi pi-map-marker"></i>
          <h3>Find Bulk-Billing GPs Near You</h3>
          <p>Enter your suburb or postcode to discover nearby clinics where you pay nothing with Medicare.</p>
        </div>
      }

      <p-divider></p-divider>

      <!-- Medicare Card Reminder -->
      <div class="medicare-reminder">
        <i class="pi pi-credit-card"></i>
        <div>
          <strong>Remember to bring your Medicare card</strong>
          <p>
            You must present a valid Medicare card at the time of your consultation to receive bulk-billing.
            Check your Medicare card expiry and update your details at myGov if needed.
          </p>
          <button pButton label="Check Medicare Details on myGov" icon="pi pi-external-link" class="p-button-outlined p-button-sm" style="margin-top: 0.75rem;"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-billing-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--yellow-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--yellow-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .medicare-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #009c3b 0%, #005f23 100%); color: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .medicare-logo { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; flex-shrink: 0; }
    .medicare-logo i { font-size: 1.75rem; }
    .medicare-logo span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .medicare-info strong { display: block; font-size: 1rem; margin-bottom: 0.4rem; }
    .medicare-info p { margin: 0; font-size: 0.85rem; line-height: 1.55; opacity: 0.9; }
    .search-row { display: flex; gap: 0.75rem; align-items: center; }
    .search-input-wrap { flex: 1; position: relative; }
    .search-icon-field { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-color-secondary); font-size: 0.875rem; z-index: 1; }
    .search-input { width: 100%; padding-left: 2.25rem !important; }
    .filter-row { display: flex; gap: 1.25rem; align-items: center; margin-top: 0.875rem; flex-wrap: wrap; }
    .search-result-meta { margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .clinics-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .clinic-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .clinic-main { flex: 1; }
    .clinic-header { margin-bottom: 0.75rem; }
    .clinic-name-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .clinic-name { margin: 0; font-size: 1rem; font-weight: 600; }
    .clinic-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .clinic-tag { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; }
    .clinic-tag.accepting { background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-200); }
    .clinic-tag.telehealth { background: var(--blue-50); color: var(--blue-700); border: 1px solid var(--blue-200); }
    .clinic-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem; }
    .detail-item { display: flex; align-items: flex-start; gap: 0.4rem; font-size: 0.825rem; color: var(--text-color-secondary); }
    .detail-item i { font-size: 0.75rem; flex-shrink: 0; margin-top: 0.15rem; color: var(--primary-400); }
    .star-rating { display: flex; align-items: center; gap: 0.2rem; }
    .star-filled { color: var(--yellow-500); font-size: 0.75rem; }
    .star-empty { color: var(--surface-300); font-size: 0.75rem; }
    .rating-value { font-size: 0.8rem; color: var(--text-color-secondary); margin-left: 0.3rem; }
    .clinic-side { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; min-width: 140px; }
    .distance-badge { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1rem; background: var(--surface-ground); border-radius: 8px; border: 1px solid var(--surface-border); text-align: center; }
    .distance-badge i { color: var(--primary-500); margin-bottom: 0.25rem; }
    .distance-value { font-size: 1.1rem; font-weight: 700; color: var(--primary-600); }
    .distance-label { font-size: 0.7rem; color: var(--text-color-secondary); }
    .clinic-actions { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem 1rem; text-align: center; gap: 0.75rem; color: var(--text-color-secondary); }
    .empty-state i { font-size: 3rem; color: var(--surface-400); }
    .empty-state h3 { margin: 0; color: var(--text-color); }
    .empty-state p { margin: 0; max-width: 400px; font-size: 0.875rem; }
    .medicare-reminder { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.25rem; background: var(--yellow-50); border: 1px solid var(--yellow-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--yellow-800); }
    .medicare-reminder i { font-size: 1.25rem; color: var(--yellow-600); flex-shrink: 0; margin-top: 0.1rem; }
    .medicare-reminder strong { display: block; margin-bottom: 0.3rem; font-size: 0.95rem; }
    .medicare-reminder p { margin: 0; line-height: 1.55; }
    @media (max-width: 768px) {
      .clinic-layout { flex-direction: column; }
      .clinic-details { grid-template-columns: 1fr; }
      .clinic-side { flex-direction: row; width: 100%; flex-wrap: wrap; }
    }
  `]
})
export class BulkBillingLocatorComponent {
  searchQuery = '';
  fullBulkBillingOnly = false;
  newPatientsOnly = false;
  telehealthOnly = false;

  readonly hasSearched = signal(false);
  readonly lastSearchQuery = signal('');

  private readonly allClinics = signal<BulkBillingClinic[]>([
    { id: 1, name: 'Bondi Junction Medical Centre', address: '500 Oxford St', suburb: 'Bondi Junction NSW 2022', distance: '0.4 km', bulkBillingStatus: 'Full', gpAvailability: 'Available Today', phone: '(02) 9387 5500', hours: 'Mon-Fri 8am-6pm, Sat 9am-1pm', acceptingNewPatients: true, telehealth: true, rating: 4.5 },
    { id: 2, name: 'Eastern Suburbs GP Clinic', address: '68 Ebley St', suburb: 'Bondi Junction NSW 2022', distance: '0.7 km', bulkBillingStatus: 'Full', gpAvailability: 'Next Available: Tomorrow', phone: '(02) 9387 1100', hours: 'Mon-Fri 8:30am-5:30pm', acceptingNewPatients: true, telehealth: true, rating: 4.2 },
    { id: 3, name: 'Rose Bay Family Practice', address: '1 Dover Road', suburb: 'Rose Bay NSW 2029', distance: '1.8 km', bulkBillingStatus: 'Partial', gpAvailability: 'Available Now', phone: '(02) 9371 7700', hours: 'Mon-Sat 8am-8pm, Sun 9am-3pm', acceptingNewPatients: false, telehealth: true, rating: 4.7 },
    { id: 4, name: 'Waverley Medical Centre', address: '118 Bronte Rd', suburb: 'Waverley NSW 2024', distance: '2.2 km', bulkBillingStatus: 'Full', gpAvailability: 'Available Today', phone: '(02) 9369 3600', hours: 'Mon-Fri 7:30am-7pm, Sat 8am-2pm', acceptingNewPatients: true, telehealth: false, rating: 4.1 },
    { id: 5, name: 'Randwick Health Hub', address: '45 Belmore Rd', suburb: 'Randwick NSW 2031', distance: '3.1 km', bulkBillingStatus: 'Partial', gpAvailability: 'Next Available: Monday', phone: '(02) 9399 5500', hours: 'Mon-Fri 8am-6pm', acceptingNewPatients: true, telehealth: true, rating: 4.3 }
  ]);

  readonly displayedClinics = computed(() => {
    let clinics = this.allClinics();
    if (this.fullBulkBillingOnly) clinics = clinics.filter(c => c.bulkBillingStatus === 'Full');
    if (this.newPatientsOnly) clinics = clinics.filter(c => c.acceptingNewPatients);
    if (this.telehealthOnly) clinics = clinics.filter(c => c.telehealth);
    return clinics;
  });

  searchClinics(): void {
    if (this.searchQuery.trim()) {
      this.hasSearched.set(true);
      this.lastSearchQuery.set(this.searchQuery.trim());
    }
  }

  applyFilters(): void {
    // filters are reactive via computed signal
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }
}
