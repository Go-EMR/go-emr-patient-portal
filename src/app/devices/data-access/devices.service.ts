import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export type DeviceType = 'smartwatch' | 'fitness-tracker' | 'blood-pressure' | 'glucose-monitor' | 'scale';
export type SelectedPeriod = 'daily' | 'weekly' | 'monthly';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  brand: string;
  model: string;
  connected: boolean;
  lastSyncAt: Date;
  batteryLevel: number;
}

export interface ActivityData {
  date: Date;
  steps: number;
  calories: number;
  activeMinutes: number;
  heartRateAvg: number;
  heartRateMin: number;
  heartRateMax: number;
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface HealthGoal {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  unit: string;
  color: string;
}

// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/devices
// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/activity

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly authService = inject(AuthService);

  private readonly _devices = signal<DeviceInfo[]>([]);
  private readonly _activityData = signal<ActivityData[]>([]);
  private readonly _healthGoals = signal<HealthGoal[]>([]);
  private readonly _selectedPeriod = signal<SelectedPeriod>('weekly');
  private readonly _syncingDeviceId = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly devices = this._devices.asReadonly();
  readonly activityData = this._activityData.asReadonly();
  readonly healthGoals = this._healthGoals.asReadonly();
  readonly selectedPeriod = this._selectedPeriod.asReadonly();
  readonly syncingDeviceId = this._syncingDeviceId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly connectedDevices = computed(() =>
    this._devices().filter(d => d.connected)
  );

  readonly todayActivity = computed<ActivityData | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._activityData().find(a => {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }) ?? null;
  });

  readonly weeklyAverage = computed(() => {
    const data = this._activityData();
    if (data.length === 0) {
      return { steps: 0, calories: 0, activeMinutes: 0, heartRateAvg: 0, sleepHours: 0 };
    }
    const avg = (arr: number[]): number =>
      Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    return {
      steps: avg(data.map(d => d.steps)),
      calories: avg(data.map(d => d.calories)),
      activeMinutes: avg(data.map(d => d.activeMinutes)),
      heartRateAvg: avg(data.map(d => d.heartRateAvg)),
      sleepHours: parseFloat((data.map(d => d.sleepHours).reduce((s, v) => s + v, 0) / data.length).toFixed(1))
    };
  });

  /**
   * Loads connected devices and activity data from the backend API.
   * TODO: Implement backend endpoint GET /api/v1/portal/patients/{id}/devices
   */
  async loadDevices(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/devices`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          devices: Array<{
            id: string;
            name: string;
            type: string;
            brand: string;
            model: string;
            connected: boolean;
            last_sync_at: string;
            battery_level: number;
          }>;
          activity?: Array<{
            date: string;
            steps: number;
            calories: number;
            active_minutes: number;
            heart_rate_avg: number;
            heart_rate_min: number;
            heart_rate_max: number;
            sleep_hours: number;
            sleep_quality: string;
          }>;
          goals?: Array<{
            id: string;
            name: string;
            icon: string;
            target: number;
            current: number;
            unit: string;
            color: string;
          }>;
        } = await resp.json();

        const devicesMapped: DeviceInfo[] = (data.devices ?? []).map(d => ({
          id: d.id,
          name: d.name,
          type: (d.type as DeviceType) || 'smartwatch',
          brand: d.brand,
          model: d.model,
          connected: d.connected ?? false,
          lastSyncAt: new Date(d.last_sync_at),
          batteryLevel: d.battery_level ?? 0
        }));
        this._devices.set(devicesMapped);

        if (data.activity) {
          const activityMapped: ActivityData[] = data.activity.map(a => ({
            date: new Date(a.date),
            steps: a.steps ?? 0,
            calories: a.calories ?? 0,
            activeMinutes: a.active_minutes ?? 0,
            heartRateAvg: a.heart_rate_avg ?? 0,
            heartRateMin: a.heart_rate_min ?? 0,
            heartRateMax: a.heart_rate_max ?? 0,
            sleepHours: a.sleep_hours ?? 0,
            sleepQuality: (a.sleep_quality as ActivityData['sleepQuality']) || 'fair'
          }));
          this._activityData.set(activityMapped);
        }

        if (data.goals) {
          const goalsMapped: HealthGoal[] = data.goals.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
            target: g.target,
            current: g.current,
            unit: g.unit,
            color: g.color
          }));
          this._healthGoals.set(goalsMapped);
        }
      }
      // On non-OK response: leave devices/activity as empty arrays
    } catch {
      // On network error: leave devices/activity as empty arrays
    } finally {
      this._isLoading.set(false);
    }
  }

  toggleConnection(deviceId: string): void {
    this._devices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? { ...d, connected: !d.connected, lastSyncAt: d.connected ? d.lastSyncAt : new Date() }
          : d
      )
    );
  }

  syncDevice(deviceId: string): void {
    this._syncingDeviceId.set(deviceId);
    const start = Date.now();
    const check = (): void => {
      if (Date.now() - start >= 1500) {
        this._devices.update(devices =>
          devices.map(d =>
            d.id === deviceId ? { ...d, lastSyncAt: new Date() } : d
          )
        );
        this._syncingDeviceId.set(null);
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  setSelectedPeriod(period: SelectedPeriod): void {
    this._selectedPeriod.set(period);
  }
}
