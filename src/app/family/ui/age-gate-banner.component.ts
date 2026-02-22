import {
  Component,
  ChangeDetectionStrategy,
  Input,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AgeGateResult } from '../utils/age-gate.util';
import { RecordCategory } from '../data-access/family.models';

const CATEGORY_LABELS: Record<RecordCategory, string> = {
  appointments: 'Appointments',
  medications: 'Medications',
  'lab-results': 'Lab Results',
  immunizations: 'Immunizations',
  allergies: 'Allergies',
  'mental-health': 'Mental Health',
  reproductive: 'Reproductive Health',
  sti: 'STI / Infections',
  genetic: 'Genetic Records',
  billing: 'Billing',
};

@Component({
  selector: 'app-age-gate-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MessageModule,
    TagModule,
    DividerModule,
  ],
  template: `
    @if (shouldShow()) {
      <div class="age-gate-banner" role="alert" aria-live="polite" [attr.aria-label]="bannerAriaLabel()">
        <!-- Main warning message -->
        <div class="banner-main">
          <div class="banner-icon" aria-hidden="true">
            <i class="pi pi-clock"></i>
          </div>
          <div class="banner-content">
            <p class="banner-message">
              Access to <strong>{{ memberName }}</strong>'s records changes in
              <strong class="days-count">{{ ageGateResult.daysUntilCutoff }} day{{ ageGateResult.daysUntilCutoff !== 1 ? 's' : '' }}</strong>
              when they turn <strong>{{ ageGateResult.cutoffAge }}</strong>.
            </p>
            <p class="banner-detail">{{ ageGateResult.message }}</p>
          </div>
          <div class="banner-countdown" [class.urgent]="isUrgent()" aria-hidden="true">
            <span class="countdown-number">{{ ageGateResult.daysUntilCutoff }}</span>
            <span class="countdown-label">days</span>
          </div>
        </div>

        <!-- Restricted categories -->
        @if (ageGateResult.hiddenCategories.length > 0) {
          <div class="banner-categories">
            <p-divider styleClass="banner-divider"></p-divider>
            <p class="categories-heading">
              <i class="pi pi-lock" aria-hidden="true"></i>
              {{ transitionVerb() }} restricted after transition:
            </p>
            <div class="categories-list" role="list" aria-label="Categories becoming restricted">
              @for (cat of ageGateResult.hiddenCategories; track cat) {
                <div class="category-chip" role="listitem">
                  <i class="pi pi-shield" aria-hidden="true"></i>
                  <span>{{ getCategoryLabel(cat) }}</span>
                </div>
              }
            </div>
          </div>
        }

        @if (ageGateResult.accessLevel === 'none') {
          <div class="banner-access-note" role="note">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <span>
              When access changes, you will lose proxy permissions for the listed categories.
              Review and update permissions before the transition date.
            </span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .age-gate-banner {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      overflow: hidden;
    }

    .banner-main {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
    }

    .banner-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #fef3c7;
      border: 2px solid #fcd34d;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .banner-icon i {
      font-size: 1rem;
      color: #d97706;
    }

    .banner-content {
      flex: 1;
    }

    .banner-message {
      font-size: 0.9rem;
      color: #92400e;
      margin: 0 0 0.375rem;
      line-height: 1.5;
    }

    .days-count {
      color: #d97706;
      font-size: 1.05em;
    }

    .banner-detail {
      font-size: 0.8rem;
      color: #78350f;
      margin: 0;
      line-height: 1.4;
    }

    .banner-countdown {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: #fef3c7;
      border-radius: 8px;
      border: 1px solid #fcd34d;
      min-width: 56px;
      flex-shrink: 0;
      transition: background 0.3s, border-color 0.3s;
    }

    .banner-countdown.urgent {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .banner-countdown.urgent .countdown-number {
      color: #dc2626;
    }

    .banner-countdown.urgent .countdown-label {
      color: #b91c1c;
    }

    .countdown-number {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      color: #d97706;
    }

    .countdown-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #92400e;
      margin-top: 0.125rem;
    }

    .banner-categories {
      padding: 0 1.25rem 1rem;
    }

    .banner-divider {
      margin: 0 0 0.75rem;
    }

    .categories-heading {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #78350f;
      margin: 0 0 0.625rem;
    }

    .categories-heading i {
      font-size: 0.8rem;
      color: #d97706;
    }

    .categories-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 14px;
      font-size: 0.75rem;
      color: #92400e;
      font-weight: 500;
    }

    .category-chip i {
      font-size: 0.65rem;
      color: #d97706;
    }

    .banner-access-note {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem 0.875rem;
      font-size: 0.78rem;
      color: #78350f;
      border-top: 1px dashed #fcd34d;
      background: #fffbeb;
    }

    .banner-access-note i {
      font-size: 0.8rem;
      color: #d97706;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
  `],
})
export class AgeGateBannerComponent implements OnChanges {
  @Input({ required: true }) memberName = '';
  @Input({ required: true }) ageGateResult!: AgeGateResult;

  /** Show banner only when within 90 days of the cutoff */
  private readonly SHOW_THRESHOLD_DAYS = 90;

  private readonly _memberName = signal('');
  private readonly _result = signal<AgeGateResult | null>(null);

  protected readonly shouldShow = computed(() => {
    const result = this._result();
    if (!result) return false;
    return result.daysUntilCutoff > 0 && result.daysUntilCutoff <= this.SHOW_THRESHOLD_DAYS;
  });

  protected readonly isUrgent = computed(() => {
    const result = this._result();
    return result ? result.daysUntilCutoff <= 14 : false;
  });

  protected readonly bannerAriaLabel = computed(() => {
    const result = this._result();
    if (!result) return '';
    return (
      `Age gate warning for ${this._memberName()}: ` +
      `access changes in ${result.daysUntilCutoff} days when they turn ${result.cutoffAge}.`
    );
  });

  protected readonly transitionVerb = computed(() => {
    const result = this._result();
    if (!result) return 'Becoming';
    return result.accessLevel === 'none' ? 'Will become' : 'Currently';
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['memberName']) {
      this._memberName.set(this.memberName);
    }
    if (changes['ageGateResult'] && this.ageGateResult) {
      this._result.set(this.ageGateResult);
    }
  }

  protected getCategoryLabel(cat: RecordCategory): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }
}
