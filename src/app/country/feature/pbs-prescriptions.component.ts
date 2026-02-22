import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';

interface PbsPrescription {
  id: string;
  pbsItemCode: string;
  medicationName: string;
  strength: string;
  quantity: string;
  repeatsRemaining: number;
  totalRepeats: number;
  lastDispensed: string;
  nextAvailable: string;
  prescriber: string;
  pharmacy: string;
  safetyNetContribution: number;
  isConcessional: boolean;
  status: 'Active' | 'Expired' | 'Exhausted';
}

@Component({
  selector: 'app-pbs-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, ProgressBarModule],
  template: `
    <div class="pbs-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h1>PBS Prescription Status</h1>
            <p>Pharmaceutical Benefits Scheme — Track your subsidised prescriptions and Safety Net</p>
          </div>
        </div>
      </header>

      <!-- PBS Header Banner -->
      <div class="pbs-banner">
        <div class="pbs-logo">
          <i class="pi pi-shield"></i>
          <div>
            <span class="pbs-title">Pharmaceutical Benefits Scheme</span>
            <span class="pbs-subtitle">Australian Government Department of Health</span>
          </div>
        </div>
        <div class="pbs-status-row">
          <div class="pbs-status-item">
            <span class="status-label">Status</span>
            <p-tag value="Concessional" severity="info" icon="pi pi-id-card"></p-tag>
          </div>
          <div class="pbs-status-item">
            <span class="status-label">Concession Card</span>
            <span class="status-value">Health Care Card: HCC123456789</span>
          </div>
          <div class="pbs-status-item">
            <span class="status-label">Year</span>
            <span class="status-value">2026 (Jan – Dec)</span>
          </div>
        </div>
      </div>

      <!-- Safety Net Progress -->
      <p-card styleClass="safety-net-card">
        <div class="safety-net-content">
          <div class="safety-net-header">
            <div class="sn-title-group">
              <h3>PBS Safety Net Progress</h3>
              <p-tag value="Concessional Threshold" severity="info"></p-tag>
            </div>
            <div class="sn-amount">
              <span class="sn-current">\${{ safetyNetContributed().toFixed(2) }}</span>
              <span class="sn-divider"> of </span>
              <span class="sn-threshold">\${{ safetyNetThreshold.toFixed(2) }}</span>
            </div>
          </div>
          <p-progressBar
            [value]="safetyNetPercent()"
            [showValue]="false"
            styleClass="safety-progress"
          ></p-progressBar>
          <div class="safety-net-footer">
            <span class="sn-remaining">
              <strong>\${{ safetyNetRemaining().toFixed(2) }} remaining</strong> to reach your Safety Net
            </span>
            <span class="sn-note">
              Once reached, eligible PBS medicines are free (concessional) or significantly cheaper
            </span>
          </div>
        </div>
        <div class="safety-net-info">
          <div class="sn-info-item">
            <i class="pi pi-info-circle"></i>
            <div>
              <strong>Concessional Safety Net 2026: \${{ safetyNetThreshold.toFixed(2) }}</strong>
              <p>After contributing \${{ safetyNetThreshold.toFixed(2) }} in eligible PBS co-payments, all remaining eligible PBS medicines in the calendar year are free for concessional patients and eligible family members.</p>
            </div>
          </div>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Active Prescriptions -->
      <p-card header="Active PBS Prescriptions" styleClass="prescriptions-card">
        <div class="prescriptions-list">
          @for (rx of prescriptions(); track rx.id) {
            <div class="rx-card" [class.expired]="rx.status !== 'Active'">
              <div class="rx-main">
                <div class="rx-header">
                  <div class="rx-name-row">
                    <span class="rx-name">{{ rx.medicationName }}</span>
                    <span class="rx-strength">{{ rx.strength }}</span>
                    <p-tag [value]="rx.status" [severity]="getRxSeverity(rx.status)"></p-tag>
                    @if (rx.isConcessional) {
                      <span class="concessional-tag">
                        <i class="pi pi-id-card"></i> Concessional
                      </span>
                    }
                  </div>
                  <div class="rx-pbs-row">
                    <span class="pbs-code">PBS Item: {{ rx.pbsItemCode }}</span>
                    <span class="rx-quantity">Qty: {{ rx.quantity }}</span>
                  </div>
                </div>
                <div class="rx-details">
                  <div class="rx-detail">
                    <i class="pi pi-user-md"></i>
                    <span>Dr. {{ rx.prescriber }}</span>
                  </div>
                  <div class="rx-detail">
                    <i class="pi pi-building"></i>
                    <span>{{ rx.pharmacy }}</span>
                  </div>
                  <div class="rx-detail">
                    <i class="pi pi-calendar-minus"></i>
                    <span>Last dispensed: {{ rx.lastDispensed }}</span>
                  </div>
                  <div class="rx-detail">
                    <i class="pi pi-calendar-plus"></i>
                    <span>Next available: {{ rx.nextAvailable }}</span>
                  </div>
                </div>
              </div>
              <div class="rx-repeats">
                <div class="repeats-circle">
                  <span class="repeats-num">{{ rx.repeatsRemaining }}</span>
                  <span class="repeats-label">repeats left</span>
                </div>
                <div class="repeats-bar-wrap">
                  <p-progressBar
                    [value]="getRepeatsPercent(rx)"
                    [showValue]="false"
                    styleClass="repeats-bar"
                  ></p-progressBar>
                  <span class="repeats-detail">{{ rx.repeatsRemaining }} of {{ rx.totalRepeats }} remaining</span>
                </div>
                <div class="rx-contrib">
                  <i class="pi pi-shield"></i>
                  <span>Safety Net contribution: \${{ rx.safetyNetContribution.toFixed(2) }}</span>
                </div>
                @if (rx.status === 'Active') {
                  <button pButton label="Reorder" icon="pi pi-refresh" class="p-button-outlined p-button-sm reorder-btn"></button>
                }
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About the PBS Safety Net</strong>
          <p>
            The PBS Safety Net reduces the cost of PBS medicines after you and your eligible family
            members have spent a threshold amount on PBS medicines in a calendar year. Concessional
            patients reach their Safety Net sooner. Register your Safety Net Concession Card at your
            pharmacy to ensure your contributions are counted.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pbs-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--green-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--green-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .pbs-banner { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: linear-gradient(135deg, #009c3b 0%, #005f23 100%); color: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .pbs-logo { display: flex; align-items: center; gap: 0.75rem; }
    .pbs-logo i { font-size: 1.75rem; flex-shrink: 0; }
    .pbs-title { display: block; font-weight: 700; font-size: 0.95rem; }
    .pbs-subtitle { display: block; font-size: 0.72rem; opacity: 0.85; }
    .pbs-status-row { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
    .pbs-status-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .status-label { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-value { font-size: 0.85rem; font-weight: 500; }
    .safety-net-content { margin-bottom: 1rem; }
    .safety-net-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.875rem; }
    .sn-title-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .sn-title-group h3 { margin: 0; font-size: 1rem; }
    .sn-amount { display: flex; align-items: baseline; gap: 0.25rem; }
    .sn-current { font-size: 1.5rem; font-weight: 700; color: var(--green-700); }
    .sn-divider { font-size: 0.9rem; color: var(--text-color-secondary); }
    .sn-threshold { font-size: 1rem; color: var(--text-color-secondary); }
    .safety-progress { height: 12px !important; border-radius: 6px !important; margin-bottom: 0.5rem; }
    .safety-net-footer { display: flex; flex-direction: column; gap: 0.2rem; }
    .sn-remaining { font-size: 0.875rem; }
    .sn-note { font-size: 0.8rem; color: var(--text-color-secondary); }
    .safety-net-info { padding-top: 0.875rem; border-top: 1px solid var(--surface-border); }
    .sn-info-item { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.85rem; }
    .sn-info-item i { color: var(--green-500); flex-shrink: 0; margin-top: 0.15rem; }
    .sn-info-item strong { display: block; margin-bottom: 0.2rem; }
    .sn-info-item p { margin: 0; color: var(--text-color-secondary); line-height: 1.5; }
    .prescriptions-list { display: flex; flex-direction: column; gap: 1rem; }
    .rx-card { display: flex; gap: 1rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .rx-card.expired { opacity: 0.7; }
    .rx-main { flex: 1; }
    .rx-header { margin-bottom: 0.625rem; }
    .rx-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .rx-name { font-weight: 700; font-size: 0.95rem; }
    .rx-strength { font-size: 0.82rem; color: var(--text-color-secondary); }
    .pbs-code { font-family: monospace; font-size: 0.78rem; background: var(--green-50); color: var(--green-700); padding: 0.12rem 0.45rem; border-radius: 4px; }
    .rx-pbs-row { display: flex; gap: 0.75rem; align-items: center; }
    .rx-quantity { font-size: 0.8rem; color: var(--text-color-secondary); }
    .concessional-tag { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.72rem; background: var(--blue-50); color: var(--blue-700); border: 1px solid var(--blue-200); padding: 0.1rem 0.45rem; border-radius: 12px; }
    .rx-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; }
    .rx-detail { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .rx-detail i { font-size: 0.72rem; color: var(--primary-400); flex-shrink: 0; }
    .rx-repeats { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 140px; border-left: 1px solid var(--surface-border); padding-left: 1rem; }
    .repeats-circle { display: flex; flex-direction: column; align-items: center; width: 60px; height: 60px; border-radius: 50%; background: var(--green-50); border: 2px solid var(--green-200); justify-content: center; }
    .repeats-num { font-size: 1.35rem; font-weight: 800; color: var(--green-700); line-height: 1; }
    .repeats-label { font-size: 0.58rem; color: var(--green-600); text-align: center; }
    .repeats-bar-wrap { width: 100%; display: flex; flex-direction: column; gap: 0.2rem; }
    .repeats-bar { height: 6px !important; }
    .repeats-detail { font-size: 0.72rem; color: var(--text-color-secondary); text-align: center; }
    .rx-contrib { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--green-700); }
    .rx-contrib i { font-size: 0.7rem; }
    .reorder-btn { width: 100%; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--green-800); }
    .info-banner i { font-size: 1.1rem; color: var(--green-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    @media (max-width: 640px) {
      .rx-card { flex-direction: column; }
      .rx-repeats { border-left: none; border-top: 1px solid var(--surface-border); padding-left: 0; padding-top: 0.875rem; flex-direction: row; flex-wrap: wrap; min-width: unset; width: 100%; }
      .rx-details { grid-template-columns: 1fr; }
      .safety-net-header { flex-direction: column; gap: 0.75rem; }
      .pbs-banner { flex-direction: column; }
    }
  `]
})
export class PbsPrescriptionsComponent {
  readonly safetyNetThreshold = 456.80;
  readonly safetyNetContributed = signal(284.40);
  readonly safetyNetRemaining = computed(() => Math.max(0, this.safetyNetThreshold - this.safetyNetContributed()));
  readonly safetyNetPercent = computed(() => Math.round((this.safetyNetContributed() / this.safetyNetThreshold) * 100));

  readonly prescriptions = signal<PbsPrescription[]>([
    {
      id: '1',
      pbsItemCode: '8213F',
      medicationName: 'Metformin',
      strength: '500mg tablets',
      quantity: '60 tablets',
      repeatsRemaining: 4,
      totalRepeats: 5,
      lastDispensed: '18 Feb 2026',
      nextAvailable: '18 Mar 2026',
      prescriber: 'Sarah Mitchell',
      pharmacy: 'Chemist Warehouse Bondi',
      safetyNetContribution: 7.30,
      isConcessional: true,
      status: 'Active'
    },
    {
      id: '2',
      pbsItemCode: '1649L',
      medicationName: 'Lisinopril',
      strength: '10mg tablets',
      quantity: '30 tablets',
      repeatsRemaining: 2,
      totalRepeats: 5,
      lastDispensed: '18 Feb 2026',
      nextAvailable: '20 Mar 2026',
      prescriber: 'Sarah Mitchell',
      pharmacy: 'Chemist Warehouse Bondi',
      safetyNetContribution: 7.30,
      isConcessional: true,
      status: 'Active'
    },
    {
      id: '3',
      pbsItemCode: '2527B',
      medicationName: 'Rosuvastatin',
      strength: '10mg tablets',
      quantity: '30 tablets',
      repeatsRemaining: 1,
      totalRepeats: 5,
      lastDispensed: '10 Feb 2026',
      nextAvailable: '12 Mar 2026',
      prescriber: 'Michael Torres',
      pharmacy: 'TerryWhite Chemmart Bondi Junction',
      safetyNetContribution: 7.30,
      isConcessional: true,
      status: 'Active'
    },
    {
      id: '4',
      pbsItemCode: '5990K',
      medicationName: 'Amoxicillin',
      strength: '500mg capsules',
      quantity: '21 capsules',
      repeatsRemaining: 0,
      totalRepeats: 0,
      lastDispensed: '05 Jan 2026',
      nextAvailable: 'No repeats',
      prescriber: 'Sarah Mitchell',
      pharmacy: 'Chemist Warehouse Bondi',
      safetyNetContribution: 7.30,
      isConcessional: true,
      status: 'Exhausted'
    }
  ]);

  getRxSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      Active: 'success',
      Expired: 'danger',
      Exhausted: 'warning'
    };
    return map[status] ?? 'info';
  }

  getRepeatsPercent(rx: PbsPrescription): number {
    if (rx.totalRepeats === 0) return 0;
    return Math.round((rx.repeatsRemaining / rx.totalRepeats) * 100);
  }
}
