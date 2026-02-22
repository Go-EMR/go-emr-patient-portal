import {
  Component,
  Input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

// =============================================================================
// Legend item types
// =============================================================================

interface LegendItem {
  symbol: 'square' | 'circle' | 'diamond' | 'line' | 'dot' | 'bracket' | 'ring' | 'badge';
  color: string;
  strokeColor?: string;
  label: string;
  isDashed?: boolean;
}

// =============================================================================
// Legend datasets per view mode
// =============================================================================

const GENETICS_ITEMS: LegendItem[] = [
  { symbol: 'square',  color: '#ffffff', strokeColor: '#374151', label: 'Male (unaffected)' },
  { symbol: 'circle',  color: '#ffffff', strokeColor: '#374151', label: 'Female (unaffected)' },
  { symbol: 'diamond', color: '#ffffff', strokeColor: '#374151', label: 'Unknown sex' },
  { symbol: 'square',  color: '#ef4444', strokeColor: '#374151', label: 'Affected (Oncology)' },
  { symbol: 'square',  color: '#f97316', strokeColor: '#374151', label: 'Affected (Cardiology)' },
  { symbol: 'square',  color: '#a855f7', strokeColor: '#374151', label: 'Affected (Neurology)' },
  { symbol: 'line',    color: '#374151', strokeColor: '#374151', label: 'Deceased (diagonal line)' },
  { symbol: 'dot',     color: '#374151', strokeColor: '#374151', label: 'Carrier (centre dot)' },
  { symbol: 'bracket', color: '#374151', strokeColor: '#374151', label: 'Adopted (brackets)' },
];

const PERMISSIONS_ITEMS: LegendItem[] = [
  { symbol: 'ring', color: '#16a34a', label: 'Full access' },
  { symbol: 'ring', color: '#d97706', label: 'Partial access' },
  { symbol: 'ring', color: '#dc2626', label: 'No access' },
  { symbol: 'ring', color: '#2563eb', label: 'Emergency only', isDashed: true },
  { symbol: 'ring', color: '#9ca3af', label: 'No data' },
];

const RISK_ITEMS: LegendItem[] = [
  { symbol: 'badge', color: '#fecaca', label: 'High risk' },
  { symbol: 'badge', color: '#fed7aa', label: 'Moderate risk' },
  { symbol: 'badge', color: '#bbf7d0', label: 'Low risk' },
  { symbol: 'badge', color: '#f3f4f6', label: 'Unknown risk' },
];

// =============================================================================
// Component
// =============================================================================

@Component({
  selector: 'app-chart-legend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule],
  template: `
    <div class="chart-legend" [class.collapsed]="!visible()">
      <!-- Toggle button always visible -->
      <button
        pButton
        type="button"
        [icon]="visible() ? 'pi pi-times' : 'pi pi-info-circle'"
        class="p-button-sm p-button-text legend-toggle"
        [attr.aria-label]="visible() ? 'Hide legend' : 'Show legend'"
        [attr.aria-expanded]="visible()"
        (click)="toggleVisible()"
      ></button>
    
      <!-- Legend body -->
      @if (visible()) {
        <div class="legend-body">
          <div class="legend-title">
            <span class="pi pi-list"></span>
            <span>Legend</span>
            <span class="legend-mode-badge">{{ viewMode }}</span>
          </div>
          <ul class="legend-list" role="list">
            @for (item of currentItems(); track trackItem($index, item)) {
              <li
                class="legend-item"
                role="listitem"
                >
                <!-- Symbol SVG -->
                <svg
                  [attr.width]="symbolSize"
                  [attr.height]="symbolSize"
                  [attr.aria-label]="item.label + ' symbol'"
                  role="img"
                  class="legend-symbol"
                  >
                  <!-- Square -->
                  @if (item.symbol === 'square') {
                    <rect
                      x="2" y="2" width="12" height="12"
                      [attr.fill]="item.color"
                      [attr.stroke]="item.strokeColor || '#374151'"
                      stroke-width="1.5"
                    ></rect>
                  }
                  <!-- Circle -->
                  @if (item.symbol === 'circle') {
                    <circle
                      cx="8" cy="8" r="6"
                      [attr.fill]="item.color"
                      [attr.stroke]="item.strokeColor || '#374151'"
                      stroke-width="1.5"
                    ></circle>
                  }
                  <!-- Diamond -->
                  @if (item.symbol === 'diamond') {
                    <polygon
                      points="8,1 15,8 8,15 1,8"
                      [attr.fill]="item.color"
                      [attr.stroke]="item.strokeColor || '#374151'"
                      stroke-width="1.5"
                    ></polygon>
                  }
                  <!-- Diagonal death line -->
                  @if (item.symbol === 'line') {
                    <g>
                      <rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#374151" stroke-width="1.5"></rect>
                      <line x1="2" y1="14" x2="14" y2="2" stroke="#374151" stroke-width="1.5"></line>
                    </g>
                  }
                  <!-- Carrier centre dot -->
                  @if (item.symbol === 'dot') {
                    <g>
                      <circle cx="8" cy="8" r="6" fill="#fff" stroke="#374151" stroke-width="1.5"></circle>
                      <circle cx="8" cy="8" r="2.5" fill="#374151"></circle>
                    </g>
                  }
                  <!-- Adopted brackets -->
                  @if (item.symbol === 'bracket') {
                    <g>
                      <rect x="4" y="2" width="8" height="12" fill="#fff" stroke="#374151" stroke-width="1.5"></rect>
                      <path d="M4,2 L1,2 L1,14 L4,14" fill="none" stroke="#374151" stroke-width="1.5"></path>
                      <path d="M12,2 L15,2 L15,14 L12,14" fill="none" stroke="#374151" stroke-width="1.5"></path>
                    </g>
                  }
                  <!-- Permission ring -->
                  @if (item.symbol === 'ring') {
                    <circle
                      cx="8" cy="8" r="6"
                      fill="none"
                      [attr.stroke]="item.color"
                      stroke-width="2.5"
                      [attr.stroke-dasharray]="item.isDashed ? '3,2' : 'none'"
                    ></circle>
                  }
                  <!-- Risk badge -->
                  @if (item.symbol === 'badge') {
                    <rect
                      x="1" y="3" width="14" height="10" rx="4"
                      [attr.fill]="item.color"
                      stroke="#d1d5db"
                      stroke-width="1"
                    ></rect>
                  }
                </svg>
                <span class="legend-label">{{ item.label }}</span>
              </li>
            }
          </ul>
        </div>
      }
    </div>
    `,
  styles: [`
    .chart-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(255,255,255,0.96);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      min-width: 200px;
      max-width: 220px;
      z-index: 20;
      transition: all 0.2s ease;
    }

    .chart-legend.collapsed {
      min-width: 36px;
      max-width: 36px;
      background: rgba(255,255,255,0.9);
    }

    .legend-toggle {
      position: absolute !important;
      top: 6px;
      right: 6px;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      z-index: 1;
    }

    .legend-body {
      padding: 10px 12px 10px 12px;
      padding-right: 36px;
    }

    .legend-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
      margin-bottom: 10px;
    }

    .legend-mode-badge {
      margin-left: auto;
      background: #0d9488;
      color: #fff;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 9px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .legend-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-symbol {
      flex-shrink: 0;
    }

    .legend-label {
      font-size: 11px;
      color: #4b5563;
      line-height: 1.3;
    }
  `],
})
export class ChartLegendComponent {
  @Input() viewMode: string = 'genetics';

  readonly visible = signal(true);
  readonly symbolSize = 16;

  toggleVisible(): void {
    this.visible.update(v => !v);
  }

  currentItems(): LegendItem[] {
    switch (this.viewMode) {
      case 'permissions': return PERMISSIONS_ITEMS;
      case 'risk':        return RISK_ITEMS;
      default:            return GENETICS_ITEMS;
    }
  }

  trackItem(_: number, item: LegendItem): string {
    return `${item.symbol}-${item.label}`;
  }
}
