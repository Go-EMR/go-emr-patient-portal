import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DevicesService, DeviceInfo, ActivityData, HealthGoal, SelectedPeriod } from '../data-access';

// SVG chart dimensions
const BAR_W = 560;
const BAR_H = 160;
const BAR_PAD_L = 40;
const BAR_PAD_R = 12;
const BAR_PAD_T = 12;
const BAR_PAD_B = 28;

const HR_W = 560;
const HR_H = 130;
const HR_PAD_L = 40;
const HR_PAD_R = 12;
const HR_PAD_T = 10;
const HR_PAD_B = 24;

const SLEEP_W = 560;
const SLEEP_H = 120;
const SLEEP_PAD_L = 40;
const SLEEP_PAD_R = 12;
const SLEEP_PAD_T = 10;
const SLEEP_PAD_B = 24;

interface BarSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  label: string;
  isToday: boolean;
}

interface HrPoint {
  x: number;
  y: number;
  avg: number;
  min: number;
  max: number;
  label: string;
}

interface SleepBar {
  x: number;
  y: number;
  width: number;
  height: number;
  hours: number;
  quality: string;
  label: string;
}

@Component({
  selector: 'app-devices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="devices-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-mobile"></i>
          </div>
          <div>
            <h1 class="page-title">Connected Devices</h1>
            <p class="page-subtitle">Monitor wearable sensors and sync health data with your care record</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="period-toggle">
            @for (opt of periodOptions; track opt.value) {
              <button
                class="period-btn"
                [class.active]="service.selectedPeriod() === opt.value"
                (click)="service.setSelectedPeriod(opt.value)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>
      </div>

      <!-- Summary Strip -->
      <div class="summary-strip">
        <div class="summary-item">
          <span class="summary-value">{{ service.connectedDevices().length }}</span>
          <span class="summary-label">Connected</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">{{ service.devices().length - service.connectedDevices().length }}</span>
          <span class="summary-label">Offline</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">{{ todaySteps() | number }}</span>
          <span class="summary-label">Today's Steps</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">{{ todayHr() }}</span>
          <span class="summary-label">Avg Heart Rate</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value">{{ todaySleep() }}h</span>
          <span class="summary-label">Last Sleep</span>
        </div>
      </div>

      <div class="main-grid">

        <!-- Left column -->
        <div class="left-col">

          <!-- Health Goals -->
          <section class="section-card">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-flag"></i> Health Goals</h2>
              <span class="section-sub">Today's progress</span>
            </div>
            <div class="goals-grid">
              @for (goal of service.healthGoals(); track goal.id) {
                @let pct = goalPercent(goal);
                @let circumference = 2 * 3.14159 * 36;
                @let dashoffset = circumference * (1 - pct / 100);
                <div class="goal-card">
                  <div class="goal-ring-wrap">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <!-- Track circle -->
                      <circle cx="44" cy="44" r="36"
                        fill="none"
                        stroke="var(--surface-200)"
                        stroke-width="7"/>
                      <!-- Progress circle -->
                      <circle cx="44" cy="44" r="36"
                        fill="none"
                        [attr.stroke]="goal.color"
                        stroke-width="7"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="circumference"
                        [attr.stroke-dashoffset]="dashoffset"
                        transform="rotate(-90 44 44)"
                        style="transition: stroke-dashoffset 0.6s ease"/>
                      <!-- Center icon -->
                      <foreignObject x="28" y="28" width="32" height="32">
                        <div class="goal-icon-inner" [style.color]="goal.color">
                          <i [class]="goal.icon"></i>
                        </div>
                      </foreignObject>
                    </svg>
                    <div class="goal-pct" [style.color]="goal.color">{{ pct }}%</div>
                  </div>
                  <div class="goal-info">
                    <div class="goal-name">{{ goal.name }}</div>
                    <div class="goal-values">
                      <span class="goal-current" [style.color]="goal.color">{{ formatGoalValue(goal.current, goal.unit) }}</span>
                      <span class="goal-sep">/</span>
                      <span class="goal-target">{{ formatGoalValue(goal.target, goal.unit) }} {{ goal.unit }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Device Cards -->
          <section class="section-card">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-wifi"></i> Paired Devices</h2>
              <span class="section-sub">{{ service.connectedDevices().length }} of {{ service.devices().length }} online</span>
            </div>
            <div class="devices-grid">
              @for (device of service.devices(); track device.id) {
                <div class="device-card" [class.device-connected]="device.connected">
                  <div class="device-card-header">
                    <div class="device-brand-icon" [class]="'brand-' + device.brand.toLowerCase().replace(' ', '')">
                      <i [class]="deviceTypeIcon(device.type)"></i>
                    </div>
                    <div class="device-status-dot" [class.status-connected]="device.connected" [class.status-offline]="!device.connected"></div>
                  </div>

                  <div class="device-name">{{ device.name }}</div>
                  <div class="device-model">{{ device.model }}</div>

                  <div class="device-meta">
                    <div class="device-sync">
                      <i class="pi pi-refresh"></i>
                      <span>{{ formatSyncTime(device.lastSyncAt) }}</span>
                    </div>
                    <div class="device-battery" [class.battery-low]="device.batteryLevel < 20">
                      <i [class]="batteryIcon(device.batteryLevel)"></i>
                      <span>{{ device.batteryLevel }}%</span>
                    </div>
                  </div>

                  <!-- Battery bar -->
                  <div class="battery-bar-track">
                    <div
                      class="battery-bar-fill"
                      [style.width.%]="device.batteryLevel"
                      [class.battery-bar-low]="device.batteryLevel < 20"
                      [class.battery-bar-med]="device.batteryLevel >= 20 && device.batteryLevel < 50"
                      [class.battery-bar-high]="device.batteryLevel >= 50"
                    ></div>
                  </div>

                  <div class="device-actions">
                    <button
                      pButton
                      [label]="device.connected ? 'Disconnect' : 'Connect'"
                      [icon]="device.connected ? 'pi pi-times' : 'pi pi-link'"
                      [class]="device.connected ? 'p-button-outlined p-button-danger p-button-sm' : 'p-button-sm'"
                      (click)="service.toggleConnection(device.id)"
                    ></button>
                    @if (device.connected) {
                      <button
                        pButton
                        icon="pi pi-refresh"
                        class="p-button-text p-button-sm p-button-secondary"
                        [class.syncing]="service.syncingDeviceId() === device.id"
                        [disabled]="service.syncingDeviceId() === device.id"
                        pTooltip="Sync now"
                        (click)="service.syncDevice(device.id)"
                      ></button>
                    }
                  </div>
                </div>
              }
            </div>
          </section>

        </div>

        <!-- Right column: Charts -->
        <div class="right-col">

          <!-- Steps Bar Chart -->
          <section class="section-card chart-section">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-chart-bar"></i> Daily Steps</h2>
              <span class="section-sub">Last 7 days</span>
            </div>
            <div class="chart-wrap">
              <svg
                class="activity-chart"
                [attr.viewBox]="'0 0 ' + BAR_W + ' ' + BAR_H"
                preserveAspectRatio="xMidYMid meet"
              >
                <!-- Y grid lines -->
                @for (gl of stepsGridLines(); track gl.y) {
                  <line
                    [attr.x1]="BAR_PAD_L"
                    [attr.y1]="gl.y"
                    [attr.x2]="BAR_W - BAR_PAD_R"
                    [attr.y2]="gl.y"
                    class="grid-line"
                  />
                  <text
                    [attr.x]="BAR_PAD_L - 4"
                    [attr.y]="gl.y + 4"
                    class="axis-label"
                    text-anchor="end"
                  >{{ gl.label }}</text>
                }
                <!-- Goal line -->
                @let goalY = stepsGoalY();
                @if (goalY !== null) {
                  <line
                    [attr.x1]="BAR_PAD_L"
                    [attr.y1]="goalY"
                    [attr.x2]="BAR_W - BAR_PAD_R"
                    [attr.y2]="goalY"
                    class="goal-line"
                  />
                  <text [attr.x]="BAR_W - BAR_PAD_R + 2" [attr.y]="goalY + 4" class="goal-label">Goal</text>
                }
                <!-- Bars -->
                @for (bar of stepsBarSegments(); track bar.label) {
                  <rect
                    [attr.x]="bar.x"
                    [attr.y]="bar.y"
                    [attr.width]="bar.width"
                    [attr.height]="bar.height"
                    [class]="bar.isToday ? 'bar-steps-today' : 'bar-steps'"
                    rx="3"
                  />
                  <text
                    [attr.x]="bar.x + bar.width / 2"
                    [attr.y]="BAR_H - BAR_PAD_B + 14"
                    class="bar-label"
                    text-anchor="middle"
                  >{{ bar.label }}</text>
                }
                <!-- Axes -->
                <line [attr.x1]="BAR_PAD_L" [attr.y1]="BAR_PAD_T" [attr.x2]="BAR_PAD_L" [attr.y2]="BAR_H - BAR_PAD_B" class="axis-line"/>
                <line [attr.x1]="BAR_PAD_L" [attr.y1]="BAR_H - BAR_PAD_B" [attr.x2]="BAR_W - BAR_PAD_R" [attr.y2]="BAR_H - BAR_PAD_B" class="axis-line"/>
              </svg>
            </div>
            <div class="chart-legend-row">
              <span class="legend-chip legend-today">Today</span>
              <span class="legend-chip legend-prev">Previous Days</span>
              <span class="legend-chip legend-goal">Goal: 10,000 steps</span>
            </div>
          </section>

          <!-- Heart Rate Chart -->
          <section class="section-card chart-section">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-heart-fill"></i> Heart Rate</h2>
              <span class="section-sub">Avg / range per day</span>
            </div>
            <div class="chart-wrap">
              <svg
                class="activity-chart"
                [attr.viewBox]="'0 0 ' + HR_W + ' ' + HR_H"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="hrGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.18"/>
                    <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0"/>
                  </linearGradient>
                </defs>
                <!-- Y grid lines -->
                @for (gl of hrGridLines(); track gl.y) {
                  <line [attr.x1]="HR_PAD_L" [attr.y1]="gl.y" [attr.x2]="HR_W - HR_PAD_R" [attr.y2]="gl.y" class="grid-line"/>
                  <text [attr.x]="HR_PAD_L - 4" [attr.y]="gl.y + 4" class="axis-label" text-anchor="end">{{ gl.label }}</text>
                }
                <!-- Range bars (min–max) -->
                @for (pt of hrPoints(); track pt.label) {
                  <rect
                    [attr.x]="pt.x - 4"
                    [attr.y]="hrToY(pt.max)"
                    width="8"
                    [attr.height]="hrToY(pt.min) - hrToY(pt.max)"
                    class="hr-range-bar"
                    rx="3"
                  />
                }
                <!-- Area under avg line -->
                @if (hrAreaPath()) {
                  <path [attr.d]="hrAreaPath()" fill="url(#hrGrad)"/>
                }
                <!-- Avg line -->
                @if (hrLinePath()) {
                  <path [attr.d]="hrLinePath()" class="hr-line" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                }
                <!-- Avg dots -->
                @for (pt of hrPoints(); track pt.label) {
                  <circle [attr.cx]="pt.x" [attr.cy]="hrToY(pt.avg)" r="4" class="hr-dot"/>
                  <text [attr.x]="pt.x" [attr.y]="HR_H - HR_PAD_B + 14" class="bar-label" text-anchor="middle">{{ pt.label }}</text>
                }
                <!-- Axes -->
                <line [attr.x1]="HR_PAD_L" [attr.y1]="HR_PAD_T" [attr.x2]="HR_PAD_L" [attr.y2]="HR_H - HR_PAD_B" class="axis-line"/>
                <line [attr.x1]="HR_PAD_L" [attr.y1]="HR_H - HR_PAD_B" [attr.x2]="HR_W - HR_PAD_R" [attr.y2]="HR_H - HR_PAD_B" class="axis-line"/>
              </svg>
            </div>
            <div class="chart-legend-row">
              <span class="legend-chip legend-hr-avg">Avg BPM</span>
              <span class="legend-chip legend-hr-range">Min–Max Range</span>
            </div>
          </section>

          <!-- Sleep Duration Chart -->
          <section class="section-card chart-section">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-moon"></i> Sleep Duration</h2>
              <span class="section-sub">Hours per night</span>
            </div>
            <div class="chart-wrap">
              <svg
                class="activity-chart"
                [attr.viewBox]="'0 0 ' + SLEEP_W + ' ' + SLEEP_H"
                preserveAspectRatio="xMidYMid meet"
              >
                <!-- Goal line at 8h -->
                @let sleepGoalY = sleepToY(8);
                <line [attr.x1]="SLEEP_PAD_L" [attr.y1]="sleepGoalY" [attr.x2]="SLEEP_W - SLEEP_PAD_R" [attr.y2]="sleepGoalY" class="goal-line"/>
                <text [attr.x]="SLEEP_W - SLEEP_PAD_R + 2" [attr.y]="sleepGoalY + 4" class="goal-label">8h</text>

                @for (bar of sleepBars(); track bar.label) {
                  <rect
                    [attr.x]="bar.x"
                    [attr.y]="bar.y"
                    [attr.width]="bar.width"
                    [attr.height]="bar.height"
                    [class]="'bar-sleep bar-sleep-' + bar.quality"
                    rx="3"
                  />
                  <text [attr.x]="bar.x + bar.width / 2" [attr.y]="bar.y - 3" class="sleep-val-label" text-anchor="middle">{{ bar.hours }}</text>
                  <text [attr.x]="bar.x + bar.width / 2" [attr.y]="SLEEP_H - SLEEP_PAD_B + 14" class="bar-label" text-anchor="middle">{{ bar.label }}</text>
                }
                <!-- Axes -->
                <line [attr.x1]="SLEEP_PAD_L" [attr.y1]="SLEEP_PAD_T" [attr.x2]="SLEEP_PAD_L" [attr.y2]="SLEEP_H - SLEEP_PAD_B" class="axis-line"/>
                <line [attr.x1]="SLEEP_PAD_L" [attr.y1]="SLEEP_H - SLEEP_PAD_B" [attr.x2]="SLEEP_W - SLEEP_PAD_R" [attr.y2]="SLEEP_H - SLEEP_PAD_B" class="axis-line"/>
                <!-- Y axis labels -->
                @for (h of [0, 4, 8]; track h) {
                  <text [attr.x]="SLEEP_PAD_L - 4" [attr.y]="sleepToY(h) + 4" class="axis-label" text-anchor="end">{{ h }}h</text>
                }
              </svg>
            </div>
            <div class="chart-legend-row">
              <span class="legend-chip legend-sleep-excellent">Excellent</span>
              <span class="legend-chip legend-sleep-good">Good</span>
              <span class="legend-chip legend-sleep-fair">Fair</span>
              <span class="legend-chip legend-sleep-poor">Poor</span>
            </div>
          </section>

          <!-- Weekly Summary -->
          <section class="section-card">
            <div class="section-header">
              <h2 class="section-title"><i class="pi pi-chart-line"></i> Weekly Summary</h2>
              <span class="section-sub">7-day averages</span>
            </div>
            <div class="weekly-stats">
              <div class="weekly-stat-card stat-steps">
                <i class="pi pi-directions weekly-stat-icon"></i>
                <div class="weekly-stat-value">{{ service.weeklyAverage().steps | number }}</div>
                <div class="weekly-stat-label">Avg Steps / Day</div>
              </div>
              <div class="weekly-stat-card stat-hr">
                <i class="pi pi-heart-fill weekly-stat-icon"></i>
                <div class="weekly-stat-value">{{ service.weeklyAverage().heartRateAvg }} <span class="stat-unit">bpm</span></div>
                <div class="weekly-stat-label">Avg Heart Rate</div>
              </div>
              <div class="weekly-stat-card stat-cal">
                <i class="pi pi-bolt weekly-stat-icon"></i>
                <div class="weekly-stat-value">{{ service.weeklyAverage().calories | number }}</div>
                <div class="weekly-stat-label">Avg Calories / Day</div>
              </div>
              <div class="weekly-stat-card stat-sleep">
                <i class="pi pi-moon weekly-stat-icon"></i>
                <div class="weekly-stat-value">{{ service.weeklyAverage().sleepHours }} <span class="stat-unit">hrs</span></div>
                <div class="weekly-stat-label">Avg Sleep / Night</div>
              </div>
            </div>
          </section>

          <!-- Provider Sharing -->
          <section class="section-card share-card">
            <div class="share-content">
              <div class="share-icon">
                <i class="pi pi-share-alt"></i>
              </div>
              <div class="share-text">
                <h3 class="share-title">Share data with your care team</h3>
                <p class="share-desc">Your connected device data can be automatically sent to your provider for review during appointments and care management.</p>
                <p class="share-consent">By enabling sharing, you consent to transmit activity, heart rate, sleep, and glucose data to your AuraHealth care team. Data is encrypted and governed by your signed HIPAA authorization.</p>
              </div>
              <div class="share-toggle">
                <div class="toggle-wrap" [class.toggle-active]="sharingEnabled()" (click)="toggleSharing()">
                  <div class="toggle-thumb"></div>
                </div>
                <span class="toggle-label">{{ sharingEnabled() ? 'Sharing On' : 'Sharing Off' }}</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== Page ===== */
    .devices-page {
      max-width: 1320px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
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

    /* ===== Period Toggle ===== */
    .period-toggle {
      display: flex;
      gap: 2px;
      background: var(--surface-100);
      border-radius: 20px;
      padding: 2px;
    }

    .period-btn {
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

    .period-btn.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-weight: 700;
    }

    .period-btn:hover:not(.active) {
      color: var(--text-color);
    }

    /* ===== Summary Strip ===== */
    .summary-strip {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      margin-bottom: 1.25rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .summary-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.875rem 0.5rem;
      gap: 0.2rem;
    }

    .summary-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .summary-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .summary-divider {
      width: 1px;
      height: 36px;
      background: var(--surface-border);
      flex-shrink: 0;
    }

    /* ===== Main Grid ===== */
    .main-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    .left-col, .right-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== Section Cards ===== */
    .section-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title i {
      color: var(--primary-color);
      font-size: 0.9rem;
    }

    .section-sub {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* ===== Health Goals ===== */
    .goals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.875rem;
    }

    .goal-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--surface-ground);
      border-radius: 10px;
      border: 1px solid var(--surface-border);
    }

    .goal-ring-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .goal-ring-wrap svg {
      display: block;
    }

    .goal-pct {
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--surface-card);
      padding: 0 3px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .goal-icon-inner {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .goal-info {
      flex: 1;
      min-width: 0;
    }

    .goal-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .goal-values {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      font-size: 0.75rem;
    }

    .goal-current {
      font-weight: 700;
      font-size: 0.9rem;
    }

    .goal-sep {
      color: var(--text-color-secondary);
    }

    .goal-target {
      color: var(--text-color-secondary);
      font-size: 0.72rem;
    }

    /* ===== Device Cards ===== */
    .devices-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .device-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 0.875rem 1rem;
      background: var(--surface-ground);
      transition: border-color 0.2s ease;
    }

    .device-card.device-connected {
      border-color: var(--green-200);
      background: var(--green-50, #f0fdf4);
    }

    .device-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .device-brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .brand-apple { background: #f3f4f6; color: #374151; }
    .brand-fitbit { background: #e0f2fe; color: #0369a1; }
    .brand-withings { background: #f0fdf4; color: #16a34a; }
    .brand-dexcom { background: #fef3c7; color: #d97706; }

    .device-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-connected { background: var(--green-500); box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
    .status-offline { background: var(--surface-300); }

    .device-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.15rem;
    }

    .device-model {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.625rem;
    }

    .device-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .device-sync, .device-battery {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .device-sync i, .device-battery i {
      font-size: 0.7rem;
    }

    .device-battery.battery-low {
      color: var(--red-500);
    }

    /* Battery bar */
    .battery-bar-track {
      height: 4px;
      background: var(--surface-200);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.625rem;
    }

    .battery-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .battery-bar-low { background: var(--red-500); }
    .battery-bar-med { background: var(--orange-400); }
    .battery-bar-high { background: var(--green-500); }

    .device-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .device-actions .p-button {
      font-size: 0.78rem;
    }

    /* ===== Charts ===== */
    .chart-section {
      padding: 1.125rem 1.25rem 0.875rem;
    }

    .chart-wrap {
      margin: 0 -0.25rem;
    }

    .activity-chart {
      width: 100%;
      height: auto;
      display: block;
    }

    /* SVG primitives */
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
      font-size: 9.5px;
      fill: var(--text-color-secondary);
      font-family: inherit;
    }

    .bar-label {
      font-size: 9px;
      fill: var(--text-color-secondary);
      font-family: inherit;
    }

    .goal-line {
      stroke: var(--primary-color);
      stroke-width: 1.5;
      stroke-dasharray: 5 4;
      opacity: 0.7;
    }

    .goal-label {
      font-size: 9px;
      fill: var(--primary-color);
      font-family: inherit;
      font-weight: 600;
    }

    /* Steps bars */
    .bar-steps { fill: var(--primary-200); }
    .bar-steps-today { fill: var(--primary-color); }

    /* HR chart */
    .hr-range-bar {
      fill: var(--red-100);
      opacity: 0.6;
    }

    .hr-line { stroke: var(--red-500); }
    .hr-dot { fill: var(--red-500); stroke: white; stroke-width: 2; }

    /* Sleep bars */
    .bar-sleep { transition: opacity 0.2s ease; }
    .bar-sleep-excellent { fill: var(--green-500); }
    .bar-sleep-good { fill: #0ea5e9; }
    .bar-sleep-fair { fill: var(--orange-400); }
    .bar-sleep-poor { fill: var(--red-400); }

    .sleep-val-label {
      font-size: 8.5px;
      fill: var(--text-color-secondary);
      font-family: inherit;
    }

    /* Chart legends */
    .chart-legend-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.625rem;
      flex-wrap: wrap;
    }

    .legend-chip {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-weight: 500;
    }

    .legend-today { background: var(--primary-50); color: var(--primary-700); border: 1px solid var(--primary-200); }
    .legend-prev { background: var(--surface-100); color: var(--text-color-secondary); border: 1px solid var(--surface-border); }
    .legend-goal { background: transparent; color: var(--primary-color); border: 1px dashed var(--primary-300); }

    .legend-hr-avg { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .legend-hr-range { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }

    .legend-sleep-excellent { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .legend-sleep-good { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .legend-sleep-fair { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    .legend-sleep-poor { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    /* ===== Weekly Stats ===== */
    .weekly-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.875rem;
    }

    .weekly-stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--surface-border);
    }

    .stat-steps { background: #eff6ff; border-color: #bfdbfe; }
    .stat-hr { background: #fef2f2; border-color: #fecaca; }
    .stat-cal { background: #fff7ed; border-color: #fed7aa; }
    .stat-sleep { background: #f5f3ff; border-color: #ddd6fe; }

    .weekly-stat-icon {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .stat-steps .weekly-stat-icon { color: #2563eb; }
    .stat-hr .weekly-stat-icon { color: #dc2626; }
    .stat-cal .weekly-stat-icon { color: #ea580c; }
    .stat-sleep .weekly-stat-icon { color: #7c3aed; }

    .weekly-stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .stat-unit {
      font-size: 0.72rem;
      font-weight: 400;
      color: var(--text-color-secondary);
    }

    .weekly-stat-label {
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 0.25rem;
    }

    /* ===== Provider Sharing ===== */
    .share-card {
      border-color: var(--blue-200);
      background: linear-gradient(135deg, var(--blue-50, #eff6ff), var(--surface-card));
    }

    .share-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .share-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--blue-500);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .share-text {
      flex: 1;
    }

    .share-title {
      margin: 0 0 0.35rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .share-desc {
      margin: 0 0 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .share-consent {
      margin: 0;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      opacity: 0.8;
    }

    .share-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      flex-shrink: 0;
      padding-top: 0.25rem;
    }

    .toggle-wrap {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: var(--surface-300);
      position: relative;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .toggle-wrap.toggle-active {
      background: var(--blue-500);
    }

    .toggle-thumb {
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      top: 3px;
      left: 3px;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .toggle-wrap.toggle-active .toggle-thumb {
      transform: translateX(20px);
    }

    .toggle-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1280px) {
      .main-grid {
        grid-template-columns: 360px 1fr;
      }
    }

    @media (max-width: 1024px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
      .weekly-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .summary-strip {
        flex-wrap: wrap;
      }
      .summary-divider {
        display: none;
      }
      .summary-item {
        min-width: calc(50% - 1px);
        border-bottom: 1px solid var(--surface-border);
      }
      .goals-grid {
        grid-template-columns: 1fr;
      }
      .share-content {
        flex-direction: column;
      }
      .share-toggle {
        flex-direction: row;
        align-self: stretch;
        justify-content: flex-start;
      }
    }

    @media (max-width: 480px) {
      .weekly-stats {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class DevicesComponent {
  readonly service = inject(DevicesService);

  // Expose SVG constants
  readonly BAR_W = BAR_W;
  readonly BAR_H = BAR_H;
  readonly BAR_PAD_L = BAR_PAD_L;
  readonly BAR_PAD_R = BAR_PAD_R;
  readonly BAR_PAD_T = BAR_PAD_T;
  readonly BAR_PAD_B = BAR_PAD_B;
  readonly HR_W = HR_W;
  readonly HR_H = HR_H;
  readonly HR_PAD_L = HR_PAD_L;
  readonly HR_PAD_R = HR_PAD_R;
  readonly HR_PAD_T = HR_PAD_T;
  readonly HR_PAD_B = HR_PAD_B;
  readonly SLEEP_W = SLEEP_W;
  readonly SLEEP_H = SLEEP_H;
  readonly SLEEP_PAD_L = SLEEP_PAD_L;
  readonly SLEEP_PAD_R = SLEEP_PAD_R;
  readonly SLEEP_PAD_T = SLEEP_PAD_T;
  readonly SLEEP_PAD_B = SLEEP_PAD_B;

  readonly periodOptions: { label: string; value: SelectedPeriod }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' }
  ];

  private readonly _sharingEnabled = signal(true);
  readonly sharingEnabled = this._sharingEnabled.asReadonly();

  // ===== Summary strip computeds =====

  readonly todaySteps = computed(() => this.service.todayActivity()?.steps ?? 0);
  readonly todayHr = computed(() => {
    const a = this.service.todayActivity();
    return a ? `${a.heartRateAvg} bpm` : '--';
  });
  readonly todaySleep = computed(() => this.service.todayActivity()?.sleepHours ?? '--');

  // ===== Steps bar chart =====

  readonly stepsBarSegments = computed<BarSegment[]>(() => {
    const data = this.service.activityData();
    if (data.length === 0) return [];

    const maxVal = Math.max(...data.map(d => d.steps), 10000);
    const plotW = BAR_W - BAR_PAD_L - BAR_PAD_R;
    const plotH = BAR_H - BAR_PAD_T - BAR_PAD_B;
    const barGroupW = plotW / data.length;
    const barW = Math.max(4, barGroupW * 0.55);
    const todayDate = new Date(2026, 1, 21);
    todayDate.setHours(0, 0, 0, 0);

    return data.map((d, i) => {
      const barH = (d.steps / maxVal) * plotH;
      const x = BAR_PAD_L + i * barGroupW + (barGroupW - barW) / 2;
      const y = BAR_PAD_T + plotH - barH;
      const dayDate = new Date(d.date);
      dayDate.setHours(0, 0, 0, 0);
      const isToday = dayDate.getTime() === todayDate.getTime();
      return {
        x,
        y,
        width: barW,
        height: barH,
        value: d.steps,
        label: this._shortDay(d.date),
        isToday
      };
    });
  });

  readonly stepsGridLines = computed(() => {
    const data = this.service.activityData();
    const maxVal = Math.max(...data.map(d => d.steps), 10000);
    const plotH = BAR_H - BAR_PAD_T - BAR_PAD_B;
    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    return steps.map(frac => ({
      y: BAR_PAD_T + plotH - frac * plotH,
      label: frac === 0 ? '0' : `${Math.round(maxVal * frac / 1000)}k`
    }));
  });

  readonly stepsGoalY = computed<number | null>(() => {
    const data = this.service.activityData();
    const maxVal = Math.max(...data.map(d => d.steps), 10000);
    const plotH = BAR_H - BAR_PAD_T - BAR_PAD_B;
    const goalFrac = 10000 / maxVal;
    if (goalFrac > 1) return null;
    return BAR_PAD_T + plotH - goalFrac * plotH;
  });

  // ===== HR chart =====

  readonly hrPoints = computed<HrPoint[]>(() => {
    const data = this.service.activityData();
    if (data.length === 0) return [];
    const plotW = HR_W - HR_PAD_L - HR_PAD_R;
    const n = data.length;

    return data.map((d, i) => {
      const x = HR_PAD_L + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
      return {
        x,
        y: 0,
        avg: d.heartRateAvg,
        min: d.heartRateMin,
        max: d.heartRateMax,
        label: this._shortDay(d.date)
      };
    });
  });

  readonly hrGridLines = computed(() => {
    const vals = [50, 75, 100, 125, 150, 175];
    return vals.map(v => ({ y: this.hrToY(v), label: `${v}` }));
  });

  readonly hrLinePath = computed<string>(() => {
    const pts = this.hrPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${this.hrToY(p.avg).toFixed(1)}`).join(' ');
  });

  readonly hrAreaPath = computed<string>(() => {
    const pts = this.hrPoints();
    if (pts.length === 0) return '';
    const bottom = HR_H - HR_PAD_B;
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${this.hrToY(p.avg).toFixed(1)}`).join(' ');
    return `${line} L ${pts[pts.length - 1].x.toFixed(1)},${bottom} L ${pts[0].x.toFixed(1)},${bottom} Z`;
  });

  hrToY(bpm: number): number {
    const minBpm = 45;
    const maxBpm = 185;
    const plotH = HR_H - HR_PAD_T - HR_PAD_B;
    return HR_PAD_T + plotH - ((bpm - minBpm) / (maxBpm - minBpm)) * plotH;
  }

  // ===== Sleep chart =====

  readonly sleepBars = computed<SleepBar[]>(() => {
    const data = this.service.activityData();
    if (data.length === 0) return [];
    const maxH = 10;
    const plotW = SLEEP_W - SLEEP_PAD_L - SLEEP_PAD_R;
    const plotH = SLEEP_H - SLEEP_PAD_T - SLEEP_PAD_B;
    const n = data.length;
    const barGroupW = plotW / n;
    const barW = Math.max(4, barGroupW * 0.55);

    return data.map((d, i) => {
      const frac = d.sleepHours / maxH;
      const h = frac * plotH;
      return {
        x: SLEEP_PAD_L + i * barGroupW + (barGroupW - barW) / 2,
        y: SLEEP_PAD_T + plotH - h,
        width: barW,
        height: h,
        hours: d.sleepHours,
        quality: d.sleepQuality,
        label: this._shortDay(d.date)
      };
    });
  });

  sleepToY(hours: number): number {
    const maxH = 10;
    const plotH = SLEEP_H - SLEEP_PAD_T - SLEEP_PAD_B;
    return SLEEP_PAD_T + plotH - (hours / maxH) * plotH;
  }

  // ===== Goal helpers =====

  goalPercent(goal: HealthGoal): number {
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  formatGoalValue(value: number, unit: string): string {
    if (unit === 'steps' || unit === 'kcal') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
    }
    return `${value}`;
  }

  // ===== Device helpers =====

  deviceTypeIcon(type: DeviceInfo['type']): string {
    const icons: Record<DeviceInfo['type'], string> = {
      'smartwatch': 'pi pi-clock',
      'fitness-tracker': 'pi pi-heart',
      'blood-pressure': 'pi pi-heart-fill',
      'glucose-monitor': 'pi pi-chart-line',
      'scale': 'pi pi-sliders-h'
    };
    return icons[type];
  }

  batteryIcon(level: number): string {
    if (level < 20) return 'pi pi-battery-0';
    if (level < 50) return 'pi pi-battery-1';
    if (level < 80) return 'pi pi-battery-2';
    return 'pi pi-battery-3';
  }

  formatSyncTime(date: Date): string {
    const now = new Date(2026, 1, 21, 9, 5);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  }

  toggleSharing(): void {
    this._sharingEnabled.update(v => !v);
  }

  // ===== Private helpers =====

  private _shortDay(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
