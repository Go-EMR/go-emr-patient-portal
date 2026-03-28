import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export interface HealthScoreCategory {
  name: string;
  score: number;
  icon: string;
  color: string;
}

export interface WeightDataPoint {
  date: Date;
  weight: number;
  bmi: number;
}

export interface BpDataPoint {
  date: Date;
  systolic: number;
  diastolic: number;
}

export interface GlucoseDataPoint {
  date: Date;
  fasting: number;
  postMeal?: number;
  hba1c?: number;
}

export interface ActivityDataPoint {
  date: Date;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  sleepHours: number;
}

@Injectable({ providedIn: 'root' })
export class HealthAnalyticsService {
  private readonly authService = inject(AuthService);

  readonly healthScore = signal(0);

  readonly healthScoreCategories = signal<HealthScoreCategory[]>([]);

  readonly weightData = signal<WeightDataPoint[]>([]);
  readonly bpData     = signal<BpDataPoint[]>([]);
  readonly glucoseData = signal<GlucoseDataPoint[]>([]);
  readonly activityData = signal<ActivityDataPoint[]>([]);

  // Computed latest values for quick display
  readonly latestWeight = computed(() => {
    const data = this.weightData();
    return data[data.length - 1] ?? null;
  });

  readonly latestBp = computed(() => {
    const data = this.bpData();
    return data[data.length - 1] ?? null;
  });

  readonly latestGlucose = computed(() => {
    const data = this.glucoseData();
    return data[data.length - 1] ?? null;
  });

  readonly latestActivity = computed(() => {
    const data = this.activityData();
    return data[data.length - 1] ?? null;
  });

  readonly latestHba1c = computed(() => {
    const data = this.glucoseData();
    const withHba1c = data.filter(d => d.hba1c != null);
    return withHba1c.length > 0 ? withHba1c[withHba1c.length - 1].hba1c! : null;
  });

  readonly weightChange = computed(() => {
    const data = this.weightData();
    if (data.length < 2) return 0;
    return +(data[data.length - 1].weight - data[0].weight).toFixed(1);
  });

  // Last 7 days of activity (using last 7 data points as daily proxies for the bar chart)
  readonly last7DaysActivity = computed(() => {
    const data = this.activityData();
    return data.slice(-7);
  });

  readonly avgSteps = computed(() => {
    const data = this.activityData();
    if (data.length === 0) return 0;
    return Math.round(data.reduce((s, d) => s + d.steps, 0) / data.length);
  });

  readonly avgSleep = computed(() => {
    const data = this.activityData();
    if (data.length === 0) return 0;
    return +(data.reduce((s, d) => s + d.sleepHours, 0) / data.length).toFixed(1);
  });

  readonly phq9History = signal<Array<{ date: Date; score: number; severity: string }>>([]);
  readonly gad7History = signal<Array<{ date: Date; score: number; severity: string }>>([]);

  /** Load vitals from the backend and map to analytics data structures. */
  async loadHealthAnalytics(): Promise<void> {
    const patientId = this.authService.user()?.patientId
      ?? localStorage.getItem('portal_patient_id');
    if (!patientId) return;

    const token = localStorage.getItem('portal_token') || '';
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/vitals?page=1&page_size=200`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.status === 404) return;
      if (!resp.ok) return;

      const data: {
        vitals?: Array<{
          id: string;
          type: string;
          value: string;
          unit: string;
          recorded_at: string;
        }>;
      } = await resp.json();

      const rows = data.vitals ?? [];

      const weight: WeightDataPoint[] = [];
      const bp: BpDataPoint[] = [];
      const glucose: GlucoseDataPoint[] = [];

      for (const row of rows) {
        const type = row.type.toLowerCase();
        const date = new Date(row.recorded_at);
        const val = parseFloat(row.value);
        if (isNaN(val)) continue;

        if (type === 'weight') {
          // Compute BMI if height is not separately tracked; use 170 cm default
          const heightM = 1.70;
          const weightKg = row.unit === 'lbs' ? val * 0.453592 : val;
          weight.push({ date, weight: val, bmi: parseFloat((weightKg / (heightM * heightM)).toFixed(1)) });
        } else if (type === 'blood_pressure' || type === 'bloodpressure') {
          const parts = row.value.split('/');
          if (parts.length === 2) {
            bp.push({ date, systolic: parseFloat(parts[0]), diastolic: parseFloat(parts[1]) });
          }
        } else if (type === 'glucose' || type === 'blood_glucose') {
          glucose.push({ date, fasting: val });
        } else if (type === 'hba1c') {
          // Attach HbA1c to the nearest glucose entry by date, or add standalone
          const nearest = glucose.find(g => Math.abs(g.date.getTime() - date.getTime()) < 7 * 86400_000);
          if (nearest) {
            nearest.hba1c = val;
          } else {
            glucose.push({ date, fasting: 0, hba1c: val });
          }
        }
      }

      // Sort all series by date ascending
      const byDate = (a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime();
      if (weight.length > 0)  this.weightData.set(weight.sort(byDate));
      if (bp.length > 0)      this.bpData.set(bp.sort(byDate));
      if (glucose.length > 0) this.glucoseData.set(glucose.sort(byDate));
    } catch { /* leave empty */ }
  }
}
