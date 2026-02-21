import { Injectable, signal, computed } from '@angular/core';

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

// today = 2026-02-21
function daysAgo(n: number): Date {
  const d = new Date(2026, 1, 21);
  d.setDate(d.getDate() - n);
  return d;
}

const MOCK_DEVICES: DeviceInfo[] = [
  {
    id: 'device-1',
    name: 'Apple Watch Series 9',
    type: 'smartwatch',
    brand: 'Apple',
    model: 'Series 9 (45mm)',
    connected: true,
    lastSyncAt: new Date(2026, 1, 21, 8, 32),
    batteryLevel: 78
  },
  {
    id: 'device-2',
    name: 'Fitbit Charge 6',
    type: 'fitness-tracker',
    brand: 'Fitbit',
    model: 'Charge 6',
    connected: true,
    lastSyncAt: new Date(2026, 1, 21, 7, 15),
    batteryLevel: 55
  },
  {
    id: 'device-3',
    name: 'Withings BPM Connect',
    type: 'blood-pressure',
    brand: 'Withings',
    model: 'BPM Connect Pro',
    connected: false,
    lastSyncAt: new Date(2026, 1, 19, 20, 5),
    batteryLevel: 92
  },
  {
    id: 'device-4',
    name: 'Dexcom G7',
    type: 'glucose-monitor',
    brand: 'Dexcom',
    model: 'G7 CGM',
    connected: true,
    lastSyncAt: new Date(2026, 1, 21, 9, 0),
    batteryLevel: 100
  }
];

const MOCK_ACTIVITY: ActivityData[] = [
  {
    date: daysAgo(6),
    steps: 7234,
    calories: 1820,
    activeMinutes: 38,
    heartRateAvg: 72,
    heartRateMin: 54,
    heartRateMax: 142,
    sleepHours: 6.5,
    sleepQuality: 'fair'
  },
  {
    date: daysAgo(5),
    steps: 9812,
    calories: 2105,
    activeMinutes: 52,
    heartRateAvg: 74,
    heartRateMin: 56,
    heartRateMax: 158,
    sleepHours: 7.2,
    sleepQuality: 'good'
  },
  {
    date: daysAgo(4),
    steps: 5430,
    calories: 1680,
    activeMinutes: 22,
    heartRateAvg: 70,
    heartRateMin: 52,
    heartRateMax: 128,
    sleepHours: 5.8,
    sleepQuality: 'poor'
  },
  {
    date: daysAgo(3),
    steps: 11204,
    calories: 2380,
    activeMinutes: 67,
    heartRateAvg: 76,
    heartRateMin: 58,
    heartRateMax: 172,
    sleepHours: 7.8,
    sleepQuality: 'excellent'
  },
  {
    date: daysAgo(2),
    steps: 8756,
    calories: 2010,
    activeMinutes: 45,
    heartRateAvg: 73,
    heartRateMin: 55,
    heartRateMax: 155,
    sleepHours: 7.0,
    sleepQuality: 'good'
  },
  {
    date: daysAgo(1),
    steps: 10341,
    calories: 2245,
    activeMinutes: 58,
    heartRateAvg: 75,
    heartRateMin: 57,
    heartRateMax: 165,
    sleepHours: 6.9,
    sleepQuality: 'good'
  },
  {
    date: daysAgo(0),
    steps: 6128,
    calories: 1540,
    activeMinutes: 31,
    heartRateAvg: 71,
    heartRateMin: 53,
    heartRateMax: 138,
    sleepHours: 7.5,
    sleepQuality: 'good'
  }
];

const MOCK_GOALS: HealthGoal[] = [
  {
    id: 'goal-steps',
    name: 'Daily Steps',
    icon: 'pi pi-directions',
    target: 10000,
    current: 6128,
    unit: 'steps',
    color: '#0ea5e9'
  },
  {
    id: 'goal-calories',
    name: 'Calories Burned',
    icon: 'pi pi-bolt',
    target: 2200,
    current: 1540,
    unit: 'kcal',
    color: '#f97316'
  },
  {
    id: 'goal-active',
    name: 'Active Minutes',
    icon: 'pi pi-heart',
    target: 60,
    current: 31,
    unit: 'min',
    color: '#10b981'
  },
  {
    id: 'goal-sleep',
    name: 'Sleep Duration',
    icon: 'pi pi-moon',
    target: 8,
    current: 7.5,
    unit: 'hrs',
    color: '#8b5cf6'
  }
];

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly _devices = signal<DeviceInfo[]>(MOCK_DEVICES);
  private readonly _activityData = signal<ActivityData[]>(MOCK_ACTIVITY);
  private readonly _healthGoals = signal<HealthGoal[]>(MOCK_GOALS);
  private readonly _selectedPeriod = signal<SelectedPeriod>('weekly');
  private readonly _syncingDeviceId = signal<string | null>(null);

  readonly devices = this._devices.asReadonly();
  readonly activityData = this._activityData.asReadonly();
  readonly healthGoals = this._healthGoals.asReadonly();
  readonly selectedPeriod = this._selectedPeriod.asReadonly();
  readonly syncingDeviceId = this._syncingDeviceId.asReadonly();

  readonly connectedDevices = computed(() =>
    this._devices().filter(d => d.connected)
  );

  readonly todayActivity = computed<ActivityData | null>(() => {
    const today = new Date(2026, 1, 21);
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

  toggleConnection(deviceId: string): void {
    this._devices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? { ...d, connected: !d.connected, lastSyncAt: d.connected ? d.lastSyncAt : new Date(2026, 1, 21, 9, 0) }
          : d
      )
    );
  }

  syncDevice(deviceId: string): void {
    this._syncingDeviceId.set(deviceId);
    // Simulate async sync with a timeout-free approach using a simple flag reset
    const start = Date.now();
    const check = (): void => {
      if (Date.now() - start >= 1500) {
        this._devices.update(devices =>
          devices.map(d =>
            d.id === deviceId ? { ...d, lastSyncAt: new Date(2026, 1, 21, 9, 5) } : d
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
