import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { LabTrendsService, LabTrendData, LabDataPoint, LabFlag, TimeRange } from '../data-access';

interface ChartPoint {
  x: number;
  y: number;
  dp: LabDataPoint;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  dp: LabDataPoint | null;
}

const CHART_W = 720;
const CHART_H = 280;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 20;
const PAD_B = 48;

const SPARKLINE_W = 64;
const SPARKLINE_H = 28;

@Component({
  selector: 'app-lab-trends',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule],
  template: `
    <div class="lab-trends-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <div>
            <h1 class="page-title">Lab Results &amp; Trends</h1>
            <p class="page-subtitle">Track your laboratory values over time and monitor health progress</p>
          </div>
        </div>
      </div>

      <div class="trends-layout">
        <!-- Left Sidebar: Lab Test List -->
        <aside class="test-sidebar">
          <div class="sidebar-heading">Lab Tests</div>

          @for (lab of service.allTests; track lab.testName) {
            @let latestPoint = service.latestValuesByTest().get(lab.testName);
            <button
              class="test-item"
              [class.selected]="service.selectedTestName() === lab.testName"
              (click)="service.selectTest(lab.testName)"
            >
              <div class="test-item-top">
                <span class="test-name">{{ lab.testName }}</span>
                <span class="test-category">{{ lab.category }}</span>
              </div>
              <div class="test-item-bottom">
                @if (latestPoint) {
                  <span class="test-value" [class]="'flag-' + latestPoint.flag">
                    {{ latestPoint.value }} {{ lab.unit }}
                  </span>
                }
                <!-- Mini sparkline SVG -->
                <svg
                  [attr.width]="SPARKLINE_W"
                  [attr.height]="SPARKLINE_H"
                  class="sparkline"
                  [attr.viewBox]="'0 0 ' + SPARKLINE_W + ' ' + SPARKLINE_H"
                >
                  @let sp = buildSparkline(lab);
                  @if (sp.pathD) {
                    <path [attr.d]="sp.pathD" class="sparkline-path" [class]="'spark-' + sp.trend" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  }
                </svg>
              </div>
            </button>
          }
        </aside>

        <!-- Main Chart Area -->
        <main class="chart-main">
          @if (service.selectedTrend(); as trend) {
            <!-- Chart Header -->
            <div class="chart-header">
              <div class="chart-title-group">
                <h2 class="chart-title">{{ trend.testName }}</h2>
                <p class="chart-description">{{ trend.description }}</p>
              </div>
              <!-- Time Range Toggle -->
              <div class="time-range-toggle">
                @for (opt of timeRangeOptions; track opt.value) {
                  <button
                    class="range-btn"
                    [class.active]="service.timeRange() === opt.value"
                    (click)="service.setTimeRange(opt.value)"
                  >{{ opt.label }}</button>
                }
              </div>
            </div>

            <!-- SVG Chart -->
            <div class="chart-container">
              @let pts = buildChartPoints(trend);
              @let refBand = buildRefBand(trend);

              <svg
                class="main-chart"
                [attr.viewBox]="'0 0 ' + CHART_W + ' ' + CHART_H"
                preserveAspectRatio="xMidYMid meet"
                (mouseleave)="hideTooltip()"
              >
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:0.15"/>
                    <stop offset="100%" style="stop-color:var(--primary-color);stop-opacity:0"/>
                  </linearGradient>
                  <clipPath id="chartClip">
                    <rect [attr.x]="PAD_L" [attr.y]="PAD_T" [attr.width]="CHART_W - PAD_L - PAD_R" [attr.height]="CHART_H - PAD_T - PAD_B"/>
                  </clipPath>
                </defs>

                <!-- Grid lines -->
                @for (gridY of pts.gridYLines; track gridY.y) {
                  <line
                    [attr.x1]="PAD_L"
                    [attr.y1]="gridY.y"
                    [attr.x2]="CHART_W - PAD_R"
                    [attr.y2]="gridY.y"
                    class="grid-line"
                  />
                  <text
                    [attr.x]="PAD_L - 6"
                    [attr.y]="gridY.y + 4"
                    class="axis-label"
                    text-anchor="end"
                  >{{ gridY.label }}</text>
                }

                <!-- Reference range band -->
                @if (refBand) {
                  <rect
                    [attr.x]="PAD_L"
                    [attr.y]="refBand.y"
                    [attr.width]="CHART_W - PAD_L - PAD_R"
                    [attr.height]="refBand.height"
                    class="ref-band"
                    clip-path="url(#chartClip)"
                  />
                  <!-- Reference range labels -->
                  <text
                    [attr.x]="CHART_W - PAD_R + 4"
                    [attr.y]="refBand.y + 10"
                    class="ref-label"
                  >{{ trend.referenceMax }}</text>
                  <text
                    [attr.x]="CHART_W - PAD_R + 4"
                    [attr.y]="refBand.y + refBand.height - 2"
                    class="ref-label"
                  >{{ trend.referenceMin }}</text>
                }

                <!-- Area fill under line -->
                @if (pts.areaPath) {
                  <path
                    [attr.d]="pts.areaPath"
                    fill="url(#lineGradient)"
                    clip-path="url(#chartClip)"
                  />
                }

                <!-- Main line -->
                @if (pts.linePath) {
                  <path
                    [attr.d]="pts.linePath"
                    class="chart-line"
                    fill="none"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    clip-path="url(#chartClip)"
                  />
                }

                <!-- X-axis date labels -->
                @for (pt of pts.points; track pt.dp.date.getTime()) {
                  <text
                    [attr.x]="pt.x"
                    [attr.y]="CHART_H - PAD_B + 16"
                    class="axis-label x-label"
                    text-anchor="middle"
                  >{{ formatDateShort(pt.dp.date) }}</text>
                }

                <!-- Data point circles -->
                @for (pt of pts.points; track pt.dp.date.getTime()) {
                  <circle
                    [attr.cx]="pt.x"
                    [attr.cy]="pt.y"
                    [attr.r]="tooltip().visible && tooltip().dp && tooltip().dp!.date.getTime() === pt.dp.date.getTime() ? 7 : 5"
                    [class]="'data-point flag-dot-' + pt.dp.flag"
                    (mouseenter)="showTooltip($event, pt)"
                    style="cursor: pointer;"
                  />
                }

                <!-- Tooltip -->
                @if (tooltip().visible && tooltip().dp) {
                  @let ttX = clampTooltipX(tooltip().x);
                  @let ttY = clampTooltipY(tooltip().y);
                  <g class="tooltip-group" [attr.transform]="'translate(' + ttX + ',' + ttY + ')'">
                    <rect x="-52" y="-54" width="104" height="52" rx="6" class="tooltip-bg"/>
                    <text x="0" y="-34" class="tooltip-date" text-anchor="middle">
                      {{ formatDateLong(tooltip().dp!.date) }}
                    </text>
                    <text x="0" y="-16" class="tooltip-value" text-anchor="middle">
                      {{ tooltip().dp!.value }} {{ trend.unit }}
                    </text>
                    <text x="0" y="-2" [class]="'tooltip-flag flag-text-' + tooltip().dp!.flag" text-anchor="middle">
                      {{ getFlagLabel(tooltip().dp!.flag) }}
                    </text>
                  </g>
                }

                <!-- Axes borders -->
                <line [attr.x1]="PAD_L" [attr.y1]="PAD_T" [attr.x2]="PAD_L" [attr.y2]="CHART_H - PAD_B" class="axis-line"/>
                <line [attr.x1]="PAD_L" [attr.y1]="CHART_H - PAD_B" [attr.x2]="CHART_W - PAD_R" [attr.y2]="CHART_H - PAD_B" class="axis-line"/>
              </svg>

              <!-- Chart Legend -->
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-swatch normal-swatch"></span>
                  <span>Normal range</span>
                </div>
                <div class="legend-item">
                  <span class="legend-swatch high-swatch"></span>
                  <span>High</span>
                </div>
                <div class="legend-item">
                  <span class="legend-swatch low-swatch"></span>
                  <span>Low</span>
                </div>
                <div class="legend-item">
                  <span class="legend-swatch critical-swatch"></span>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            <!-- Stats Panel -->
            @if (service.stats(); as stats) {
              <div class="stats-panel">
                <div class="stat-card">
                  <div class="stat-label">Latest Value</div>
                  <div class="stat-value" [class]="'flag-' + stats.latest.flag">
                    {{ stats.latest.value }} <span class="stat-unit">{{ trend.unit }}</span>
                  </div>
                  <div class="stat-meta">{{ formatDateLong(stats.latest.date) }}</div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Previous Value</div>
                  @if (stats.previous) {
                    <div class="stat-value">
                      {{ stats.previous.value }} <span class="stat-unit">{{ trend.unit }}</span>
                    </div>
                    <div class="stat-meta">{{ formatDateLong(stats.previous.date) }}</div>
                  } @else {
                    <div class="stat-value stat-na">N/A</div>
                  }
                </div>

                <div class="stat-card">
                  <div class="stat-label">Change</div>
                  @if (stats.change !== null) {
                    <div class="stat-value" [class]="getChangeClass(stats.change)">
                      <i [class]="stats.change > 0 ? 'pi pi-arrow-up' : stats.change < 0 ? 'pi pi-arrow-down' : 'pi pi-minus'"></i>
                      {{ formatChange(stats.change) }} {{ trend.unit }}
                    </div>
                    <div class="stat-meta">{{ formatChangePercent(stats.changePercent) }}</div>
                  } @else {
                    <div class="stat-value stat-na">N/A</div>
                  }
                </div>

                <div class="stat-card">
                  <div class="stat-label">Minimum</div>
                  <div class="stat-value">{{ stats.min }} <span class="stat-unit">{{ trend.unit }}</span></div>
                  <div class="stat-meta">In selected period</div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Maximum</div>
                  <div class="stat-value">{{ stats.max }} <span class="stat-unit">{{ trend.unit }}</span></div>
                  <div class="stat-meta">In selected period</div>
                </div>

                <div class="stat-card">
                  <div class="stat-label">Average</div>
                  <div class="stat-value">{{ stats.average }} <span class="stat-unit">{{ trend.unit }}</span></div>
                  <div class="stat-meta">In selected period</div>
                </div>
              </div>
            }

            <!-- Reference Range Notice -->
            <div class="ref-notice">
              <i class="pi pi-info-circle"></i>
              <span>Reference range for {{ trend.testName }}: {{ trend.referenceMin === 0 ? '&lt;' + trend.referenceMax : trend.referenceMin + ' – ' + trend.referenceMax }} {{ trend.unit }}. Values outside this range are flagged. Always discuss results with your provider.</span>
            </div>

          } @else {
            <div class="empty-chart">
              <i class="pi pi-chart-line"></i>
              <p>No data available for the selected time range. Try selecting a wider period.</p>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .lab-trends-page {
      max-width: 1280px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
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
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
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

    /* ===== Two-column layout ===== */
    .trends-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    /* ===== Test Sidebar ===== */
    .test-sidebar {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
      overflow: hidden;
    }

    .sidebar-heading {
      padding: 0.875rem 1rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .test-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-bottom: 1px solid var(--surface-border);
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 0.15s ease;
    }

    .test-item:last-child {
      border-bottom: none;
    }

    .test-item:hover {
      background: var(--surface-hover);
    }

    .test-item.selected {
      background: var(--primary-50);
      border-left: 3px solid var(--primary-color);
    }

    .test-item-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.25rem;
    }

    .test-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-item.selected .test-name {
      color: var(--primary-700);
    }

    .test-category {
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      background: var(--surface-100);
      padding: 0.1rem 0.4rem;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .test-item-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .test-value {
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* ===== Sparkline ===== */
    .sparkline {
      display: block;
    }

    .sparkline-path {
      transition: stroke 0.2s ease;
    }

    .spark-normal { stroke: var(--green-500); }
    .spark-abnormal { stroke: var(--orange-500); }
    .spark-critical { stroke: var(--red-500); }

    /* ===== Flag color classes ===== */
    .flag-normal { color: var(--green-600); }
    .flag-high { color: var(--orange-600); }
    .flag-low { color: var(--blue-600); }
    .flag-critical-low { color: var(--red-700); }
    .flag-critical-high { color: var(--red-700); }

    /* ===== Main Chart Area ===== */
    .chart-main {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .chart-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }

    .chart-title-group {
      flex: 1;
    }

    .chart-title {
      margin: 0 0 0.25rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .chart-description {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
      max-width: 440px;
    }

    /* ===== Time Range Toggle ===== */
    .time-range-toggle {
      display: flex;
      gap: 2px;
      background: var(--surface-100);
      border-radius: 20px;
      padding: 2px;
      flex-shrink: 0;
      align-self: flex-start;
    }

    .range-btn {
      padding: 0.375rem 0.875rem;
      border: none;
      border-radius: 18px;
      background: transparent;
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      font-weight: 500;
    }

    .range-btn.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-weight: 700;
    }

    .range-btn:hover:not(.active) {
      color: var(--text-color);
    }

    /* ===== SVG Chart Container ===== */
    .chart-container {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1rem 0.75rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }

    .main-chart {
      width: 100%;
      height: auto;
      display: block;
      overflow: visible;
    }

    /* SVG chart elements */
    .grid-line {
      stroke: var(--surface-border);
      stroke-width: 1;
      stroke-dasharray: 3 4;
    }

    .axis-line {
      stroke: var(--surface-border);
      stroke-width: 1.5;
    }

    .axis-label {
      font-size: 10px;
      fill: var(--text-color-secondary);
      font-family: inherit;
    }

    .x-label {
      font-size: 9px;
    }

    .ref-band {
      fill: var(--green-50, #f0fdf4);
      opacity: 0.6;
    }

    .ref-label {
      font-size: 9px;
      fill: var(--green-600);
      font-family: inherit;
    }

    .chart-line {
      stroke: var(--primary-color);
    }

    /* Data point circles */
    .data-point {
      stroke-width: 2;
      transition: r 0.1s ease;
    }

    .flag-dot-normal {
      fill: var(--primary-color);
      stroke: white;
    }

    .flag-dot-high {
      fill: var(--orange-500);
      stroke: white;
    }

    .flag-dot-low {
      fill: var(--blue-500);
      stroke: white;
    }

    .flag-dot-critical-low {
      fill: var(--red-600);
      stroke: white;
    }

    .flag-dot-critical-high {
      fill: var(--red-600);
      stroke: white;
    }

    /* Tooltip */
    .tooltip-bg {
      fill: var(--surface-card);
      stroke: var(--surface-border);
      stroke-width: 1;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));
    }

    .tooltip-date {
      font-size: 9.5px;
      fill: var(--text-color-secondary);
      font-family: inherit;
    }

    .tooltip-value {
      font-size: 12px;
      font-weight: 700;
      fill: var(--text-color);
      font-family: inherit;
    }

    .tooltip-flag {
      font-size: 9px;
      font-weight: 600;
      font-family: inherit;
    }

    .flag-text-normal { fill: var(--green-600); }
    .flag-text-high { fill: var(--orange-600); }
    .flag-text-low { fill: var(--blue-600); }
    .flag-text-critical-low { fill: var(--red-700); }
    .flag-text-critical-high { fill: var(--red-700); }

    /* Chart Legend */
    .chart-legend {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 0.625rem 0.25rem 0.25rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .legend-swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .normal-swatch { background: var(--green-100); border: 1.5px solid var(--green-400); }
    .high-swatch { background: var(--orange-100); border: 1.5px solid var(--orange-500); }
    .low-swatch { background: var(--blue-100); border: 1.5px solid var(--blue-500); }
    .critical-swatch { background: var(--red-100); border: 1.5px solid var(--red-600); }

    /* ===== Stats Panel ===== */
    .stats-panel {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.875rem;
    }

    .stat-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem 1.125rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }

    .stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      margin-bottom: 0.375rem;
    }

    .stat-value {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .stat-value i {
      font-size: 0.8rem;
    }

    .stat-unit {
      font-size: 0.72rem;
      font-weight: 400;
      color: var(--text-color-secondary);
    }

    .stat-meta {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }

    .stat-na {
      color: var(--text-color-secondary);
    }

    .change-up { color: var(--orange-600); }
    .change-down { color: var(--green-600); }
    .change-neutral { color: var(--text-color-secondary); }

    /* ===== Reference Notice ===== */
    .ref-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1.125rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-100, #dbeafe);
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .ref-notice i {
      color: var(--blue-500);
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ===== Empty state ===== */
    .empty-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      text-align: center;
      color: var(--text-color-secondary);
      gap: 1rem;
    }

    .empty-chart i {
      font-size: 3rem;
      opacity: 0.3;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1024px) {
      .trends-layout {
        grid-template-columns: 200px 1fr;
      }

      .stats-panel {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .trends-layout {
        grid-template-columns: 1fr;
      }

      .test-sidebar {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }

      .sidebar-heading {
        grid-column: 1 / -1;
      }

      .stats-panel {
        grid-template-columns: repeat(2, 1fr);
      }

      .chart-header {
        flex-direction: column;
        gap: 0.875rem;
      }
    }

    @media (max-width: 480px) {
      .stats-panel {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class LabTrendsComponent {
  readonly service = inject(LabTrendsService);

  // Expose constants for template access
  readonly CHART_W = CHART_W;
  readonly CHART_H = CHART_H;
  readonly PAD_L = PAD_L;
  readonly PAD_R = PAD_R;
  readonly PAD_T = PAD_T;
  readonly PAD_B = PAD_B;
  readonly SPARKLINE_W = SPARKLINE_W;
  readonly SPARKLINE_H = SPARKLINE_H;

  readonly timeRangeOptions: { label: string; value: TimeRange }[] = [
    { label: '6 Months', value: '6mo' },
    { label: '1 Year', value: '1yr' },
    { label: '2 Years', value: '2yr' }
  ];

  private readonly _tooltip = signal<TooltipState>({ visible: false, x: 0, y: 0, dp: null });
  readonly tooltip = this._tooltip.asReadonly();

  // ===== Chart geometry helpers =====

  buildChartPoints(trend: LabTrendData): {
    points: ChartPoint[];
    linePath: string;
    areaPath: string;
    gridYLines: { y: number; label: string }[];
  } {
    const dps = trend.dataPoints;
    if (dps.length === 0) {
      return { points: [], linePath: '', areaPath: '', gridYLines: [] };
    }

    const allValues = dps.map(dp => dp.value);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);

    // Extend the Y domain to nicely include the reference range
    const yMin = Math.min(dataMin, trend.referenceMin === 0 ? dataMin : trend.referenceMin) * 0.85;
    const yMax = Math.max(dataMax, trend.referenceMax === 999 ? dataMax : trend.referenceMax) * 1.12;

    const plotW = CHART_W - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;

    const toX = (index: number): number => {
      if (dps.length === 1) return PAD_L + plotW / 2;
      return PAD_L + (index / (dps.length - 1)) * plotW;
    };

    const toY = (val: number): number => {
      return PAD_T + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    };

    const points: ChartPoint[] = dps.map((dp, i) => ({
      x: toX(i),
      y: toY(dp.value),
      dp
    }));

    // Smooth line using cardinal spline control points
    const linePath = this._buildSmoothPath(points);

    // Area path: close back along the bottom axis
    const bottomY = PAD_T + plotH;
    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${bottomY} L ${points[0].x},${bottomY} Z`
      : '';

    // Grid Y lines — 4 even steps
    const steps = 4;
    const gridYLines: { y: number; label: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const val = yMin + (i / steps) * (yMax - yMin);
      gridYLines.push({
        y: toY(val),
        label: this._formatValue(val)
      });
    }

    return { points, linePath, areaPath, gridYLines };
  }

  buildRefBand(trend: LabTrendData): { y: number; height: number } | null {
    const dps = trend.dataPoints;
    if (dps.length === 0) return null;

    const allValues = dps.map(dp => dp.value);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);

    const yMin = Math.min(dataMin, trend.referenceMin === 0 ? dataMin : trend.referenceMin) * 0.85;
    const yMax = Math.max(dataMax, trend.referenceMax === 999 ? dataMax : trend.referenceMax) * 1.12;

    const plotH = CHART_H - PAD_T - PAD_B;

    const toY = (val: number): number => {
      return PAD_T + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    };

    const refMaxClamped = Math.min(trend.referenceMax === 999 ? yMax : trend.referenceMax, yMax);
    const refMinClamped = Math.max(trend.referenceMin, yMin);

    const bandTop = toY(refMaxClamped);
    const bandBottom = toY(refMinClamped);

    return { y: bandTop, height: Math.max(0, bandBottom - bandTop) };
  }

  buildSparkline(lab: LabTrendData): { pathD: string; trend: 'normal' | 'abnormal' | 'critical' } {
    const sorted = [...lab.dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());
    if (sorted.length < 2) return { pathD: '', trend: 'normal' };

    const values = sorted.map(dp => dp.value);
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const range = vMax - vMin || 1;

    const toX = (i: number): number => (i / (sorted.length - 1)) * SPARKLINE_W;
    const toY = (v: number): number => SPARKLINE_H - 2 - ((v - vMin) / range) * (SPARKLINE_H - 4);

    const pathD = sorted
      .map((dp, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)},${toY(dp.value).toFixed(1)}`)
      .join(' ');

    const latest = sorted[sorted.length - 1];
    const trend: 'normal' | 'abnormal' | 'critical' =
      latest.flag === 'critical-low' || latest.flag === 'critical-high'
        ? 'critical'
        : latest.flag !== 'normal'
        ? 'abnormal'
        : 'normal';

    return { pathD, trend };
  }

  showTooltip(event: MouseEvent, pt: ChartPoint): void {
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgWidth = rect.width;
    const svgHeight = rect.height;

    // Map client coordinates to SVG viewBox coordinates
    const scaleX = CHART_W / svgWidth;
    const scaleY = CHART_H / svgHeight;
    const svgX = (event.clientX - rect.left) * scaleX;
    const svgY = (event.clientY - rect.top) * scaleY;

    this._tooltip.set({ visible: true, x: svgX, y: svgY, dp: pt.dp });
  }

  hideTooltip(): void {
    this._tooltip.update(t => ({ ...t, visible: false }));
  }

  clampTooltipX(x: number): number {
    return Math.max(56, Math.min(x, CHART_W - 56));
  }

  clampTooltipY(y: number): number {
    return Math.max(60, Math.min(y, CHART_H - PAD_B - 10));
  }

  formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  formatDateLong(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getFlagLabel(flag: LabFlag): string {
    const labels: Record<LabFlag, string> = {
      'normal': 'Normal',
      'high': 'High',
      'low': 'Low',
      'critical-high': 'Critical High',
      'critical-low': 'Critical Low'
    };
    return labels[flag];
  }

  getChangeClass(change: number): string {
    if (change === 0) return 'change-neutral';
    // For most labs, an increase is concerning (orange) and a decrease is good (green)
    // This is a reasonable default; specific tests may differ
    return change > 0 ? 'change-up' : 'change-down';
  }

  formatChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${this._formatValue(change)}`;
  }

  formatChangePercent(pct: number | null): string {
    if (pct === null) return '';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% from previous`;
  }

  // ===== Private helpers =====

  private _buildSmoothPath(points: ChartPoint[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    // Catmull-Rom to bezier conversion for a smooth curve
    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const tension = 0.4;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }

    return d;
  }

  private _formatValue(val: number): string {
    if (Math.abs(val) >= 100) return Math.round(val).toString();
    if (Math.abs(val) >= 10) return val.toFixed(1);
    return val.toFixed(2);
  }
}
