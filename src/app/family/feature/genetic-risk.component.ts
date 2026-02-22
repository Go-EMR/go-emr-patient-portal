// =============================================================================
// Hereditary Risk Dashboard Component — Task 16
// Route: /health/genetic-risk
// Risk cards grid + Punnett square + completeness prompts
// =============================================================================

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';

import { FamilyService } from '../data-access/family.service';
import { RulesetService } from '../data-access/ruleset.service';
import { RiskCalculationService } from '../data-access/risk-calculation.service';
import { HeredityRiskCard } from '../data-access/family.models';
import { calculateCompleteness } from '../utils/completeness.util';
import { CompletenessTrackerComponent } from '../ui/completeness-tracker.component';

type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';
type RiskCountry = 'US' | 'IN' | 'AU' | 'RO';

// Punnett square cell type
interface PunnettCell {
  label: string;
  cssClass: string;
}

@Component({
  selector: 'app-genetic-risk',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ButtonModule,
    DividerModule,
    AccordionModule,
    MessageModule,
    ProgressBarModule,
    CompletenessTrackerComponent,
  ],
  template: `
    <div class="gr-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon"><i class="pi pi-chart-pie"></i></div>
          <div>
            <h1 class="page-title">Hereditary Risk Dashboard</h1>
            <p class="page-subtitle">Understand your family's inherited health risks and personalised screening guidance</p>
          </div>
        </div>
        <div class="jurisdiction-badge">
          <i class="pi pi-map-marker"></i>
          Jurisdiction: <strong>{{ jurisdiction() }}</strong>
        </div>
      </div>

      <!-- Summary bar -->
      <div class="risk-summary">
        <div class="summary-stat" [class.stat-danger]="highCount() > 0">
          <span class="ss-val">{{ highCount() }}</span>
          <span class="ss-lbl">High Risk</span>
        </div>
        <div class="summary-stat" [class.stat-warn]="moderateCount() > 0">
          <span class="ss-val">{{ moderateCount() }}</span>
          <span class="ss-lbl">Moderate Risk</span>
        </div>
        <div class="summary-stat">
          <span class="ss-val">{{ lowCount() }}</span>
          <span class="ss-lbl">Low Risk</span>
        </div>
        <div class="summary-stat">
          <span class="ss-val">{{ riskCards().length }}</span>
          <span class="ss-lbl">Conditions Tracked</span>
        </div>
      </div>

      <!-- Main layout: risk cards + right panel -->
      <div class="gr-layout">

        <!-- Risk Cards Grid -->
        <div class="cards-area">
          <div class="risk-grid">
            @for (card of riskCards(); track card.conditionName) {
              <div class="risk-card" [class]="'risk-' + card.riskLevel">
                <div class="rc-header">
                  <h3 class="rc-title">{{ card.conditionName }}</h3>
                  <p-tag
                    [value]="riskLabel(card.riskLevel)"
                    [severity]="riskSeverity(card.riskLevel)"
                  ></p-tag>
                </div>

                @if (card.riskPercentage !== undefined && card.riskLevel !== 'low') {
                  <div class="rc-bar">
                    <p-progressBar
                      [value]="card.riskPercentage"
                      [showValue]="false"
                      [styleClass]="'risk-bar-' + card.riskLevel"
                    ></p-progressBar>
                    <span class="rc-pct">~{{ card.riskPercentage }}% lifetime</span>
                  </div>
                }

                <p class="rc-summary">{{ card.summary }}</p>

                @if (card.affectedRelatives.length > 0) {
                  <div class="rc-relatives">
                    <span class="rc-relatives-label">Affected relatives:</span>
                    @for (rel of card.affectedRelatives; track rel) {
                      <span class="rel-chip">{{ rel }}</span>
                    }
                  </div>
                }

                <!-- Expandable details -->
                <p-accordion styleClass="rc-accordion">
                  <p-accordionTab header="See Details">
                    <div class="rc-details">
                      <div class="detail-row">
                        <span class="detail-label">Inheritance:</span>
                        <span class="detail-val">{{ card.inheritancePattern }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Screening:</span>
                        <span class="detail-val">{{ card.screeningRecommendation }}</span>
                      </div>
                      @if (card.countrySpecificNotes) {
                        <div class="detail-row">
                          <span class="detail-label">{{ jurisdiction() }} Note:</span>
                          <span class="detail-val">{{ card.countrySpecificNotes[jurisdiction()] }}</span>
                        </div>
                      }
                    </div>
                  </p-accordionTab>
                </p-accordion>

                <p-button
                  label="Talk to Your Doctor"
                  icon="pi pi-comments"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  styleClass="rc-cta"
                  (onClick)="goToMessages()"
                ></p-button>
              </div>
            }
          </div>

          <!-- Punnett Square Section -->
          @if (showPunnettSquare()) {
            <div class="punnett-section">
              <h2 class="punnett-title">
                <i class="pi pi-table"></i>
                Autosomal Recessive Inheritance — Carrier × Carrier
              </h2>
              <p class="punnett-desc">
                When both parents are carriers (e.g. thalassaemia, cystic fibrosis), each pregnancy has the following outcome probabilities:
              </p>
              <div class="punnett-grid">
                <!-- Header row -->
                <div class="punnett-cell punnett-header"></div>
                <div class="punnett-cell punnett-header">
                  <span class="allele carrier-allele">N</span>
                  <span class="allele recessive-allele">n</span>
                </div>
                <div class="punnett-cell punnett-header">
                  <span class="allele carrier-allele">N</span>
                  <span class="allele recessive-allele">n</span>
                </div>

                <!-- Row header parent 1 allele 1 -->
                <div class="punnett-cell punnett-header">
                  <span class="allele carrier-allele">N</span>
                </div>
                <div class="punnett-cell unaffected-cell">
                  <span class="combo"><span class="allele carrier-allele">N</span><span class="allele carrier-allele">N</span></span>
                  <span class="combo-label">Unaffected (25%)</span>
                </div>
                <div class="punnett-cell carrier-cell">
                  <span class="combo"><span class="allele carrier-allele">N</span><span class="allele recessive-allele">n</span></span>
                  <span class="combo-label">Carrier (25%)</span>
                </div>

                <!-- Row header parent 1 allele 2 -->
                <div class="punnett-cell punnett-header">
                  <span class="allele recessive-allele">n</span>
                </div>
                <div class="punnett-cell carrier-cell">
                  <span class="combo"><span class="allele recessive-allele">n</span><span class="allele carrier-allele">N</span></span>
                  <span class="combo-label">Carrier (25%)</span>
                </div>
                <div class="punnett-cell affected-cell">
                  <span class="combo"><span class="allele recessive-allele">n</span><span class="allele recessive-allele">n</span></span>
                  <span class="combo-label">Affected (25%)</span>
                </div>
              </div>

              <div class="punnett-legend">
                <div class="pl-item"><span class="pl-swatch unaffected-swatch"></span> 25% Unaffected (NN)</div>
                <div class="pl-item"><span class="pl-swatch carrier-swatch"></span> 50% Carrier (Nn)</div>
                <div class="pl-item"><span class="pl-swatch affected-swatch"></span> 25% Affected (nn)</div>
              </div>
            </div>
          }
        </div>

        <!-- Right panel: completeness + missing prompts -->
        <div class="right-panel">
          <app-completeness-tracker
            [members]="familyService.humanMembers()"
          ></app-completeness-tracker>

          <!-- Missing relatives prompts -->
          <div class="missing-section">
            <h3 class="missing-title">Improve Your Risk Picture</h3>
            @for (missing of missingRelatives(); track missing) {
              <div class="missing-prompt">
                <i class="pi pi-plus-circle"></i>
                <span>Add <strong>{{ missing }}</strong> health history</span>
                <p-button
                  icon="pi pi-arrow-right"
                  severity="secondary"
                  [text]="true"
                  size="small"
                  (onClick)="goToFamilyHistory()"
                ></p-button>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Data disclaimer -->
      <div class="disclaimer">
        <i class="pi pi-info-circle"></i>
        <span>
          Risk estimates are based on family history data and published population statistics. They are indicative only
          and do not constitute a clinical diagnosis. Always discuss your family health history with a qualified healthcare
          provider or genetic counsellor before making health decisions.
        </span>
      </div>
    </div>
  `,
  styles: [`
    .gr-page {
      max-width: 1300px;
      margin: 0 auto;
      padding-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Page header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    .jurisdiction-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.825rem;
      color: var(--text-color-secondary);
      background: var(--surface-100);
      border: 1px solid var(--surface-border);
      border-radius: 20px;
      padding: 0.375rem 0.875rem;
    }

    /* Summary stats */
    .risk-summary {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .summary-stat {
      flex: 1;
      min-width: 120px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem 1.25rem;
      text-align: center;
    }

    .summary-stat.stat-danger { border-color: var(--red-300); background: var(--red-50, #fff1f2); }
    .summary-stat.stat-warn { border-color: var(--orange-300); background: var(--orange-50, #fff7ed); }

    .ss-val { display: block; font-size: 2rem; font-weight: 800; color: var(--text-color); }
    .ss-lbl { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }

    .summary-stat.stat-danger .ss-val { color: var(--red-600); }
    .summary-stat.stat-warn .ss-val { color: var(--orange-600); }

    /* Main layout */
    .gr-layout {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 1.25rem;
      align-items: start;
    }

    /* Risk cards grid: 3 cols desktop, 2 tablet, 1 mobile */
    .risk-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    /* Individual risk card */
    .risk-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
    }

    .risk-card.risk-high {
      border-top: 3px solid var(--red-500);
    }

    .risk-card.risk-moderate {
      border-top: 3px solid var(--orange-500);
    }

    .risk-card.risk-low {
      border-top: 3px solid var(--green-500);
    }

    .risk-card.risk-unknown {
      border-top: 3px solid var(--surface-400);
    }

    .rc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .rc-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .rc-bar {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .rc-pct {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      text-align: right;
    }

    :host ::ng-deep .risk-bar-high .p-progressbar-value { background: var(--red-500); }
    :host ::ng-deep .risk-bar-moderate .p-progressbar-value { background: var(--orange-500); }

    .rc-summary {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .rc-relatives {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      align-items: center;
    }

    .rc-relatives-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .rel-chip {
      font-size: 0.72rem;
      background: var(--surface-100);
      border: 1px solid var(--surface-300);
      border-radius: 10px;
      padding: 1px 6px;
      color: var(--text-color);
    }

    :host ::ng-deep .rc-accordion .p-accordion-header-link {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      background: var(--surface-50) !important;
    }

    :host ::ng-deep .rc-accordion .p-accordion-content {
      padding: 0.75rem;
    }

    .rc-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      gap: 0.5rem;
      font-size: 0.78rem;
    }

    .detail-label {
      font-weight: 700;
      color: var(--text-color-secondary);
      flex-shrink: 0;
      min-width: 80px;
    }

    .detail-val {
      color: var(--text-color);
      line-height: 1.5;
    }

    :host ::ng-deep .rc-cta {
      align-self: flex-start;
      font-size: 0.8rem;
    }

    /* Punnett square */
    .punnett-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem;
    }

    .punnett-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .punnett-title i { color: var(--primary-color); }

    .punnett-desc {
      font-size: 0.82rem;
      color: var(--text-color-secondary);
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .punnett-grid {
      display: grid;
      grid-template-columns: 60px 1fr 1fr;
      grid-template-rows: 60px 1fr 1fr;
      gap: 4px;
      max-width: 340px;
    }

    .punnett-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 0.5rem;
      gap: 0.25rem;
    }

    .punnett-header {
      background: var(--surface-100);
      border: 1px solid var(--surface-border);
    }

    .unaffected-cell { background: var(--green-50, #f0fdf4); border: 2px solid var(--green-300); }
    .carrier-cell    { background: var(--yellow-50, #fefce8); border: 2px solid var(--yellow-400); }
    .affected-cell   { background: var(--red-50, #fff1f2);    border: 2px solid var(--red-400);    }

    .allele {
      font-size: 1.1rem;
      font-weight: 800;
      font-family: serif;
    }

    .carrier-allele  { color: var(--green-700); }
    .recessive-allele { color: var(--red-600); }

    .combo {
      display: flex;
      gap: 2px;
    }

    .combo-label {
      font-size: 0.65rem;
      color: var(--text-color-secondary);
      text-align: center;
      line-height: 1.2;
    }

    .punnett-legend {
      display: flex;
      gap: 1.25rem;
      margin-top: 0.875rem;
      flex-wrap: wrap;
    }

    .pl-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .pl-swatch {
      width: 14px; height: 14px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .unaffected-swatch { background: var(--green-200); border: 1.5px solid var(--green-400); }
    .carrier-swatch    { background: var(--yellow-200); border: 1.5px solid var(--yellow-500); }
    .affected-swatch   { background: var(--red-200); border: 1.5px solid var(--red-400); }

    /* Right panel */
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Missing relatives */
    .missing-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
    }

    .missing-title {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      margin: 0 0 0.75rem;
    }

    .missing-prompt {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.82rem;
      color: var(--text-color);
    }

    .missing-prompt:last-child { border-bottom: none; }

    .missing-prompt i { color: var(--orange-500); flex-shrink: 0; }

    .missing-prompt span { flex: 1; }

    /* Disclaimer */
    .disclaimer {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1.125rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .disclaimer i { color: var(--blue-500); flex-shrink: 0; margin-top: 1px; }

    /* Responsive */
    @media (max-width: 1100px) {
      .risk-grid { grid-template-columns: repeat(2, 1fr); }
      .gr-layout { grid-template-columns: 1fr 220px; }
    }

    @media (max-width: 768px) {
      .risk-grid { grid-template-columns: 1fr; }
      .gr-layout { grid-template-columns: 1fr; }
      .right-panel { display: none; }
    }

    @media (max-width: 480px) {
      .risk-summary { flex-direction: column; }
    }
  `],
})
export class GeneticRiskComponent {
  readonly familyService = inject(FamilyService);
  private readonly rulesetService = inject(RulesetService);
  private readonly riskService = inject(RiskCalculationService);
  private readonly router = inject(Router);

  readonly jurisdiction = computed<RiskCountry>(
    () => this.rulesetService.jurisdiction().country as RiskCountry
  );

  readonly riskCards = computed<HeredityRiskCard[]>(() =>
    this.riskService.computeRiskCards(this.jurisdiction())
  );

  readonly highCount     = computed(() => this.riskCards().filter(c => c.riskLevel === 'high').length);
  readonly moderateCount = computed(() => this.riskCards().filter(c => c.riskLevel === 'moderate').length);
  readonly lowCount      = computed(() => this.riskCards().filter(c => c.riskLevel === 'low').length);

  // Show Punnett square when both parents have thalassaemia/carrier status
  readonly showPunnettSquare = computed(() => {
    const parents = this.familyService.members().filter(m => m.relationship === 'parent');
    const thalCarriers = parents.filter(p =>
      p.conditions.some(c =>
        c.conditionName.toLowerCase().includes('thalassaemia') ||
        c.conditionName.toLowerCase().includes('thalassemia') ||
        c.conditionName.toLowerCase().includes('carrier')
      )
    );
    return thalCarriers.length >= 2;
  });

  // Missing relatives for prompts
  readonly missingRelatives = computed<string[]>(() => {
    const result = calculateCompleteness(this.familyService.humanMembers());
    return result.items
      .filter(i => i.status === 'missing' || i.status === 'partial')
      .map(i => i.label)
      .slice(0, 5);
  });

  riskLabel(level: RiskLevel): string {
    const map: Record<RiskLevel, string> = {
      high:     'High Risk',
      moderate: 'Moderate',
      low:      'Low Risk',
      unknown:  'Unknown',
    };
    return map[level];
  }

  riskSeverity(level: RiskLevel): 'danger' | 'warn' | 'success' | 'secondary' {
    if (level === 'high')     return 'danger';
    if (level === 'moderate') return 'warn';
    if (level === 'low')      return 'success';
    return 'secondary';
  }

  goToMessages(): void {
    this.router.navigate(['/messages']);
  }

  goToFamilyHistory(): void {
    this.router.navigate(['/health/family-history']);
  }
}
