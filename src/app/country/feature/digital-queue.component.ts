import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToggleButtonModule } from 'primeng/togglebutton';

interface Department {
  label: string;
  value: string;
  avgWait: string;
  currentQueue: number;
}

interface QueueHistoryItem {
  date: string;
  department: string;
  tokenNumber: string;
  servedAt: string;
  waitTime: string;
  provider: string;
}

@Component({
  selector: 'app-digital-queue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, SelectModule, DividerModule, TableModule, ProgressBarModule, ToggleButtonModule],
  template: `
    <div class="queue-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-list-check"></i>
          </div>
          <div>
            <h1>Digital Queue</h1>
            <p>Manage your OPD queue position and wait time at the hospital</p>
          </div>
        </div>
      </header>

      <!-- Select Department -->
      <p-card header="Select Department" styleClass="department-card">
        <div class="department-select-row">
          <p-select
            [options]="departments"
            [(ngModel)]="selectedDepartmentValue"
            optionLabel="label"
            optionValue="value"
            placeholder="Choose a department"
            [style]="{ width: '100%', maxWidth: '380px' }"
            (onChange)="onDepartmentChange()"
          ></p-select>
          @if (selectedDepartmentInfo()) {
            <div class="dept-meta">
              <span class="dept-queue-count">
                <i class="pi pi-users"></i>
                {{ selectedDepartmentInfo()!.currentQueue }} patients in queue
              </span>
              <span class="dept-avg-wait">
                <i class="pi pi-clock"></i>
                Avg. wait: {{ selectedDepartmentInfo()!.avgWait }}
              </span>
            </div>
          }
        </div>
      </p-card>

      <!-- Queue Status -->
      @if (isInQueue()) {
        <div class="queue-status-panel">
          <div class="queue-status-header">
            <h2>Your Queue Status</h2>
            <p-tag [value]="queueStatus()" severity="info"></p-tag>
          </div>

          <div class="queue-numbers-grid">
            <div class="queue-number-card your-number">
              <span class="qn-label">Your Token</span>
              <span class="qn-number">{{ yourTokenNumber() }}</span>
              <span class="qn-dept">{{ currentDepartmentName() }}</span>
            </div>
            <div class="queue-number-card serving">
              <span class="qn-label">Now Serving</span>
              <span class="qn-number serving-num">{{ nowServing() }}</span>
              <span class="qn-dept">{{ estimatedWait() }} remaining</span>
            </div>
            <div class="queue-number-card position">
              <span class="qn-label">Your Position</span>
              <span class="qn-number position-num">{{ queuePosition() }}</span>
              <span class="qn-dept">ahead of you</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="queue-progress-section">
            <div class="progress-labels">
              <span>Queue started</span>
              <span>Your turn</span>
            </div>
            <p-progressBar
              [value]="queueProgressPercent()"
              [showValue]="false"
              styleClass="queue-progress-bar"
            ></p-progressBar>
            <p class="progress-hint">
              <i class="pi pi-info-circle"></i>
              We will notify you when 2 patients are ahead of you
            </p>
          </div>

          <!-- Push Notifications -->
          <div class="notification-pref">
            <div class="notif-label">
              <i class="pi pi-bell"></i>
              <div>
                <span class="notif-title">Push Notifications</span>
                <span class="notif-desc">Get notified when it's almost your turn</span>
              </div>
            </div>
            <p-toggleButton
              [(ngModel)]="notificationsEnabled"
              onLabel="On"
              offLabel="Off"
              onIcon="pi pi-bell"
              offIcon="pi pi-bell-slash"
            ></p-toggleButton>
          </div>

          <div class="queue-actions">
            <button
              pButton
              label="Leave Queue"
              icon="pi pi-times"
              class="p-button-danger p-button-outlined"
              (click)="leaveQueue()"
            ></button>
            <button
              pButton
              label="Refresh Status"
              icon="pi pi-refresh"
              class="p-button-outlined"
              (click)="refreshStatus()"
            ></button>
          </div>
        </div>
      } @else {
        <!-- Join Queue -->
        <p-card styleClass="join-card">
          @if (selectedDepartmentValue) {
            <div class="join-content">
              <div class="join-icon">
                <i class="pi pi-list-check"></i>
              </div>
              <h3>Ready to join the {{ currentDepartmentName() }} queue?</h3>
              <p>
                There are currently <strong>{{ selectedDepartmentInfo()?.currentQueue ?? 0 }} patients</strong>
                waiting. Estimated wait time is <strong>{{ selectedDepartmentInfo()?.avgWait ?? 'N/A' }}</strong>.
              </p>
              <button
                pButton
                label="Join Queue"
                icon="pi pi-plus-circle"
                class="p-button-lg"
                (click)="joinQueue()"
              ></button>
            </div>
          } @else {
            <div class="empty-state">
              <i class="pi pi-list-check"></i>
              <h3>Select a Department to Join Queue</h3>
              <p>Choose the department you are visiting today to get your digital token.</p>
            </div>
          }
        </p-card>
      }

      <p-divider></p-divider>

      <!-- Queue History -->
      <p-card header="Queue History" styleClass="history-card">
        <p-table
          [value]="queueHistory()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Date</th>
              <th>Department</th>
              <th>Token</th>
              <th>Served At</th>
              <th>Wait Time</th>
              <th>Provider</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.date }}</td>
              <td>{{ item.department }}</td>
              <td><span class="token-badge">{{ item.tokenNumber }}</span></td>
              <td>{{ item.servedAt }}</td>
              <td>{{ item.waitTime }}</td>
              <td>{{ item.provider }}</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
  styles: [`
    .queue-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--cyan-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--cyan-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .department-select-row { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .dept-meta { display: flex; gap: 1.25rem; }
    .dept-queue-count, .dept-avg-wait { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .dept-queue-count i, .dept-avg-wait i { color: var(--primary-400); }
    .queue-status-panel { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); padding: 1.5rem; margin: 1rem 0; }
    .queue-status-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .queue-status-header h2 { margin: 0; font-size: 1.15rem; }
    .queue-numbers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .queue-number-card { display: flex; flex-direction: column; align-items: center; padding: 1.25rem 1rem; border-radius: 10px; border: 1px solid var(--surface-border); text-align: center; gap: 0.3rem; }
    .queue-number-card.your-number { background: var(--primary-50); border-color: var(--primary-200); }
    .queue-number-card.serving { background: var(--green-50); border-color: var(--green-200); }
    .queue-number-card.position { background: var(--orange-50); border-color: var(--orange-200); }
    .qn-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }
    .qn-number { font-size: 2.5rem; font-weight: 800; color: var(--primary-700); line-height: 1; }
    .serving-num { color: var(--green-700); }
    .position-num { color: var(--orange-700); }
    .qn-dept { font-size: 0.8rem; color: var(--text-color-secondary); }
    .queue-progress-section { margin-bottom: 1.25rem; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-color-secondary); margin-bottom: 0.4rem; }
    .queue-progress-bar { height: 10px !important; border-radius: 5px !important; }
    .progress-hint { font-size: 0.8rem; color: var(--text-color-secondary); margin: 0.5rem 0 0; display: flex; align-items: center; gap: 0.35rem; }
    .progress-hint i { font-size: 0.75rem; color: var(--primary-400); }
    .notification-pref { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; background: var(--surface-ground); border-radius: var(--border-radius); border: 1px solid var(--surface-border); margin-bottom: 1.25rem; }
    .notif-label { display: flex; align-items: center; gap: 0.75rem; }
    .notif-label i { font-size: 1.1rem; color: var(--primary-400); }
    .notif-title { display: block; font-weight: 500; font-size: 0.9rem; }
    .notif-desc { display: block; font-size: 0.8rem; color: var(--text-color-secondary); }
    .queue-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .join-content { display: flex; flex-direction: column; align-items: center; padding: 1.5rem; text-align: center; gap: 0.75rem; }
    .join-icon { width: 64px; height: 64px; background: var(--cyan-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .join-icon i { font-size: 1.75rem; color: var(--cyan-600); }
    .join-content h3 { margin: 0; font-size: 1.1rem; }
    .join-content p { margin: 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; text-align: center; gap: 0.75rem; color: var(--text-color-secondary); }
    .empty-state i { font-size: 3rem; color: var(--surface-400); }
    .empty-state h3 { margin: 0; color: var(--text-color); }
    .empty-state p { margin: 0; max-width: 360px; font-size: 0.875rem; }
    .token-badge { display: inline-flex; align-items: center; justify-content: center; background: var(--primary-100); color: var(--primary-700); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.875rem; }
    @media (max-width: 640px) {
      .queue-numbers-grid { grid-template-columns: 1fr; }
      .dept-meta { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class DigitalQueueComponent {
  readonly departments: Department[] = [
    { label: 'Cardiology', value: 'cardiology', avgWait: '45 min', currentQueue: 12 },
    { label: 'Internal Medicine', value: 'internal_medicine', avgWait: '30 min', currentQueue: 8 },
    { label: 'Laboratory', value: 'lab', avgWait: '20 min', currentQueue: 5 },
    { label: 'Pharmacy', value: 'pharmacy', avgWait: '15 min', currentQueue: 3 },
    { label: 'Radiology', value: 'radiology', avgWait: '35 min', currentQueue: 7 },
    { label: 'Orthopaedics', value: 'orthopaedics', avgWait: '50 min', currentQueue: 10 },
    { label: 'Neurology', value: 'neurology', avgWait: '40 min', currentQueue: 6 },
    { label: 'General OPD', value: 'general', avgWait: '25 min', currentQueue: 15 }
  ];

  selectedDepartmentValue = '';
  notificationsEnabled = true;

  readonly isInQueue = signal(false);
  readonly yourTokenNumber = signal('');
  readonly nowServing = signal(0);
  readonly queuePosition = signal(0);
  readonly estimatedWait = signal('');
  readonly queueStatus = signal('Waiting');

  readonly selectedDepartmentInfo = computed(() =>
    this.departments.find(d => d.value === this.selectedDepartmentValue) ?? null
  );

  readonly currentDepartmentName = computed(() =>
    this.selectedDepartmentInfo()?.label ?? ''
  );

  readonly queueProgressPercent = computed(() => {
    const pos = this.queuePosition();
    const dept = this.selectedDepartmentInfo();
    if (!dept || pos === 0) return 90;
    const total = dept.currentQueue;
    return Math.round(((total - pos) / total) * 100);
  });

  readonly queueHistory = signal<QueueHistoryItem[]>([
    { date: '14 Feb 2026', department: 'Cardiology', tokenNumber: 'A-042', servedAt: '11:35 AM', waitTime: '38 min', provider: 'Dr. Radu Popescu' },
    { date: '28 Jan 2026', department: 'Laboratory', tokenNumber: 'L-015', servedAt: '09:20 AM', waitTime: '18 min', provider: 'Lab Technician' },
    { date: '10 Dec 2025', department: 'Internal Medicine', tokenNumber: 'B-027', servedAt: '14:10 PM', waitTime: '32 min', provider: 'Dr. Elena Ionescu' },
    { date: '05 Nov 2025', department: 'General OPD', tokenNumber: 'G-061', servedAt: '10:55 AM', waitTime: '42 min', provider: 'Dr. Mihai Voicu' }
  ]);

  onDepartmentChange(): void {
    // Reset queue state when department changes
    if (this.isInQueue()) {
      this.isInQueue.set(false);
    }
  }

  joinQueue(): void {
    const dept = this.selectedDepartmentInfo();
    if (!dept) return;
    const tokenLetter = dept.value.charAt(0).toUpperCase();
    const tokenNum = dept.currentQueue + 1;
    this.yourTokenNumber.set(`${tokenLetter}-${String(tokenNum).padStart(3, '0')}`);
    this.nowServing.set(Math.max(1, tokenNum - dept.currentQueue));
    this.queuePosition.set(dept.currentQueue);
    this.estimatedWait.set(dept.avgWait);
    this.queueStatus.set('Waiting');
    this.isInQueue.set(true);
  }

  leaveQueue(): void {
    this.isInQueue.set(false);
    this.yourTokenNumber.set('');
  }

  refreshStatus(): void {
    const currentPos = this.queuePosition();
    if (currentPos > 0) {
      this.queuePosition.set(currentPos - 1);
      this.nowServing.update(n => n + 1);
    }
  }
}
