import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  HealthTimelineService,
  HealthEvent,
  HealthEventType,
  EVENT_TYPE_META,
  FILTER_OPTIONS
} from '../data-access';

@Component({
  selector: 'app-health-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    <div class="timeline-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">
            <i class="pi pi-history header-icon"></i>
            Health Timeline
          </h1>
          <p class="page-subtitle">A chronological view of your complete health history</p>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-value">{{ timeline.eventCountByType()['all'] }}</span>
            <span class="stat-label">Total Events</span>
          </div>
          <div class="stat-pill">
            <span class="stat-value">12</span>
            <span class="stat-label">Months</span>
          </div>
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="filter-bar">
        @for (filter of filterOptions; track filter.type) {
          <button
            class="filter-chip"
            [class.active]="timeline.activeFilter() === filter.type"
            (click)="timeline.setFilter(filter.type)">
            <i [class]="filter.icon"></i>
            <span>{{ filter.label }}</span>
            <span class="chip-count">{{ timeline.eventCountByType()[filter.type] ?? 0 }}</span>
          </button>
        }
      </div>

      <!-- Timeline -->
      @if (groupedEvents().length > 0) {
        <div class="timeline-container">
          <div class="timeline-track"></div>

          @for (group of groupedEvents(); track group.monthYear) {
            <!-- Month separator -->
            <div class="month-separator">
              <div class="month-label">
                <i class="pi pi-calendar-times"></i>
                {{ group.monthYear }}
              </div>
              <div class="month-line"></div>
            </div>

            <!-- Events in this month -->
            @for (event of group.events; track event.id; let i = $index; let isEven = $even) {
              <div class="timeline-row" [class.row-right]="isEven" [class.milestone]="event.isMilestone">

                <!-- Left side card -->
                @if (!isEven) {
                  <div class="timeline-card card-left">
                    <ng-container *ngTemplateOutlet="eventCard; context: { $implicit: event }"></ng-container>
                  </div>
                  <div class="timeline-spacer"></div>
                }

                <!-- Center node -->
                <div class="timeline-node-wrap">
                  @if (event.isMilestone) {
                    <div class="milestone-ring">
                      <div class="event-node"
                           [style.background]="getTypeMeta(event.type).bgColor"
                           [style.color]="getTypeMeta(event.type).color">
                        <i [class]="getTypeMeta(event.type).icon"></i>
                      </div>
                    </div>
                  } @else {
                    <div class="event-node"
                         [style.background]="getTypeMeta(event.type).bgColor"
                         [style.color]="getTypeMeta(event.type).color">
                      <i [class]="getTypeMeta(event.type).icon"></i>
                    </div>
                  }
                </div>

                <!-- Right side card -->
                @if (isEven) {
                  <div class="timeline-spacer"></div>
                  <div class="timeline-card card-right">
                    <ng-container *ngTemplateOutlet="eventCard; context: { $implicit: event }"></ng-container>
                  </div>
                }

              </div>
            }
          }

          <!-- Timeline end cap -->
          <div class="timeline-end">
            <div class="end-node">
              <i class="pi pi-star-fill"></i>
            </div>
            <span class="end-label">Beginning of Record</span>
          </div>
        </div>

      } @else {
        <!-- Empty state -->
        <div class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-filter-slash"></i>
          </div>
          <h3 class="empty-title">No events found</h3>
          <p class="empty-desc">There are no health events matching the selected filter. Try selecting a different category.</p>
          <button pButton label="Show All Events" icon="pi pi-list" class="p-button-outlined"
                  (click)="timeline.setFilter('all')"></button>
        </div>
      }

    </div>

    <!-- Shared event card template -->
    <ng-template #eventCard let-event>
      <div class="card-inner" [class.milestone-card]="event.isMilestone">
        @if (event.isMilestone) {
          <div class="milestone-banner">
            <i class="pi pi-star-fill"></i> Key Milestone
          </div>
        }
        <div class="card-header">
          <span class="date-badge">
            <i class="pi pi-clock"></i>
            {{ timeline.formatDate(event.date) }}
          </span>
          <span class="type-tag"
                [style.background]="getTypeMeta(event.type).bgColor"
                [style.color]="getTypeMeta(event.type).color">
            {{ getTypeMeta(event.type).label }}
          </span>
        </div>
        <h3 class="card-title">{{ event.title }}</h3>
        <p class="card-desc">{{ event.description }}</p>
        <div class="card-provider">
          <i class="pi pi-user"></i>
          <span>{{ event.provider }}</span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* ── Page shell ─────────────────────────────────────────── */
    .timeline-page {
      max-width: 960px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .page-title {
      margin: 0 0 0.375rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .header-icon {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .page-subtitle {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.9rem;
    }

    .header-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 0.625rem 1.125rem;
      min-width: 72px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 0.125rem;
    }

    /* ── Filter chips ────────────────────────────────────────── */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 20px;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-color-secondary);
      font-size: 0.825rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.18s ease;
      white-space: nowrap;
    }

    .filter-chip i {
      font-size: 0.8rem;
    }

    .filter-chip:hover:not(.active) {
      background: var(--surface-hover);
      color: var(--text-color);
      border-color: var(--primary-200, #a5b4fc);
    }

    .filter-chip.active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .chip-count {
      background: rgba(0,0,0,0.12);
      border-radius: 10px;
      padding: 0.05rem 0.45rem;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 18px;
      text-align: center;
    }

    .filter-chip.active .chip-count {
      background: rgba(255,255,255,0.25);
    }

    /* ── Timeline container ──────────────────────────────────── */
    .timeline-container {
      position: relative;
      padding-bottom: 2rem;
    }

    /* Central vertical line */
    .timeline-track {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 2rem;
      width: 2px;
      background: linear-gradient(to bottom, var(--primary-color), var(--surface-border));
      transform: translateX(-50%);
      border-radius: 1px;
    }

    /* ── Month separator ─────────────────────────────────────── */
    .month-separator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.75rem 0 1rem;
      position: relative;
      z-index: 1;
    }

    .month-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--surface-ground);
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid var(--surface-border);
      white-space: nowrap;
    }

    .month-label i {
      font-size: 0.75rem;
      color: var(--primary-color);
    }

    .month-line {
      flex: 1;
      height: 1px;
      background: var(--surface-border);
    }

    /* ── Timeline row ────────────────────────────────────────── */
    .timeline-row {
      display: grid;
      grid-template-columns: 1fr 52px 1fr;
      gap: 0;
      align-items: center;
      margin-bottom: 1.25rem;
      position: relative;
    }

    /* ── Center node ─────────────────────────────────────────── */
    .timeline-node-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
    }

    .event-node {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      border: 2px solid var(--surface-card);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .timeline-row:hover .event-node {
      transform: scale(1.12);
    }

    .milestone-ring {
      padding: 3px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-300, #93c5fd), var(--primary-color));
    }

    .milestone-ring .event-node {
      border-color: transparent;
    }

    /* ── Cards ───────────────────────────────────────────────── */
    .timeline-card {
      padding: 0 1rem;
    }

    .card-left { text-align: right; }
    .card-right { text-align: left; }

    .timeline-spacer {
      /* occupies the opposite side of the card */
    }

    .card-inner {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      padding: 1rem 1.125rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      cursor: default;
    }

    .card-inner:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .milestone-card {
      border-color: var(--primary-300, #93c5fd);
      background: var(--surface-card);
      box-shadow: 0 2px 12px rgba(99,102,241,0.1);
    }

    .milestone-banner {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--primary-700, #4338ca);
      background: var(--primary-50, #eef2ff);
      border-radius: 6px;
      padding: 0.2rem 0.5rem;
      margin-bottom: 0.5rem;
    }

    /* Card header: date badge + type tag */
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .card-left .card-header { justify-content: flex-end; }
    .card-right .card-header { justify-content: flex-start; }

    .date-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .date-badge i { font-size: 0.65rem; }

    .type-tag {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 6px;
      padding: 0.2rem 0.5rem;
    }

    .card-title {
      margin: 0 0 0.375rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-color);
      line-height: 1.3;
    }

    .card-desc {
      margin: 0 0 0.625rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .card-provider {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      border-top: 1px solid var(--surface-border);
      padding-top: 0.5rem;
      width: 100%;
    }

    .card-left .card-provider { justify-content: flex-end; }

    .card-provider i { font-size: 0.7rem; color: var(--primary-color); }

    /* ── Timeline end cap ────────────────────────────────────── */
    .timeline-end {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      position: relative;
      z-index: 2;
    }

    .end-node {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--surface-card);
      border: 2px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .end-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      font-style: italic;
    }

    /* ── Empty state ─────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      text-align: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--surface-100, #f3f4f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
    }

    .empty-icon i { font-size: 1.75rem; }

    .empty-title {
      margin: 0.25rem 0 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .empty-desc {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      max-width: 360px;
      line-height: 1.5;
    }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 768px) {
      .timeline-track {
        left: 20px;
      }

      .timeline-row {
        grid-template-columns: 0 44px 1fr;
        margin-left: 0;
      }

      .timeline-spacer {
        display: none;
      }

      .timeline-card {
        padding: 0 0 0 0.75rem;
      }

      .card-left {
        display: none;
      }

      .card-right,
      .timeline-row.row-right .card-right {
        display: block;
        text-align: left;
        padding: 0 0 0 0.75rem;
      }

      /* On mobile, left-side cards are shown on right */
      .timeline-row:not(.row-right) .timeline-card.card-left {
        display: block;
        grid-column: 3;
        text-align: left;
        padding: 0 0 0 0.75rem;
      }

      .timeline-row:not(.row-right) .timeline-spacer {
        display: none;
      }

      .card-left .card-header { justify-content: flex-start; }
      .card-left .card-provider { justify-content: flex-start; }

      .month-separator {
        padding-left: 0;
      }

      .page-header {
        flex-direction: column;
        gap: 0.75rem;
      }

      .header-stats {
        align-self: flex-start;
      }

      .filter-bar {
        gap: 0.375rem;
      }

      .filter-chip span:not(.chip-count) {
        display: none;
      }

      .filter-chip {
        padding: 0.5rem 0.625rem;
      }
    }
  `]
})
export class HealthTimelineComponent {
  readonly timeline = inject(HealthTimelineService);
  readonly filterOptions = FILTER_OPTIONS;

  readonly groupedEvents = computed(() => {
    const events = this.timeline.filteredEvents();
    const groupMap = new Map<string, HealthEvent[]>();

    for (const event of events) {
      const key = this.timeline.getMonthYear(event.date);
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(event);
    }

    return Array.from(groupMap.entries()).map(([monthYear, evts]) => ({
      monthYear,
      events: evts
    }));
  });

  getTypeMeta(type: HealthEventType) {
    return EVENT_TYPE_META[type];
  }
}
