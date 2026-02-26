import { Component, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { QueueStatusService, QueueStage } from '../data-access/queue-status.service';

@Component({
  selector: 'app-queue-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, CardModule, ButtonModule, ProgressBarModule, TagModule, TooltipModule],
  template: `
    <div class="queue-page" role="main" aria-labelledby="queue-title">

      <!-- Page header -->
      <div class="page-header">
        <div class="header-left">
          <h1 id="queue-title" class="page-title">
            <i class="pi pi-clock" aria-hidden="true"></i>
            Queue Status
          </h1>
          <p class="page-subtitle">Track your position and estimated wait time</p>
        </div>
        <button
          pButton
          icon="pi pi-refresh"
          [label]="svc.isLoading() ? 'Refreshing...' : 'Refresh'"
          class="p-button-outlined p-button-sm refresh-btn"
          [loading]="svc.isLoading()"
          (click)="svc.refresh()"
          [pTooltip]="'Last updated: ' + formatTime(svc.lastRefreshed())"
          tooltipPosition="left"
          aria-label="Refresh queue status">
        </button>
      </div>

      <!-- Arrived notice -->
      @if (!svc.status().hasArrived) {
        <div class="arrived-banner" role="status" aria-live="polite">
          <i class="pi pi-info-circle" aria-hidden="true"></i>
          <div class="arrived-text">
            <strong>You've checked in remotely.</strong>
            <span>Please press "I've Arrived" when you're physically at the clinic.</span>
          </div>
          <button
            pButton
            label="I've Arrived"
            icon="pi pi-map-marker"
            class="arrived-btn"
            [loading]="svc.isLoading()"
            (click)="svc.markArrived()"
            aria-label="Mark yourself as arrived at the clinic">
          </button>
        </div>
      } @else {
        <div class="present-banner" role="status" aria-live="polite">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <span>You're checked in and present. A staff member will call your number shortly.</span>
        </div>
      }

      <div class="queue-grid">

        <!-- Token & Position card -->
        <div class="token-card" role="region" aria-label="Your queue token and position">
          <div class="token-top">
            <div class="token-section">
              <div class="section-eyebrow">Token Number</div>
              <div class="token-number" aria-label="Token {{ svc.status().tokenNumber }}">
                {{ svc.status().tokenNumber }}
              </div>
            </div>
            <div class="divider-vert" aria-hidden="true"></div>
            <div class="position-section">
              <div class="section-eyebrow">Queue Position</div>
              <div class="position-display" [class.urgent]="svc.status().position <= 2">
                <span class="position-num" aria-label="Position {{ svc.ordinalPosition() }} in queue">
                  {{ svc.ordinalPosition() }}
                </span>
                <span class="position-label">in line</span>
              </div>
            </div>
          </div>

          <!-- Queue progress bar -->
          <div class="queue-progress" aria-label="Queue progress">
            <div class="progress-labels">
              <span class="progress-label-left">
                <i class="pi pi-users" aria-hidden="true"></i>
                {{ svc.status().position - 1 }} ahead of you
              </span>
              <span class="progress-label-right">
                {{ svc.status().totalInQueue - svc.status().position }} behind you
              </span>
            </div>
            <div class="progress-track" role="progressbar"
              [attr.aria-valuenow]="svc.queueProgressPercent()"
              aria-valuemin="0" aria-valuemax="100"
              [attr.aria-label]="'Queue position: ' + svc.queueProgressPercent() + '% served'">
              <div class="progress-fill" [style.width.%]="svc.queueProgressPercent()"></div>
              <div class="progress-marker" [style.left.%]="svc.queueProgressPercent()" aria-hidden="true">
                <i class="pi pi-map-marker"></i>
              </div>
            </div>
            <div class="queue-icons" aria-hidden="true">
              @for (i of queueSlots(); track $index) {
                <div
                  class="queue-slot"
                  [class.filled]="i <= svc.status().totalInQueue"
                  [class.mine]="i === svc.status().position">
                  <i class="pi" [class]="i === svc.status().position ? 'pi-map-marker' : 'pi-circle-fill'"></i>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Wait time card -->
        <div class="wait-card" role="region" aria-label="Estimated wait time">
          <div class="wait-icon-wrap" aria-hidden="true">
            <div class="wait-ring" [class.urgent]="svc.status().estimatedWaitMinutes < 5">
              <svg class="ring-svg" viewBox="0 0 80 80" aria-hidden="true">
                <circle class="ring-bg" cx="40" cy="40" r="34" />
                <circle class="ring-prog" cx="40" cy="40" r="34"
                  [style.stroke-dashoffset]="ringOffset()"
                  [style.stroke]="svc.status().estimatedWaitMinutes < 5 ? '#16a34a' : 'var(--teal-500)'" />
              </svg>
              <div class="ring-content">
                <span class="ring-minutes">{{ svc.status().estimatedWaitMinutes }}</span>
                <span class="ring-unit">min</span>
              </div>
            </div>
          </div>
          <div class="wait-label">Estimated Wait</div>
          <div class="wait-sublabel" aria-live="polite">{{ svc.estimatedTimeLabel() }}</div>
          <div class="wait-checkin-time">
            <i class="pi pi-clock" aria-hidden="true"></i>
            Checked in at {{ formatTime(svc.status().checkInTime) }}
          </div>
        </div>

        <!-- Status Timeline -->
        <div class="timeline-card" role="region" aria-label="Check-in status stages">
          <h2 class="card-title">
            <i class="pi pi-list-check" aria-hidden="true"></i>
            Status Progress
          </h2>
          <div class="timeline" role="list">
            @for (stage of stages; track stage.key) {
              <div
                class="timeline-item"
                [class.completed]="isStageCompleted(stage.key)"
                [class.active]="svc.status().stage === stage.key"
                role="listitem"
                [attr.aria-label]="stage.label + (isStageCompleted(stage.key) ? ', completed' : svc.status().stage === stage.key ? ', current' : '')">
                <div class="timeline-dot" aria-hidden="true">
                  @if (isStageCompleted(stage.key) && svc.status().stage !== stage.key) {
                    <i class="pi pi-check"></i>
                  } @else if (svc.status().stage === stage.key) {
                    <div class="pulse-dot"></div>
                  } @else {
                    <div class="idle-dot"></div>
                  }
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">{{ stage.label }}</div>
                  <div class="timeline-desc">{{ stage.desc }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Provider & Dept card -->
        <div class="provider-card" role="region" aria-label="Provider and department information">
          <h2 class="card-title">
            <i class="pi pi-user" aria-hidden="true"></i>
            Your Appointment
          </h2>

          <div class="provider-profile">
            <div class="provider-avatar" aria-hidden="true">SJ</div>
            <div class="provider-info">
              <div class="provider-name">{{ svc.status().providerName }}</div>
              <div class="provider-specialty">{{ svc.status().providerSpecialty }}</div>
            </div>
          </div>

          <div class="dept-info" role="group" aria-label="Department information">
            <div class="dept-item">
              <i class="pi pi-building" aria-hidden="true"></i>
              <div>
                <div class="dept-label">Department</div>
                <div class="dept-value">{{ svc.status().department }}</div>
              </div>
            </div>
            <div class="dept-item">
              <i class="pi pi-tag" aria-hidden="true"></i>
              <div>
                <div class="dept-label">Your Stage</div>
                <p-tag [value]="stageLabelMap[svc.status().stage]" [severity]="stageSeverity(svc.status().stage)"></p-tag>
              </div>
            </div>
          </div>

          <div class="refresh-note" aria-live="polite" aria-atomic="true">
            <i class="pi pi-sync" aria-hidden="true"></i>
            Auto-refreshes every 30 seconds &middot; Last: {{ formatTime(svc.lastRefreshed()) }}
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .queue-page {
      max-width: 900px;
      margin: 0 auto;
    }

    /* Page header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 0.25rem;
    }

    .page-title i {
      color: var(--teal-600);
    }

    .page-subtitle {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    /* Arrived banner */
    .arrived-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--blue-50);
      border: 1px solid var(--blue-200);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }

    .arrived-banner > i {
      font-size: 1.5rem;
      color: var(--blue-600);
      flex-shrink: 0;
    }

    .arrived-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .arrived-text strong {
      font-size: 0.9rem;
      color: var(--blue-900);
    }

    .arrived-text span {
      font-size: 0.8rem;
      color: var(--blue-700);
    }

    .arrived-btn {
      flex-shrink: 0;
      background: var(--blue-600);
      border: none;
    }

    .present-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--green-50);
      border: 1px solid var(--green-200);
      border-radius: 10px;
      padding: 0.875rem 1.25rem;
      margin-bottom: 1.25rem;
      color: var(--green-800);
      font-size: 0.875rem;
    }

    .present-banner i {
      font-size: 1.25rem;
      color: var(--green-600);
    }

    /* Grid layout */
    .queue-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 1.25rem;
    }

    /* Shared card base */
    .token-card,
    .wait-card,
    .timeline-card,
    .provider-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 1.25rem;
    }

    .card-title i {
      color: var(--teal-600);
    }

    /* Token card */
    .token-card {
      grid-column: 1;
    }

    .token-top {
      display: flex;
      align-items: stretch;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .token-section,
    .position-section {
      flex: 1;
    }

    .divider-vert {
      width: 1px;
      background: var(--surface-border);
      align-self: stretch;
    }

    .section-eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
      margin-bottom: 0.5rem;
    }

    .token-number {
      font-size: 2.75rem;
      font-weight: 900;
      color: var(--teal-700);
      letter-spacing: 0.03em;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .position-display {
      display: flex;
      align-items: baseline;
      gap: 0.375rem;
    }

    .position-num {
      font-size: 2.75rem;
      font-weight: 900;
      color: var(--text-color);
      line-height: 1;
      transition: color 0.3s ease;
    }

    .position-display.urgent .position-num {
      color: var(--green-600);
      animation: pulseGreen 1.5s ease-in-out infinite;
    }

    @keyframes pulseGreen {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.7; }
    }

    .position-label {
      font-size: 1rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    /* Queue progress */
    .queue-progress { }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.5rem;
    }

    .progress-label-left {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .progress-track {
      position: relative;
      height: 8px;
      background: var(--surface-200);
      border-radius: 4px;
      overflow: visible;
      margin-bottom: 0.875rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--teal-400), var(--teal-600));
      border-radius: 4px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      color: var(--teal-600);
      font-size: 1rem;
      transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }

    .queue-icons {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .queue-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: var(--surface-300);
      transition: color 0.3s ease;
    }

    .queue-slot.filled {
      color: var(--teal-200);
    }

    .queue-slot.mine {
      color: var(--teal-600);
      font-size: 0.85rem;
    }

    /* Wait card */
    .wait-card {
      grid-column: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .wait-icon-wrap {
      margin-bottom: 0.75rem;
    }

    .wait-ring {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .ring-svg {
      width: 120px;
      height: 120px;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: var(--surface-200);
      stroke-width: 8;
    }

    .ring-prog {
      fill: none;
      stroke: var(--teal-500);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 213.6;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease;
    }

    .ring-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .ring-minutes {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-color);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .ring-unit {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .wait-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .wait-sublabel {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--teal-700);
      margin-bottom: 0.75rem;
    }

    .wait-checkin-time {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: auto;
    }

    /* Timeline card */
    .timeline-card {
      grid-column: 1;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem 0;
      position: relative;
      opacity: 0.4;
      transition: opacity 0.3s ease;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 15px;
      top: calc(0.75rem + 16px);
      bottom: calc(-0.75rem + 16px);
      width: 2px;
      background: var(--surface-border);
    }

    .timeline-item.completed,
    .timeline-item.active {
      opacity: 1;
    }

    .timeline-item.completed::after {
      background: var(--teal-400);
    }

    .timeline-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .timeline-item.completed .timeline-dot {
      border-color: var(--teal-500);
      background: var(--teal-500);
      color: white;
    }

    .timeline-item.active .timeline-dot {
      border-color: var(--teal-500);
      box-shadow: 0 0 0 4px var(--teal-100);
    }

    .timeline-item.completed .timeline-dot i {
      font-size: 0.75rem;
      color: white;
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--teal-500);
      animation: pulseDot 1.5s ease-in-out infinite;
    }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.3); opacity: 0.7; }
    }

    .idle-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--surface-300);
    }

    .timeline-content { flex: 1; min-width: 0; }

    .timeline-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.125rem;
    }

    .timeline-desc {
      font-size: 0.775rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }

    /* Provider card */
    .provider-card {
      grid-column: 2;
    }

    .provider-profile {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .provider-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .provider-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-color);
    }

    .provider-specialty {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .dept-info {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .dept-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .dept-item > i {
      color: var(--teal-600);
      font-size: 1rem;
      margin-top: 0.15rem;
      flex-shrink: 0;
    }

    .dept-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .dept-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-color);
    }

    .refresh-note {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      border-top: 1px solid var(--surface-border);
      padding-top: 0.875rem;
      margin-top: auto;
    }

    .refresh-note i {
      font-size: 0.75rem;
    }

    @media (max-width: 720px) {
      .queue-grid {
        grid-template-columns: 1fr;
      }
      .token-card, .wait-card, .timeline-card, .provider-card {
        grid-column: 1;
      }
      .arrived-banner { flex-wrap: wrap; }
      .arrived-btn { width: 100%; }
    }
  `]
})
export class QueueStatusComponent implements OnInit {
  readonly svc = inject(QueueStatusService);

  readonly stages = [
    {
      key: 'checked-in' as const,
      label: 'Checked In',
      desc: 'Your check-in has been received by the front desk.',
    },
    {
      key: 'in-queue' as const,
      label: 'In Queue',
      desc: 'You are in the waiting queue for your provider.',
    },
    {
      key: 'being-called' as const,
      label: 'Being Called',
      desc: 'Your name is being called — please proceed to the desk.',
    },
    {
      key: 'with-provider' as const,
      label: 'With Provider',
      desc: 'You are currently in your appointment.',
    },
  ];

  readonly stageLabelMap: Record<QueueStage, string> = {
    'checked-in':    'Checked In',
    'in-queue':      'In Queue',
    'being-called':  'Being Called',
    'with-provider': 'With Provider',
  };

  queueSlots = computed(() => {
    const total = Math.max(10, this.svc.status().totalInQueue);
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  isStageCompleted(key: QueueStage): boolean {
    const order: QueueStage[] = ['checked-in', 'in-queue', 'being-called', 'with-provider'];
    return order.indexOf(key) <= order.indexOf(this.svc.status().stage);
  }

  stageSeverity(stage: QueueStage): 'success' | 'info' | 'warn' | 'danger' | undefined {
    switch (stage) {
      case 'checked-in':    return 'info';
      case 'in-queue':      return 'warn';
      case 'being-called':  return 'danger';
      case 'with-provider': return 'success';
      default:              return undefined;
    }
  }

  /** SVG ring: circumference = 2 * pi * 34 ≈ 213.6; offset goes from full to 0 as wait decreases */
  ringOffset = computed(() => {
    const maxWait = 60;
    const mins = this.svc.status().estimatedWaitMinutes;
    const pct = Math.min(mins / maxWait, 1);
    return 213.6 * pct;
  });

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  ngOnInit(): void {
    // Service auto-refreshes; nothing extra needed on init
  }
}
