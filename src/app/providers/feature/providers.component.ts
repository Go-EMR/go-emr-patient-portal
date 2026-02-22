import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProvidersService, Provider, Specialty, SortBy, SPECIALTIES } from '../data-access';

@Component({
  selector: 'app-providers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, TagModule],
  template: `
    <div class="providers-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-users"></i>
          </div>
          <div>
            <h1 class="page-title">Find a Provider</h1>
            <p class="page-subtitle">Search our network of board-certified specialists and primary care providers accepting patients</p>
          </div>
        </div>
        <div class="header-meta">
          <span class="provider-count-badge">
            <i class="pi pi-user-plus"></i>
            {{ service.filteredProviders().length }} Providers Found
          </span>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="search-filter-bar">
        <div class="search-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input
            class="search-input"
            type="text"
            placeholder="Search by name, specialty, location, or language..."
            [value]="service.searchQuery()"
            (input)="onSearch($event)"
          />
          @if (service.searchQuery()) {
            <button class="search-clear" (click)="service.setSearch('')">
              <i class="pi pi-times"></i>
            </button>
          }
        </div>

        <div class="sort-wrapper">
          <span class="sort-label">Sort by</span>
          @for (opt of sortOptions; track opt.value) {
            <button
              class="sort-btn"
              [class.active]="service.sortBy() === opt.value"
              (click)="service.setSort(opt.value)"
            >
              <i [class]="opt.icon"></i>
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      <!-- Specialty Filter Chips -->
      <div class="specialty-chips">
        @for (spec of specialties; track spec) {
          <button
            class="specialty-chip"
            [class.active]="service.selectedSpecialty() === spec"
            (click)="service.setSpecialty(spec)"
          >
            <i [class]="getSpecialtyIcon(spec)"></i>
            {{ spec }}
          </button>
        }
      </div>

      <!-- Active Filters Summary -->
      @if (service.searchQuery() || service.selectedSpecialty() !== 'All') {
        <div class="active-filters">
          <span class="active-filters-label">Active filters:</span>
          @if (service.selectedSpecialty() !== 'All') {
            <span class="filter-tag">
              <i class="pi pi-tag"></i>
              {{ service.selectedSpecialty() }}
              <button class="filter-tag-remove" (click)="service.setSpecialty('All')">
                <i class="pi pi-times"></i>
              </button>
            </span>
          }
          @if (service.searchQuery()) {
            <span class="filter-tag">
              <i class="pi pi-search"></i>
              "{{ service.searchQuery() }}"
              <button class="filter-tag-remove" (click)="service.setSearch('')">
                <i class="pi pi-times"></i>
              </button>
            </span>
          }
          <button class="clear-all-btn" (click)="service.clearFilters()">Clear all</button>
        </div>
      }

      <!-- Main Layout: Grid + Detail Panel -->
      <div class="content-layout" [class.panel-open]="service.selectedProvider()">

        <!-- Provider Grid -->
        <div class="providers-grid-area">
          @if (service.filteredProviders().length === 0) {
            <!-- Empty State -->
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-users"></i>
              </div>
              <h3 class="empty-title">No providers found</h3>
              <p class="empty-subtitle">Try adjusting your search terms or removing specialty filters to see more results.</p>
              <button class="empty-action-btn" (click)="service.clearFilters()">
                <i class="pi pi-refresh"></i>
                Clear All Filters
              </button>
            </div>
          } @else {
            <div class="providers-grid">
              @for (provider of service.filteredProviders(); track provider.id) {
                <div
                  class="provider-card"
                  [class.selected]="service.selectedProvider()?.id === provider.id"
                  (click)="service.selectProvider(provider)"
                >
                  <!-- Card Top Row -->
                  <div class="card-top">
                    <div class="provider-avatar" [style.background]="getAvatarColor(provider.id)">
                      {{ provider.avatar }}
                    </div>
                    <div class="provider-primary-info">
                      <div class="provider-name">Dr. {{ provider.firstName }} {{ provider.lastName }}</div>
                      <div class="provider-title">{{ provider.title }}</div>
                      <div class="specialty-tag" [class]="'specialty-' + getSpecialtyClass(provider.specialty)">
                        <i [class]="getSpecialtyIcon(provider.specialty)"></i>
                        {{ provider.specialty }}
                      </div>
                    </div>
                  </div>

                  <!-- Rating Row -->
                  <div class="rating-row">
                    <div class="stars">
                      @for (star of getStars(provider.rating); track $index) {
                        <svg class="star" [class.filled]="star === 'full'" [class.half]="star === 'half'" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                          @if (star === 'half') {
                            <defs>
                              <linearGradient [id]="'half-' + provider.id + '-' + $index">
                                <stop offset="50%" stop-color="currentColor"/>
                                <stop offset="50%" stop-color="transparent"/>
                              </linearGradient>
                            </defs>
                            <path [attr.fill]="'url(#half-' + provider.id + '-' + $index + ')'" stroke="currentColor" stroke-width="0.5" d="M8 1l1.854 3.755 4.146.602-3 2.924.708 4.128L8 10.35l-3.708 2.06L5 8.28 2 5.357l4.146-.602L8 1z"/>
                          } @else {
                            <path d="M8 1l1.854 3.755 4.146.602-3 2.924.708 4.128L8 10.35l-3.708 2.06L5 8.28 2 5.357l4.146-.602L8 1z"/>
                          }
                        </svg>
                      }
                    </div>
                    <span class="rating-value">{{ provider.rating.toFixed(1) }}</span>
                    <span class="review-count">({{ provider.reviewCount }} reviews)</span>
                  </div>

                  <!-- Card Meta -->
                  <div class="card-meta">
                    <div class="meta-item">
                      <i class="pi pi-map-marker meta-icon"></i>
                      <span>{{ provider.distance }} mi away</span>
                    </div>
                    <div class="meta-item">
                      <i class="pi pi-phone meta-icon"></i>
                      <span>{{ provider.phone }}</span>
                    </div>
                    <div class="meta-item languages-item">
                      <i class="pi pi-globe meta-icon"></i>
                      <span>{{ provider.languages.join(', ') }}</span>
                    </div>
                  </div>

                  <!-- Card Footer -->
                  <div class="card-footer">
                    @if (provider.acceptingNewPatients) {
                      <span class="accepting-badge">
                        <i class="pi pi-check-circle"></i>
                        Accepting New Patients
                      </span>
                    } @else {
                      <span class="not-accepting-badge">
                        <i class="pi pi-times-circle"></i>
                        Not Accepting
                      </span>
                    }
                    <div class="card-actions">
                      <button
                        class="card-btn card-btn-outline"
                        (click)="onViewProfile($event, provider)"
                      >
                        View Profile
                      </button>
                      <button
                        class="card-btn card-btn-primary"
                        [disabled]="!provider.acceptingNewPatients"
                        (click)="onBook($event, provider)"
                      >
                        <i class="pi pi-calendar-plus"></i>
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Provider Detail Panel -->
        @if (service.selectedProvider(); as provider) {
          <div class="detail-panel">

            <!-- Panel Header -->
            <div class="detail-panel-header">
              <button class="panel-close-btn" (click)="service.selectProvider(null)">
                <i class="pi pi-times"></i>
              </button>
              <div class="detail-avatar" [style.background]="getAvatarColor(provider.id)">
                {{ provider.avatar }}
              </div>
              <div class="detail-name-block">
                <h2 class="detail-name">Dr. {{ provider.firstName }} {{ provider.lastName }}</h2>
                <div class="detail-title">{{ provider.title }}</div>
                <div class="specialty-tag detail-specialty" [class]="'specialty-' + getSpecialtyClass(provider.specialty)">
                  <i [class]="getSpecialtyIcon(provider.specialty)"></i>
                  {{ provider.specialty }}
                </div>
              </div>
            </div>

            <!-- Rating -->
            <div class="detail-rating-row">
              <div class="stars">
                @for (star of getStars(provider.rating); track $index) {
                  <svg class="star star-lg" [class.filled]="star === 'full'" [class.half]="star === 'half'" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    @if (star === 'half') {
                      <defs>
                        <linearGradient [id]="'detail-half-' + $index">
                          <stop offset="50%" stop-color="currentColor"/>
                          <stop offset="50%" stop-color="transparent"/>
                        </linearGradient>
                      </defs>
                      <path [attr.fill]="'url(#detail-half-' + $index + ')'" stroke="currentColor" stroke-width="0.5" d="M8 1l1.854 3.755 4.146.602-3 2.924.708 4.128L8 10.35l-3.708 2.06L5 8.28 2 5.357l4.146-.602L8 1z"/>
                    } @else {
                      <path d="M8 1l1.854 3.755 4.146.602-3 2.924.708 4.128L8 10.35l-3.708 2.06L5 8.28 2 5.357l4.146-.602L8 1z"/>
                    }
                  </svg>
                }
              </div>
              <span class="rating-value">{{ provider.rating.toFixed(1) }}</span>
              <span class="review-count">({{ provider.reviewCount }} reviews)</span>
              @if (provider.acceptingNewPatients) {
                <span class="accepting-badge accepting-badge-inline">
                  <i class="pi pi-check-circle"></i>
                  Accepting New Patients
                </span>
              }
            </div>

            <!-- Location -->
            <div class="detail-location">
              <i class="pi pi-map-marker"></i>
              <div>
                <div class="location-name">{{ provider.locationName }}</div>
                <div class="location-address">{{ provider.locationAddress }}</div>
                <div class="location-distance">{{ provider.distance }} miles away &bull; {{ provider.phone }}</div>
              </div>
            </div>

            <!-- Scrollable Detail Body -->
            <div class="detail-body">

              <!-- Bio -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-info-circle"></i>
                  About
                </h3>
                <p class="detail-bio">{{ provider.bio }}</p>
              </div>

              <!-- Education -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-book"></i>
                  Education & Training
                </h3>
                <ul class="detail-list">
                  @for (edu of provider.education; track $index) {
                    <li class="detail-list-item">
                      <i class="pi pi-angle-right detail-list-bullet"></i>
                      {{ edu }}
                    </li>
                  }
                </ul>
              </div>

              <!-- Certifications -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-verified"></i>
                  Board Certifications
                </h3>
                <div class="cert-tags">
                  @for (cert of provider.certifications; track $index) {
                    <span class="cert-tag">
                      <i class="pi pi-shield-check"></i>
                      {{ cert }}
                    </span>
                  }
                </div>
              </div>

              <!-- Languages -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-globe"></i>
                  Languages Spoken
                </h3>
                <div class="lang-tags">
                  @for (lang of provider.languages; track lang) {
                    <span class="lang-tag">{{ lang }}</span>
                  }
                </div>
              </div>

              <!-- Insurance -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-id-card"></i>
                  Insurance Accepted
                </h3>
                <div class="insurance-tags">
                  @for (ins of provider.insuranceAccepted; track ins) {
                    <span class="insurance-tag">
                      <i class="pi pi-check"></i>
                      {{ ins }}
                    </span>
                  }
                </div>
              </div>

              <!-- Availability Calendar Preview -->
              <div class="detail-section">
                <h3 class="detail-section-title">
                  <i class="pi pi-calendar"></i>
                  Next Available Appointments
                </h3>
                <div class="availability-grid">
                  @for (avail of provider.availability; track avail.date) {
                    <div class="avail-column">
                      <div class="avail-date-header">
                        <div class="avail-day">{{ formatDay(avail.date) }}</div>
                        <div class="avail-month-day">{{ formatMonthDay(avail.date) }}</div>
                      </div>
                      <div class="avail-slots">
                        @for (slot of avail.slots; track slot) {
                          <button class="slot-btn" (click)="onBookSlot(provider, avail.date, slot)">
                            {{ slot }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>

            <!-- Panel Footer CTA -->
            <div class="detail-footer">
              <button
                class="book-cta-btn"
                [disabled]="!provider.acceptingNewPatients"
                (click)="onBook($event, provider)"
              >
                <i class="pi pi-calendar-plus"></i>
                Book Appointment with Dr. {{ provider.lastName }}
              </button>
              @if (!provider.acceptingNewPatients) {
                <p class="not-accepting-note">
                  <i class="pi pi-info-circle"></i>
                  This provider is not currently accepting new patients. Check back later or contact the office directly.
                </p>
              }
            </div>

          </div>
        }

      </div>

    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .providers-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title {
      margin: 0 0 0.2rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .page-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .provider-count-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--teal-50, #f0fdfa);
      color: var(--teal-700);
      border: 1px solid var(--teal-200, #99f6e4);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    /* ===== Search & Filter Bar ===== */
    .search-filter-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-wrapper {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.75rem 0.75rem 2.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-card);
      color: var(--text-color);
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .search-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 20, 184, 166), 0.12);
    }

    .search-input::placeholder {
      color: var(--text-color-secondary);
    }

    .search-clear {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      font-size: 0.85rem;
      padding: 0.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .search-clear:hover {
      color: var(--text-color);
    }

    .sort-wrapper {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--surface-100);
      border-radius: 10px;
      padding: 4px;
      flex-shrink: 0;
    }

    .sort-label {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      padding: 0 0.5rem;
      white-space: nowrap;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.4rem 0.875rem;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .sort-btn.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      font-weight: 600;
    }

    .sort-btn:hover:not(.active) {
      color: var(--text-color);
    }

    /* ===== Specialty Chips ===== */
    .specialty-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .specialty-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.4rem 0.875rem;
      border: 1.5px solid var(--surface-border);
      border-radius: 20px;
      background: var(--surface-card);
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .specialty-chip:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--primary-50);
    }

    .specialty-chip.active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
      font-weight: 600;
    }

    /* ===== Active Filters ===== */
    .active-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      padding: 0.625rem 1rem;
      background: var(--surface-50, var(--surface-ground));
      border: 1px solid var(--surface-border);
      border-radius: 8px;
    }

    .active-filters-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .filter-tag {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-200, #99f6e4);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--primary-700);
    }

    .filter-tag i {
      font-size: 0.7rem;
    }

    .filter-tag-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary-500);
      font-size: 0.65rem;
      padding: 0;
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }

    .filter-tag-remove:hover {
      color: var(--primary-800);
    }

    .clear-all-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary-color);
      font-size: 0.78rem;
      font-weight: 600;
      font-family: inherit;
      margin-left: auto;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .clear-all-btn:hover {
      background: var(--surface-hover);
    }

    /* ===== Content Layout ===== */
    .content-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      transition: grid-template-columns 0.3s ease;
    }

    .content-layout.panel-open {
      grid-template-columns: 1fr 420px;
    }

    /* ===== Provider Grid ===== */
    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    /* ===== Provider Card ===== */
    .provider-card {
      background: var(--surface-card);
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .provider-card:hover {
      border-color: var(--primary-300, #5eead4);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .provider-card.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    /* ===== Card Top Row ===== */
    .card-top {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .provider-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }

    .provider-primary-info {
      flex: 1;
      min-width: 0;
    }

    .provider-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .provider-title {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.4rem;
    }

    /* ===== Specialty Tag ===== */
    .specialty-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.625rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .specialty-internal-medicine { background: var(--blue-50, #eff6ff); color: var(--blue-700); }
    .specialty-cardiology { background: #fff1f2; color: #be123c; }
    .specialty-dermatology { background: #fdf4ff; color: #7e22ce; }
    .specialty-orthopedics { background: #fff7ed; color: #c2410c; }
    .specialty-pediatrics { background: var(--green-50, #f0fdf4); color: var(--green-700); }
    .specialty-endocrinology { background: #f0f9ff; color: #0369a1; }
    .specialty-neurology { background: #fefce8; color: #92400e; }
    .specialty-ob-gyn { background: #fdf2f8; color: #9d174d; }

    /* ===== Rating ===== */
    .rating-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .stars {
      display: flex;
      gap: 1px;
    }

    .star {
      width: 14px;
      height: 14px;
      color: var(--surface-300, #cbd5e1);
      fill: var(--surface-300, #cbd5e1);
    }

    .star.filled {
      color: #f59e0b;
      fill: #f59e0b;
    }

    .star.half {
      color: #f59e0b;
    }

    .star-lg {
      width: 17px;
      height: 17px;
    }

    .rating-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .review-count {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* ===== Card Meta ===== */
    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .meta-icon {
      font-size: 0.8rem;
      width: 14px;
      text-align: center;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    /* ===== Card Footer ===== */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-top: 0.625rem;
      border-top: 1px solid var(--surface-border);
      flex-wrap: wrap;
    }

    .accepting-badge {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--green-700);
      background: var(--green-50, #f0fdf4);
      border: 1px solid var(--green-200, #bbf7d0);
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
    }

    .accepting-badge-inline {
      margin-left: auto;
    }

    .not-accepting-badge {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .card-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1.5px solid transparent;
    }

    .card-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .card-btn-outline {
      background: transparent;
      border-color: var(--surface-border);
      color: var(--text-color-secondary);
    }

    .card-btn-outline:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--primary-50);
    }

    .card-btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .card-btn-primary:hover:not(:disabled) {
      background: var(--primary-700);
      border-color: var(--primary-700);
    }

    /* ===== Empty State ===== */
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: var(--surface-card);
      border: 1px dashed var(--surface-border);
      border-radius: 16px;
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--surface-ground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--text-color-secondary);
      margin-bottom: 1.25rem;
    }

    .empty-title {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .empty-subtitle {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      max-width: 360px;
    }

    .empty-action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.5rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
    }

    .empty-action-btn:hover {
      background: var(--primary-700);
    }

    /* ===== Detail Panel ===== */
    .detail-panel {
      background: var(--surface-card);
      border: 1.5px solid var(--surface-border);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 1rem;
      max-height: calc(100vh - 200px);
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    /* ===== Detail Panel Header ===== */
    .detail-panel-header {
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      position: relative;
      flex-shrink: 0;
    }

    .panel-close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      cursor: pointer;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: all 0.15s ease;
    }

    .panel-close-btn:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .detail-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }

    .detail-name-block {
      flex: 1;
      min-width: 0;
      padding-right: 2.5rem;
    }

    .detail-name {
      margin: 0 0 0.15rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .detail-title {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.5rem;
    }

    .detail-specialty {
      margin-top: 0.25rem;
    }

    /* ===== Detail Rating ===== */
    .detail-rating-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    /* ===== Detail Location ===== */
    .detail-location {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      align-items: flex-start;
      flex-shrink: 0;
    }

    .detail-location > i {
      color: var(--primary-color);
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .location-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.125rem;
    }

    .location-address {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.125rem;
    }

    .location-distance {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* ===== Detail Body ===== */
    .detail-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 1.25rem;
    }

    .detail-section {
      padding: 1rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .detail-section:last-child {
      border-bottom: none;
    }

    .detail-section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-section-title i {
      font-size: 0.8rem;
      color: var(--primary-color);
    }

    .detail-bio {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.7;
      color: var(--text-color-secondary);
    }

    /* ===== Detail List ===== */
    .detail-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .detail-list-item {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      font-size: 0.82rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .detail-list-bullet {
      color: var(--primary-color);
      font-size: 0.8rem;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    /* ===== Cert Tags ===== */
    .cert-tags {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .cert-tag {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.45rem 0.75rem;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }

    .cert-tag i {
      color: var(--primary-color);
      flex-shrink: 0;
      font-size: 0.8rem;
      margin-top: 0.1rem;
    }

    /* ===== Language Tags ===== */
    .lang-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .lang-tag {
      padding: 0.25rem 0.75rem;
      background: var(--blue-50, #eff6ff);
      color: var(--blue-700);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 500;
    }

    /* ===== Insurance Tags ===== */
    .insurance-tags {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .insurance-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .insurance-tag i {
      color: var(--green-600);
      font-size: 0.7rem;
    }

    /* ===== Availability Calendar ===== */
    .availability-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .avail-column {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .avail-date-header {
      text-align: center;
      padding-bottom: 0.375rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .avail-day {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
    }

    .avail-month-day {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .avail-slots {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .slot-btn {
      padding: 0.35rem 0.25rem;
      border: 1.5px solid var(--primary-200, #99f6e4);
      border-radius: 6px;
      background: var(--primary-50);
      color: var(--primary-700);
      font-size: 0.72rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
    }

    .slot-btn:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    /* ===== Detail Footer ===== */
    .detail-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    .book-cta-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
    }

    .book-cta-btn:hover:not(:disabled) {
      background: var(--primary-700);
    }

    .book-cta-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .not-accepting-note {
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      margin: 0.625rem 0 0;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .not-accepting-note i {
      flex-shrink: 0;
      margin-top: 0.1rem;
      color: var(--orange-500);
    }

    /* ===== Responsive ===== */
    @media (max-width: 1200px) {
      .content-layout.panel-open {
        grid-template-columns: 1fr 380px;
      }
    }

    @media (max-width: 960px) {
      .content-layout.panel-open {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        position: static;
        max-height: none;
        order: -1;
      }

      .providers-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .search-filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .sort-wrapper {
        justify-content: center;
      }

      .availability-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .card-footer {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-actions {
        margin-left: 0;
        width: 100%;
      }

      .card-btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class ProvidersComponent {
  readonly service = inject(ProvidersService);
  readonly specialties: Specialty[] = SPECIALTIES;

  readonly sortOptions: { label: string; value: SortBy; icon: string }[] = [
    { label: 'Distance', value: 'distance', icon: 'pi pi-map-marker' },
    { label: 'Rating', value: 'rating', icon: 'pi pi-star-fill' },
    { label: 'Name', value: 'name', icon: 'pi pi-sort-alpha-down' }
  ];

  private readonly avatarColors: string[] = [
    '#0d9488', // teal-600
    '#2563eb', // blue-600
    '#7c3aed', // violet-700
    '#db2777', // pink-600
    '#ea580c', // orange-600
    '#16a34a', // green-600
    '#0891b2', // cyan-600
    '#9333ea'  // purple-600
  ];

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.service.setSearch(input.value);
  }

  onViewProfile(event: Event, provider: Provider): void {
    event.stopPropagation();
    this.service.selectProvider(provider);
  }

  onBook(event: Event, provider: Provider): void {
    event.stopPropagation();
    if (!provider.acceptingNewPatients) return;
    this.service.selectProvider(provider);
    // In a real app this would navigate to the booking flow
  }

  onBookSlot(provider: Provider, date: string, slot: string): void {
    // In a real app this would trigger appointment booking with pre-filled data
    console.info('Booking slot:', { providerId: provider.id, date, slot });
  }

  getAvatarColor(providerId: string): string {
    const index = parseInt(providerId.split('-')[1] ?? '1', 10) - 1;
    return this.avatarColors[index % this.avatarColors.length];
  }

  getSpecialtyClass(specialty: Specialty): string {
    const map: Record<Specialty, string> = {
      'All': 'internal-medicine',
      'Internal Medicine': 'internal-medicine',
      'Cardiology': 'cardiology',
      'Dermatology': 'dermatology',
      'Orthopedics': 'orthopedics',
      'Pediatrics': 'pediatrics',
      'Endocrinology': 'endocrinology',
      'Neurology': 'neurology',
      'OB/GYN': 'ob-gyn'
    };
    return map[specialty] ?? 'internal-medicine';
  }

  getSpecialtyIcon(specialty: Specialty | string): string {
    const map: Record<string, string> = {
      'All': 'pi pi-th-large',
      'Internal Medicine': 'pi pi-heart',
      'Cardiology': 'pi pi-heart-fill',
      'Dermatology': 'pi pi-sun',
      'Orthopedics': 'pi pi-bolt',
      'Pediatrics': 'pi pi-star',
      'Endocrinology': 'pi pi-chart-line',
      'Neurology': 'pi pi-spin pi-cog',
      'OB/GYN': 'pi pi-user'
    };
    return map[specialty] ?? 'pi pi-circle';
  }

  getStars(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('full');
      } else if (rating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  formatDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatMonthDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
