import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';

interface MbsItem {
  itemNumber: string;
  description: string;
  category: string;
  scheduleFee: number;
  benefitPercent: number;
  benefit: number;
  oop: number;
}

interface MbsClaim {
  id: string;
  date: string;
  provider: string;
  itemNumber: string;
  description: string;
  charge: number;
  medicarePaid: number;
  patientCost: number;
}

@Component({
  selector: 'app-medicare-benefits',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, InputTextModule],
  template: `
    <div class="mbs-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-search"></i>
          </div>
          <div>
            <h1>Medicare Benefits Schedule (MBS)</h1>
            <p>Look up Medicare item numbers, schedule fees, and your benefit entitlements</p>
          </div>
        </div>
      </header>

      <!-- Medicare Banner -->
      <div class="medicare-banner">
        <div class="medicare-logo">
          <i class="pi pi-shield"></i>
          <span>Medicare</span>
        </div>
        <div class="medicare-text">
          <strong>Medicare Benefits Schedule</strong>
          <p>
            The MBS lists the Medicare benefits payable for medical services. For most out-of-hospital
            services, Medicare pays 85% of the Schedule Fee. For GP consultations, Medicare pays 100%
            when bulk-billed, or 85% otherwise. Out-of-pocket costs depend on what your doctor charges.
          </p>
        </div>
      </div>

      <!-- MBS Search -->
      <p-card styleClass="search-card">
        <div class="search-row">
          <div class="search-input-wrap">
            <i class="pi pi-search search-icon-field"></i>
            <input
              pInputText
              type="text"
              placeholder="Search by item number (e.g. 23) or description (e.g. GP consultation)"
              [(ngModel)]="searchQuery"
              class="search-input"
              (keyup.enter)="searchMbs()"
            />
          </div>
          <button pButton label="Search MBS" icon="pi pi-search" (click)="searchMbs()"></button>
        </div>
        @if (hasSearched()) {
          <div class="search-meta">
            Showing <strong>{{ filteredItems().length }}</strong> MBS item(s) matching "<strong>{{ lastQuery() }}</strong>"
          </div>
        }
      </p-card>

      @if (hasSearched() && filteredItems().length > 0) {
        <div class="mbs-results">
          <p-table
            [value]="filteredItems()"
            styleClass="p-datatable-sm p-datatable-striped"
            [tableStyle]="{ 'min-width': '100%' }"
          >
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 100px">Item No.</th>
                <th>Description</th>
                <th>Category</th>
                <th style="width: 120px">Schedule Fee</th>
                <th style="width: 100px">Benefit %</th>
                <th style="width: 120px">Medicare Pays</th>
                <th style="width: 130px">Est. Out-of-Pocket</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>
                  <span class="item-number">{{ item.itemNumber }}</span>
                </td>
                <td class="item-desc">{{ item.description }}</td>
                <td>
                  <span class="category-tag">{{ item.category }}</span>
                </td>
                <td class="fee-cell">\${{ item.scheduleFee.toFixed(2) }}</td>
                <td>
                  <span class="benefit-pct">{{ item.benefitPercent }}%</span>
                </td>
                <td class="benefit-cell">\${{ item.benefit.toFixed(2) }}</td>
                <td>
                  <span class="oop-cell">
                    @if (item.oop === 0) {
                      <span class="oop-zero">$0.00 (bulk-billed)</span>
                    } @else {
                      <span class="oop-amount">\${{ item.oop.toFixed(2) }}+</span>
                    }
                  </span>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <div class="mbs-note">
            <i class="pi pi-info-circle"></i>
            <span>
              Out-of-pocket costs are estimates based on the Schedule Fee. Your actual out-of-pocket
              depends on what your doctor charges above the Schedule Fee.
            </span>
          </div>
        </div>
      } @else if (hasSearched()) {
        <div class="empty-state">
          <i class="pi pi-search"></i>
          <h3>No MBS items found</h3>
          <p>Try searching by item number (e.g. "23") or service description (e.g. "GP", "specialist", "pathology").</p>
        </div>
      } @else {
        <!-- Common Items Showcase -->
        <p-card header="Common MBS Items" styleClass="common-card">
          <div class="common-items-grid">
            @for (item of commonItems(); track item.itemNumber) {
              <div class="common-item-card">
                <div class="common-item-header">
                  <span class="common-item-number">Item {{ item.itemNumber }}</span>
                  <span class="common-item-cat">{{ item.category }}</span>
                </div>
                <p class="common-item-desc">{{ item.description }}</p>
                <div class="common-item-fees">
                  <div class="fee-row">
                    <span class="fee-label">Schedule Fee</span>
                    <span class="fee-val">\${{ item.scheduleFee.toFixed(2) }}</span>
                  </div>
                  <div class="fee-row benefit">
                    <span class="fee-label">Medicare Benefit ({{ item.benefitPercent }}%)</span>
                    <span class="fee-val">\${{ item.benefit.toFixed(2) }}</span>
                  </div>
                  <div class="fee-row oop">
                    <span class="fee-label">Typical Gap</span>
                    <span class="fee-val oop-amount">\${{ item.oop.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </p-card>
      }

      <p-divider></p-divider>

      <!-- Your Claims History -->
      <p-card header="Your Recent MBS Claims" styleClass="claims-card">
        <p-table
          [value]="claimsHistory()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Date</th>
              <th>Provider</th>
              <th>Item No.</th>
              <th>Description</th>
              <th>Charged</th>
              <th>Medicare Paid</th>
              <th>Your Cost</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-claim>
            <tr>
              <td class="date-cell">{{ claim.date }}</td>
              <td class="provider-cell">{{ claim.provider }}</td>
              <td><span class="item-number">{{ claim.itemNumber }}</span></td>
              <td class="desc-cell">{{ claim.description }}</td>
              <td class="fee-cell">\${{ claim.charge.toFixed(2) }}</td>
              <td class="benefit-cell">\${{ claim.medicarePaid.toFixed(2) }}</td>
              <td>
                @if (claim.patientCost === 0) {
                  <span class="oop-zero">$0.00</span>
                } @else {
                  <span class="oop-amount">\${{ claim.patientCost.toFixed(2) }}</span>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td colspan="4" class="totals-label">Totals (last 3 claims)</td>
              <td class="fee-cell total"><strong>\${{ totalCharged().toFixed(2) }}</strong></td>
              <td class="benefit-cell total"><strong>\${{ totalMedicarePaid().toFixed(2) }}</strong></td>
              <td class="oop-amount total"><strong>\${{ totalPatientCost().toFixed(2) }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
        <div class="claims-actions">
          <button pButton label="View Full Claims History" icon="pi pi-history" class="p-button-outlined p-button-sm"></button>
          <button pButton label="Download Statement" icon="pi pi-download" class="p-button-outlined p-button-sm p-button-secondary"></button>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .mbs-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: #e3f2fd; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: #1565c0; }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .medicare-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #009c3b 0%, #005f23 100%); color: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .medicare-logo { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; flex-shrink: 0; }
    .medicare-logo i { font-size: 1.75rem; }
    .medicare-logo span { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .medicare-text strong { display: block; margin-bottom: 0.4rem; font-size: 1rem; }
    .medicare-text p { margin: 0; font-size: 0.85rem; line-height: 1.55; opacity: 0.9; }
    .search-row { display: flex; gap: 0.75rem; align-items: center; }
    .search-input-wrap { flex: 1; position: relative; }
    .search-icon-field { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-color-secondary); font-size: 0.875rem; z-index: 1; }
    .search-input { width: 100%; padding-left: 2.25rem !important; }
    .search-meta { margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .mbs-results { margin-top: 1rem; }
    .item-number { font-family: monospace; font-size: 0.9rem; font-weight: 700; background: var(--blue-50); color: var(--blue-700); padding: 0.15rem 0.5rem; border-radius: 4px; }
    .item-desc { font-size: 0.85rem; }
    .category-tag { font-size: 0.75rem; background: var(--surface-100); color: var(--text-color-secondary); padding: 0.15rem 0.5rem; border-radius: 4px; }
    .fee-cell { font-size: 0.875rem; }
    .benefit-pct { font-weight: 600; color: var(--green-700); }
    .benefit-cell { font-size: 0.875rem; color: var(--green-700); font-weight: 500; }
    .oop-zero { color: var(--green-600); font-weight: 600; font-size: 0.85rem; }
    .oop-amount { color: var(--orange-700); font-weight: 600; font-size: 0.85rem; }
    .mbs-note { display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .mbs-note i { font-size: 0.875rem; color: var(--blue-400); flex-shrink: 0; margin-top: 0.1rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; text-align: center; gap: 0.75rem; color: var(--text-color-secondary); }
    .empty-state i { font-size: 2.5rem; color: var(--surface-400); }
    .empty-state h3 { margin: 0; color: var(--text-color); }
    .empty-state p { margin: 0; max-width: 420px; font-size: 0.875rem; }
    .common-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .common-item-card { padding: 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .common-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .common-item-number { font-family: monospace; font-weight: 700; color: var(--blue-700); background: var(--blue-50); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    .common-item-cat { font-size: 0.72rem; color: var(--text-color-secondary); background: var(--surface-200); padding: 0.1rem 0.4rem; border-radius: 4px; }
    .common-item-desc { margin: 0 0 0.75rem; font-size: 0.85rem; line-height: 1.5; color: var(--text-color); }
    .common-item-fees { display: flex; flex-direction: column; gap: 0.3rem; }
    .fee-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; }
    .fee-label { color: var(--text-color-secondary); }
    .fee-val { font-weight: 500; }
    .fee-row.benefit .fee-val { color: var(--green-700); }
    .fee-row.oop .fee-val { color: var(--orange-700); }
    .date-cell, .desc-cell, .provider-cell { font-size: 0.85rem; }
    .totals-label { font-weight: 600; font-size: 0.875rem; }
    .total { font-size: 0.875rem; }
    .claims-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
    @media (max-width: 768px) {
      .search-row { flex-direction: column; }
      .common-items-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MedicareBenefitsComponent {
  searchQuery = '';
  readonly hasSearched = signal(false);
  readonly lastQuery = signal('');

  private readonly allMbsItems = signal<MbsItem[]>([
    { itemNumber: '23', description: 'Professional attendance by a GP — Level B (short consultation, < 20 min)', category: 'GP', scheduleFee: 41.40, benefitPercent: 100, benefit: 41.40, oop: 0 },
    { itemNumber: '36', description: 'Professional attendance by a GP — Level C (standard consultation, 20-40 min)', category: 'GP', scheduleFee: 80.10, benefitPercent: 100, benefit: 80.10, oop: 0 },
    { itemNumber: '44', description: 'Professional attendance by a GP — Level D (long consultation, > 40 min)', category: 'GP', scheduleFee: 116.40, benefitPercent: 100, benefit: 116.40, oop: 0 },
    { itemNumber: '104', description: 'Professional attendance by a specialist — referred, Level A (< 15 min)', category: 'Specialist', scheduleFee: 80.25, benefitPercent: 85, benefit: 68.20, oop: 12.05 },
    { itemNumber: '105', description: 'Professional attendance by a specialist — referred, Level B (15-30 min)', category: 'Specialist', scheduleFee: 156.20, benefitPercent: 85, benefit: 132.77, oop: 23.43 },
    { itemNumber: '65070', description: 'General practitioner health assessment — 45 years and over', category: 'Preventive', scheduleFee: 157.30, benefitPercent: 100, benefit: 157.30, oop: 0 },
    { itemNumber: '72817', description: 'Pathology examination — haematology group (full blood count)', category: 'Pathology', scheduleFee: 28.65, benefitPercent: 75, benefit: 21.49, oop: 7.16 },
    { itemNumber: '66596', description: 'MRI of the brain with contrast — not associated with epilepsy', category: 'Imaging', scheduleFee: 498.00, benefitPercent: 85, benefit: 423.30, oop: 74.70 }
  ]);

  readonly filteredItems = computed(() => {
    const q = this.lastQuery().toLowerCase();
    if (!q) return this.allMbsItems();
    return this.allMbsItems().filter(
      item => item.itemNumber.includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  });

  readonly commonItems = computed(() => this.allMbsItems().slice(0, 4));

  readonly claimsHistory = signal<MbsClaim[]>([
    { id: '1', date: '18 Feb 2026', provider: 'Dr. Sarah Mitchell (GoHealth)', itemNumber: '36', description: 'GP Consultation — Level C', charge: 80.10, medicarePaid: 80.10, patientCost: 0 },
    { id: '2', date: '10 Feb 2026', provider: 'Sullivan Nicolaides Pathology', itemNumber: '72817', description: 'Full Blood Count', charge: 28.65, medicarePaid: 21.49, patientCost: 7.16 },
    { id: '3', date: '20 Jan 2026', provider: 'Dr. Michael Torres (Sydney Heart)', itemNumber: '105', description: 'Cardiology Consultation', charge: 295.00, medicarePaid: 132.77, patientCost: 162.23 }
  ]);

  readonly totalCharged = computed(() => this.claimsHistory().reduce((s, c) => s + c.charge, 0));
  readonly totalMedicarePaid = computed(() => this.claimsHistory().reduce((s, c) => s + c.medicarePaid, 0));
  readonly totalPatientCost = computed(() => this.claimsHistory().reduce((s, c) => s + c.patientCost, 0));

  searchMbs(): void {
    if (this.searchQuery.trim()) {
      this.hasSearched.set(true);
      this.lastQuery.set(this.searchQuery.trim());
    }
  }
}
