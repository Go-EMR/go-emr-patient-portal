import { Injectable, signal, computed } from '@angular/core';

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

// Helper: date N months back from 2026-02-21
function mo(monthsAgo: number): Date {
  const d = new Date(2026, 1, 21);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

const WEIGHT_DATA: WeightDataPoint[] = [
  { date: mo(11), weight: 190.0, bmi: 27.3 },
  { date: mo(10), weight: 189.2, bmi: 27.2 },
  { date: mo(9),  weight: 188.5, bmi: 27.1 },
  { date: mo(8),  weight: 188.0, bmi: 27.0 },
  { date: mo(7),  weight: 187.4, bmi: 26.9 },
  { date: mo(6),  weight: 187.0, bmi: 26.9 },
  { date: mo(5),  weight: 186.5, bmi: 26.8 },
  { date: mo(4),  weight: 186.1, bmi: 26.7 },
  { date: mo(3),  weight: 185.8, bmi: 26.7 },
  { date: mo(2),  weight: 185.5, bmi: 26.6 },
  { date: mo(1),  weight: 185.2, bmi: 26.6 },
  { date: mo(0),  weight: 185.0, bmi: 26.5 },
];

const BP_DATA: BpDataPoint[] = [
  { date: mo(11), systolic: 135, diastolic: 88 },
  { date: mo(10), systolic: 134, diastolic: 87 },
  { date: mo(9),  systolic: 133, diastolic: 87 },
  { date: mo(8),  systolic: 132, diastolic: 86 },
  { date: mo(7),  systolic: 132, diastolic: 85 },
  { date: mo(6),  systolic: 131, diastolic: 85 },
  { date: mo(5),  systolic: 130, diastolic: 84 },
  { date: mo(4),  systolic: 130, diastolic: 84 },
  { date: mo(3),  systolic: 129, diastolic: 83 },
  { date: mo(2),  systolic: 129, diastolic: 83 },
  { date: mo(1),  systolic: 128, diastolic: 82 },
  { date: mo(0),  systolic: 128, diastolic: 82 },
];

const GLUCOSE_DATA: GlucoseDataPoint[] = [
  { date: mo(11), fasting: 97,  postMeal: 138, hba1c: 6.4 },
  { date: mo(10), fasting: 96,  postMeal: 135 },
  { date: mo(9),  fasting: 95,  postMeal: 132 },
  { date: mo(8),  fasting: 96,  postMeal: 130 },
  { date: mo(7),  fasting: 94,  postMeal: 128 },
  { date: mo(6),  fasting: 95,  postMeal: 130, hba1c: 6.3 },
  { date: mo(5),  fasting: 93,  postMeal: 127 },
  { date: mo(4),  fasting: 94,  postMeal: 126 },
  { date: mo(3),  fasting: 94,  postMeal: 125 },
  { date: mo(2),  fasting: 93,  postMeal: 124, hba1c: 6.2 },
  { date: mo(1),  fasting: 92,  postMeal: 123 },
  { date: mo(0),  fasting: 93,  postMeal: 122 },
];

const ACTIVITY_DATA: ActivityDataPoint[] = [
  { date: mo(11), steps: 6200,  activeMinutes: 32, caloriesBurned: 1820, sleepHours: 6.8 },
  { date: mo(10), steps: 6800,  activeMinutes: 35, caloriesBurned: 1870, sleepHours: 6.9 },
  { date: mo(9),  steps: 7100,  activeMinutes: 38, caloriesBurned: 1910, sleepHours: 7.0 },
  { date: mo(8),  steps: 7400,  activeMinutes: 40, caloriesBurned: 1940, sleepHours: 7.1 },
  { date: mo(7),  steps: 7600,  activeMinutes: 42, caloriesBurned: 1960, sleepHours: 7.2 },
  { date: mo(6),  steps: 7800,  activeMinutes: 44, caloriesBurned: 1980, sleepHours: 7.3 },
  { date: mo(5),  steps: 8000,  activeMinutes: 45, caloriesBurned: 2000, sleepHours: 7.3 },
  { date: mo(4),  steps: 7900,  activeMinutes: 44, caloriesBurned: 1990, sleepHours: 7.4 },
  { date: mo(3),  steps: 8200,  activeMinutes: 47, caloriesBurned: 2020, sleepHours: 7.4 },
  { date: mo(2),  steps: 8400,  activeMinutes: 48, caloriesBurned: 2040, sleepHours: 7.5 },
  { date: mo(1),  steps: 8600,  activeMinutes: 50, caloriesBurned: 2060, sleepHours: 7.5 },
  { date: mo(0),  steps: 8800,  activeMinutes: 52, caloriesBurned: 2080, sleepHours: 7.6 },
];

@Injectable({ providedIn: 'root' })
export class HealthAnalyticsService {
  // Overall health score
  readonly healthScore = signal(78);

  readonly healthScoreCategories = signal<HealthScoreCategory[]>([
    { name: 'Cardiovascular', score: 72, icon: 'pi-heart',      color: '#ef4444' },
    { name: 'Metabolic',      score: 68, icon: 'pi-chart-bar',  color: '#f97316' },
    { name: 'Nutrition',      score: 85, icon: 'pi-apple',      color: '#22c55e' },
    { name: 'Activity',       score: 82, icon: 'pi-bolt',       color: '#3b82f6' },
    { name: 'Preventive Care',score: 90, icon: 'pi-shield',     color: '#8b5cf6' },
    { name: 'Mental Health',  score: 75, icon: 'pi-sun',        color: '#ec4899' },
  ]);

  readonly weightData = signal<WeightDataPoint[]>(WEIGHT_DATA);
  readonly bpData     = signal<BpDataPoint[]>(BP_DATA);
  readonly glucoseData = signal<GlucoseDataPoint[]>(GLUCOSE_DATA);
  readonly activityData = signal<ActivityDataPoint[]>(ACTIVITY_DATA);

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

  // PHQ-9 / GAD-7 history (mock)
  readonly phq9History = signal([
    { date: new Date(2025, 8, 15), score: 12, severity: 'Moderate' },
    { date: new Date(2025, 11, 10), score: 8,  severity: 'Mild' },
    { date: new Date(2026, 1, 21),  score: 5,  severity: 'Minimal' },
  ]);

  readonly gad7History = signal([
    { date: new Date(2025, 8, 15), score: 10, severity: 'Moderate' },
    { date: new Date(2025, 11, 10), score: 7,  severity: 'Mild' },
    { date: new Date(2026, 1, 21),  score: 4,  severity: 'Minimal' },
  ]);
}
