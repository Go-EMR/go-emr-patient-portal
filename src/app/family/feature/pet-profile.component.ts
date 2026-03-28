// =============================================================================
// Pet Profile Component — Task 12
// Route: /family/pets/:id
// Full 7-tab profile for a family pet
// =============================================================================

import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';

import { FamilyService } from '../data-access/family.service';
import { PetProfile, PetWeightEntry } from '../data-access/family.models';

// SVG chart constants
const CW = 520;
const CH = 200;
const PL = 48;
const PR = 20;
const PT = 16;
const PB = 40;

@Component({
  selector: 'app-pet-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TabsModule,
    TableModule,
    TagModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    MessageModule,
    CheckboxModule,
    DividerModule,
    InputTextModule,
    DatePickerModule,
  ],
  template: `
    <div class="pet-profile-page">
      <!-- Back link -->
      <div class="breadcrumb">
        <a routerLink="/family" class="back-link">
          <i class="pi pi-arrow-left"></i>
          Back to Family
        </a>
      </div>

      @if (pet(); as p) {
        <!-- Page header -->
        <div class="page-header">
          <div class="pet-avatar-wrap">
            <p-avatar
              [label]="p.name[0]"
              size="xlarge"
              shape="circle"
              [style]="{ background: p.avatarColor, color: '#fff', fontSize: '1.75rem' }"
            ></p-avatar>
            <span class="species-badge">{{ p.species | titlecase }}</span>
          </div>
          <div class="header-info">
            <h1 class="pet-name">{{ p.name }}</h1>
            <p class="pet-meta">
              {{ p.breed ?? 'Unknown breed' }}
              @if (p.dateOfBirth) {
                &nbsp;&bull;&nbsp;{{ calcAge(p.dateOfBirth) }} old
              }
              @if (p.weight) {
                &nbsp;&bull;&nbsp;{{ p.weight }} {{ p.weightUnit }}
              }
            </p>
          </div>
        </div>

        <!-- 7-tab view -->
        <p-tabs [value]="0">
          <p-tablist>
            <p-tab [value]="0">Overview</p-tab>
            <p-tab [value]="1">Vaccinations</p-tab>
            <p-tab [value]="2">Medications</p-tab>
            <p-tab [value]="3">Allergies</p-tab>
            <p-tab [value]="4">Weight Log</p-tab>
            <p-tab [value]="5">Zoonotic Flags</p-tab>
            <p-tab [value]="6">Vet Visits</p-tab>
          </p-tablist>
          <p-tabpanels>

            <!-- PANEL 0: Overview -->
            <p-tabpanel [value]="0">
              <div class="overview-grid">
                <p-card>
                  <ng-template pTemplate="header">
                    <div class="card-hd"><i class="pi pi-info-circle"></i> Basic Information</div>
                  </ng-template>
                  <div class="info-rows">
                    <div class="info-row"><span class="info-lbl">Name</span><span>{{ p.name }}</span></div>
                    <div class="info-row"><span class="info-lbl">Species</span><span>{{ p.species | titlecase }}</span></div>
                    <div class="info-row"><span class="info-lbl">Breed</span><span>{{ p.breed ?? '—' }}</span></div>
                    <div class="info-row">
                      <span class="info-lbl">Date of Birth</span>
                      <span>{{ p.dateOfBirth ? (p.dateOfBirth | date:'mediumDate') : '—' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-lbl">Age</span>
                      <span>{{ p.dateOfBirth ? calcAge(p.dateOfBirth) : '—' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-lbl">Weight</span>
                      <span>{{ p.weight ? p.weight + ' ' + p.weightUnit : '—' }}</span>
                    </div>
                  </div>
                </p-card>

                <p-card>
                  <ng-template pTemplate="header">
                    <div class="card-hd"><i class="pi pi-shield"></i> Quick Stats</div>
                  </ng-template>
                  <div class="stat-grid">
                    <div class="stat-box">
                      <span class="stat-val">{{ p.vaccinations.length }}</span>
                      <span class="stat-lbl">Vaccinations</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-val">{{ p.medications.length }}</span>
                      <span class="stat-lbl">Medications</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-val">{{ p.allergies.length }}</span>
                      <span class="stat-lbl">Allergies</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-val">{{ p.vetVisits.length }}</span>
                      <span class="stat-lbl">Vet Visits</span>
                    </div>
                  </div>
                </p-card>
              </div>
            </p-tabpanel>

            <!-- PANEL 1: Vaccinations -->
            <p-tabpanel [value]="1">
              <div class="tab-actions">
                <p-button label="Add Vaccination" icon="pi pi-plus" size="small" (onClick)="addVaccination()"></p-button>
              </div>
              <p-table [value]="p.vaccinations" [stripedRows]="true" [tableStyle]="{ 'min-width': '50rem' }">
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="vaccineName">Vaccine <p-sortIcon field="vaccineName"></p-sortIcon></th>
                    <th pSortableColumn="administeredDate">Date <p-sortIcon field="administeredDate"></p-sortIcon></th>
                    <th pSortableColumn="nextDueDate">Next Due <p-sortIcon field="nextDueDate"></p-sortIcon></th>
                    <th>Veterinarian</th>
                    <th>Batch #</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-vax>
                  <tr>
                    <td class="font-semibold">{{ vax.vaccineName }}</td>
                    <td>{{ vax.administeredDate | date:'mediumDate' }}</td>
                    <td>
                      @if (vax.nextDueDate) {
                        <span [class]="isDue(vax.nextDueDate) ? 'due-soon' : ''">
                          {{ vax.nextDueDate | date:'mediumDate' }}
                        </span>
                      } @else { — }
                    </td>
                    <td>{{ vax.veterinarian }}</td>
                    <td class="mono">{{ vax.batchNumber ?? '—' }}</td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="empty-cell">No vaccinations recorded</td></tr>
                </ng-template>
              </p-table>
            </p-tabpanel>

            <!-- PANEL 2: Medications -->
            <p-tabpanel [value]="2">
              <p-table [value]="p.medications" [stripedRows]="true" [tableStyle]="{ 'min-width': '50rem' }">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Status</th>
                    <th>Prescribed By</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-med>
                  <tr>
                    <td class="font-semibold">{{ med.medicationName }}</td>
                    <td>{{ med.dosage }}</td>
                    <td>{{ med.frequency }}</td>
                    <td>
                      <p-tag
                        [value]="med.status | titlecase"
                        [severity]="medStatusSeverity(med.status)"
                      ></p-tag>
                    </td>
                    <td>{{ med.prescribedBy }}</td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="empty-cell">No medications recorded</td></tr>
                </ng-template>
              </p-table>
            </p-tabpanel>

            <!-- PANEL 3: Allergies -->
            <p-tabpanel [value]="3">
              <div class="allergies-section">
                @if (p.allergies.length === 0) {
                  <p class="empty-text">No known allergies recorded.</p>
                } @else {
                  @for (allergy of p.allergies; track allergy.id) {
                    <div class="allergy-card">
                      <p-tag
                        [value]="allergy.severity | titlecase"
                        [severity]="allergySeverity(allergy.severity)"
                        styleClass="severity-tag"
                      ></p-tag>
                      <div class="allergy-info">
                        <span class="allergy-allergen">{{ allergy.allergen }}</span>
                        <span class="allergy-reaction">{{ allergy.reaction }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            </p-tabpanel>

            <!-- PANEL 4: Weight Log -->
            <p-tabpanel [value]="4">
              @if (p.weightHistory.length > 1) {
                <div class="chart-wrap">
                  <svg
                    class="weight-chart"
                    [attr.viewBox]="'0 0 ' + CW + ' ' + CH"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <!-- Grid lines + Y-axis labels -->
                    @for (grid of buildWeightGrid(p.weightHistory); track grid.y) {
                      <line
                        [attr.x1]="PL" [attr.y1]="grid.y"
                        [attr.x2]="CW - PR" [attr.y2]="grid.y"
                        stroke="var(--surface-border)" stroke-width="1" stroke-dasharray="3 4"
                      />
                      <text
                        [attr.x]="PL - 6" [attr.y]="grid.y + 4"
                        font-size="10" fill="var(--text-color-secondary)"
                        text-anchor="end" font-family="inherit"
                      >{{ grid.label }}</text>
                    }

                    <!-- Polyline -->
                    <polyline
                      [attr.points]="buildWeightPolyline(p.weightHistory)"
                      fill="none"
                      stroke="var(--primary-color)"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />

                    <!-- Area fill -->
                    <polygon
                      [attr.points]="buildWeightArea(p.weightHistory)"
                      fill="var(--primary-color)"
                      fill-opacity="0.08"
                    />

                    <!-- Data point dots -->
                    @for (pt of buildWeightPoints(p.weightHistory); track pt.x) {
                      <circle
                        [attr.cx]="pt.x" [attr.cy]="pt.y" r="5"
                        fill="var(--primary-color)" stroke="white" stroke-width="2"
                      />
                      <!-- Date labels on x-axis -->
                      <text
                        [attr.x]="pt.x"
                        [attr.y]="CH - PB + 14"
                        font-size="9"
                        fill="var(--text-color-secondary)"
                        text-anchor="middle"
                        font-family="inherit"
                      >{{ pt.dateLabel }}</text>
                      <!-- Weight value above dot -->
                      <text
                        [attr.x]="pt.x"
                        [attr.y]="pt.y - 9"
                        font-size="9"
                        fill="var(--primary-700, var(--primary-color))"
                        text-anchor="middle"
                        font-family="inherit"
                        font-weight="600"
                      >{{ pt.weight }}</text>
                    }

                    <!-- Axes -->
                    <line [attr.x1]="PL" [attr.y1]="PT" [attr.x2]="PL" [attr.y2]="CH - PB"
                      stroke="var(--surface-border)" stroke-width="1.5"/>
                    <line [attr.x1]="PL" [attr.y1]="CH - PB" [attr.x2]="CW - PR" [attr.y2]="CH - PB"
                      stroke="var(--surface-border)" stroke-width="1.5"/>
                  </svg>
                  <p class="chart-unit">Weight ({{ p.weightUnit }})</p>
                </div>
              } @else {
                <p class="empty-text">Not enough data points for a chart. Add more weight entries.</p>
              }
            </p-tabpanel>

            <!-- PANEL 5: Zoonotic Flags -->
            <p-tabpanel [value]="5">
              @if (hasZoonoticRisk(p.zoonoticFlags)) {
                <p-message
                  severity="error"
                  text="Zoonotic risk detected — inform household members and consult your healthcare provider."
                  styleClass="zoonotic-alert"
                ></p-message>
              }

              <div class="zoonotic-grid">
                @for (flag of ZOONOTIC_FLAGS; track flag.key) {
                  <div class="zoonotic-item" [class.risk-active]="p.zoonoticFlags[flag.key]">
                    <p-checkbox
                      [(ngModel)]="zoonoticValues[flag.key]"
                      [binary]="true"
                      [inputId]="'z-' + flag.key"
                    ></p-checkbox>
                    <label [for]="'z-' + flag.key" class="flag-label">
                      <span class="flag-name">{{ flag.label }}</span>
                      <span class="flag-desc">{{ flag.description }}</span>
                    </label>
                    @if (p.zoonoticFlags[flag.key]) {
                      <p-tag value="Risk" severity="danger" styleClass="risk-tag"></p-tag>
                    }
                  </div>
                }
              </div>

              <p-divider></p-divider>
              <p class="zoonotic-note">
                <i class="pi pi-info-circle"></i>
                Zoonotic diseases are illnesses that can spread between animals and people.
                Maintaining vaccinations and preventive care reduces household transmission risk.
              </p>
            </p-tabpanel>

            <!-- PANEL 6: Vet Visits -->
            <p-tabpanel [value]="6">
              <p-table [value]="p.vetVisits" [stripedRows]="true" [tableStyle]="{ 'min-width': '50rem' }">
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="date">Date <p-sortIcon field="date"></p-sortIcon></th>
                    <th>Reason</th>
                    <th>Veterinarian</th>
                    <th>Clinic</th>
                    <th>Follow-up Date</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-visit>
                  <tr>
                    <td>{{ visit.date | date:'mediumDate' }}</td>
                    <td>{{ visit.reason }}</td>
                    <td>{{ visit.veterinarian }}</td>
                    <td>{{ visit.clinic }}</td>
                    <td>{{ visit.followUpDate ? (visit.followUpDate | date:'mediumDate') : '—' }}</td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="empty-cell">No vet visits recorded</td></tr>
                </ng-template>
              </p-table>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>

      } @else if (isLoading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color);"></i>
          <p>Loading pet data...</p>
        </div>
      } @else {
        <div class="not-found">
          <i class="pi pi-exclamation-triangle"></i>
          <p>Pet not found. <a routerLink="/family">Return to Family</a></p>
        </div>
      }
    </div>
  `,
  styles: [`
    .pet-profile-page {
      max-width: 1100px;
      margin: 0 auto;
      padding-bottom: 2rem;
    }

    .breadcrumb {
      margin-bottom: 1.25rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .back-link:hover { text-decoration: underline; }

    /* Page header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
    }

    .pet-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .species-badge {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-600);
      color: white;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pet-name {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-color);
    }

    .pet-meta {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    /* Overview */
    .overview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .card-hd {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      font-weight: 700;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--surface-50);
    }

    .info-lbl {
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1rem;
    }

    .stat-val {
      font-size: 2rem;
      font-weight: 800;
      color: var(--primary-color);
    }

    .stat-lbl {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Tab action row */
    .tab-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.875rem;
    }

    /* Table helpers */
    .font-semibold { font-weight: 600; }
    .mono { font-family: monospace; font-size: 0.82rem; }
    .empty-cell { text-align: center; color: var(--text-color-secondary); padding: 1.5rem; font-style: italic; }
    .due-soon { color: var(--orange-600); font-weight: 600; }

    /* Allergies */
    .allergies-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .allergy-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
    }

    .severity-tag { flex-shrink: 0; }

    .allergy-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .allergy-allergen {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .allergy-reaction {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .empty-text {
      color: var(--text-color-secondary);
      font-style: italic;
      padding: 1.5rem 0;
    }

    /* Weight chart */
    .chart-wrap {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
    }

    .weight-chart {
      width: 100%;
      height: auto;
      display: block;
    }

    .chart-unit {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      text-align: center;
      margin: 0.5rem 0 0;
    }

    /* Zoonotic */
    .zoonotic-alert {
      margin-bottom: 1rem;
    }

    .zoonotic-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .zoonotic-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      transition: background 0.15s;
    }

    .zoonotic-item.risk-active {
      border-color: var(--red-200);
      background: var(--red-50, #fff1f2);
    }

    .flag-label {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      cursor: pointer;
    }

    .flag-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .flag-desc {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .risk-tag { flex-shrink: 0; }

    .zoonotic-note {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .zoonotic-note i { color: var(--blue-500); margin-top: 1px; flex-shrink: 0; }

    /* Loading / Not found */
    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-color-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .not-found {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-color-secondary);
    }

    .not-found i { font-size: 3rem; opacity: 0.4; margin-bottom: 1rem; }

    @media (max-width: 768px) {
      .overview-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class PetProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly familyService = inject(FamilyService);

  // SVG constants exposed to template
  readonly CW = CW;
  readonly CH = CH;
  readonly PL = PL;
  readonly PR = PR;
  readonly PT = PT;
  readonly PB = PB;

  readonly ZOONOTIC_FLAGS = [
    { key: 'rabiesVaccinated',     label: 'Rabies',         description: 'Animal not vaccinated against rabies or vaccination expired' },
    { key: 'leptospirosis',        label: 'Leptospirosis',  description: 'Exposure to contaminated water or wildlife; bacterial risk' },
    { key: 'toxoplasmosis',        label: 'Toxoplasmosis',  description: 'Particularly relevant for cats; risk to pregnant household members' },
    { key: 'ringworm',             label: 'Ringworm',       description: 'Fungal skin infection transmissible to humans by contact' },
    { key: 'salmonella',           label: 'Salmonella',     description: 'Reptiles and some pets can be Salmonella carriers' },
    { key: 'psittacosis',          label: 'Psittacosis',    description: 'Chlamydial infection from birds (parrots, pigeons)' },
    { key: 'lymeDisease',          label: 'Lyme Disease',   description: 'Tick-borne; pets can bring ticks into the home' },
    { key: 'giardia',              label: 'Giardia',        description: 'Intestinal parasite transmissible via fecal-oral route' },
    { key: 'hookworm',             label: 'Hookworm',       description: 'Skin contact with contaminated soil; larval migration in humans' },
  ];

  private readonly _petId = signal<string>('');
  readonly isLoading = this.familyService.isLoading;
  readonly pet = computed<PetProfile | null>(() => {
    const id = this._petId();
    if (!id) return null;
    return this.familyService.pets().find(p => p.id === id) ?? null;
  });

  // Local mutable copy of zoonotic flags for checkboxes
  zoonoticValues: Record<string, boolean> = {};

  constructor() {
    // Re-initialize zoonotic values whenever the pet signal changes
    // (handles async GoVet data arriving after component init)
    effect(() => {
      const p = this.pet();
      if (p) {
        this.ZOONOTIC_FLAGS.forEach(f => {
          this.zoonoticValues[f.key] = !!p.zoonoticFlags[f.key];
        });
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this._petId.set(id);
  }

  calcAge(dob: Date): string {
    const now = new Date(2026, 1, 22);
    const diffMs = now.getTime() - dob.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    if (years > 0) return `${years} yr${years > 1 ? 's' : ''} ${months} mo`;
    return `${months} months`;
  }

  isDue(date: Date): boolean {
    return date <= new Date(2026, 1, 22);
  }

  medStatusSeverity(status: string): 'success' | 'info' | 'danger' | 'secondary' {
    if (status === 'active') return 'success';
    if (status === 'completed') return 'info';
    return 'secondary';
  }

  allergySeverity(severity: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (severity === 'mild') return 'success';
    if (severity === 'moderate') return 'warn';
    if (severity === 'severe') return 'danger';
    return 'secondary';
  }

  hasZoonoticRisk(flags: Record<string, boolean>): boolean {
    return this.ZOONOTIC_FLAGS.some(f => flags[f.key]);
  }

  addVaccination(): void {
    // In a full implementation this would open a dialog/sidebar
    alert('Add vaccination form would open here.');
  }

  // ── SVG Weight Chart Helpers ──────────────────────────────────────────────

  buildWeightPoints(history: PetWeightEntry[]): {
    x: number; y: number; dateLabel: string; weight: string
  }[] {
    if (history.length === 0) return [];
    const sorted = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
    const weights = sorted.map(e => e.weight);
    const minW = Math.min(...weights) * 0.92;
    const maxW = Math.max(...weights) * 1.08;
    const plotW = CW - PL - PR;
    const plotH = CH - PT - PB;

    return sorted.map((entry, i) => ({
      x: PL + (i / (sorted.length - 1)) * plotW,
      y: PT + plotH - ((entry.weight - minW) / (maxW - minW)) * plotH,
      dateLabel: entry.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      weight: entry.weight.toFixed(1),
    }));
  }

  buildWeightPolyline(history: PetWeightEntry[]): string {
    return this.buildWeightPoints(history)
      .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  }

  buildWeightArea(history: PetWeightEntry[]): string {
    const pts = this.buildWeightPoints(history);
    if (pts.length === 0) return '';
    const bottom = CH - PB;
    const linePoints = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const firstX = pts[0].x.toFixed(1);
    const lastX = pts[pts.length - 1].x.toFixed(1);
    return `${linePoints} ${lastX},${bottom} ${firstX},${bottom}`;
  }

  buildWeightGrid(history: PetWeightEntry[]): { y: number; label: string }[] {
    const weights = history.map(e => e.weight);
    const minW = Math.min(...weights) * 0.92;
    const maxW = Math.max(...weights) * 1.08;
    const plotH = CH - PT - PB;
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = minW + (i / steps) * (maxW - minW);
      const y = PT + plotH - ((val - minW) / (maxW - minW)) * plotH;
      return { y, label: val.toFixed(1) };
    });
  }
}
