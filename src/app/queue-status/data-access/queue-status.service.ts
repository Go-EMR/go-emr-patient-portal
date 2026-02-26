import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type QueueStage = 'checked-in' | 'in-queue' | 'being-called' | 'with-provider';

export interface QueueStatus {
  tokenNumber: string;
  position: number;
  totalInQueue: number;
  estimatedWaitMinutes: number;
  department: string;
  providerName: string;
  providerSpecialty: string;
  stage: QueueStage;
  checkInTime: Date;
  hasArrived: boolean;
}

@Injectable({ providedIn: 'root' })
export class QueueStatusService implements OnDestroy {
  private readonly _status = signal<QueueStatus>({
    tokenNumber: 'A-047',
    position: 3,
    totalInQueue: 8,
    estimatedWaitMinutes: 15,
    department: 'General Medicine',
    providerName: 'Dr. Sarah Johnson',
    providerSpecialty: 'Internal Medicine',
    stage: 'in-queue',
    checkInTime: new Date(Date.now() - 12 * 60 * 1000), // 12 min ago
    hasArrived: false,
  });

  private readonly _isLoading = signal(false);
  private readonly _lastRefreshed = signal<Date>(new Date());
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly status = this._status.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastRefreshed = this._lastRefreshed.asReadonly();

  readonly progressPercent = computed(() => {
    const s = this._status();
    const stageOrder: QueueStage[] = ['checked-in', 'in-queue', 'being-called', 'with-provider'];
    const idx = stageOrder.indexOf(s.stage);
    return Math.round(((idx + 1) / stageOrder.length) * 100);
  });

  readonly queueProgressPercent = computed(() => {
    const s = this._status();
    if (s.totalInQueue === 0) return 100;
    const ahead = s.position - 1;
    const served = s.totalInQueue - ahead;
    return Math.round((served / s.totalInQueue) * 100);
  });

  readonly estimatedTimeLabel = computed(() => {
    const mins = this._status().estimatedWaitMinutes;
    if (mins <= 0) return 'Any moment now';
    if (mins < 5) return 'Less than 5 min';
    return `~${mins} min`;
  });

  readonly ordinalPosition = computed(() => {
    const pos = this._status().position;
    const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
    return `${pos}${suffix}`;
  });

  constructor() {
    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.simulateUpdate();
    }, 30_000);
  }

  async markArrived(): Promise<void> {
    this._isLoading.set(true);
    await new Promise(r => setTimeout(r, 800));
    this._status.update(s => ({ ...s, hasArrived: true, stage: 'in-queue' }));
    this._isLoading.set(false);
    this._lastRefreshed.set(new Date());
  }

  async refresh(): Promise<void> {
    this._isLoading.set(true);
    await new Promise(r => setTimeout(r, 600));
    this.simulateUpdate();
    this._isLoading.set(false);
    this._lastRefreshed.set(new Date());
  }

  private simulateUpdate(): void {
    this._status.update(s => {
      const newPosition = Math.max(1, s.position - (Math.random() > 0.4 ? 1 : 0));
      const newWait = Math.max(0, s.estimatedWaitMinutes - (Math.floor(Math.random() * 3) + 1));
      const newTotal = Math.max(newPosition, s.totalInQueue - (Math.random() > 0.5 ? 1 : 0));

      let newStage = s.stage;
      if (newPosition === 1 && s.stage === 'in-queue') {
        newStage = 'being-called';
      }

      return {
        ...s,
        position: newPosition,
        totalInQueue: newTotal,
        estimatedWaitMinutes: newWait,
        stage: newStage,
      };
    });
    this._lastRefreshed.set(new Date());
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}
