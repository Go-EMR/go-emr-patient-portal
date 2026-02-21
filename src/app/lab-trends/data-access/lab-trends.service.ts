import { Injectable, signal, computed } from '@angular/core';

export type LabFlag = 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
export type TimeRange = '6mo' | '1yr' | '2yr';

export interface LabDataPoint {
  date: Date;
  value: number;
  flag: LabFlag;
}

export interface LabTrendData {
  testName: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  dataPoints: LabDataPoint[];
  category: string;
  description: string;
}

function d(yearsAgo: number, monthsAgo: number): Date {
  const date = new Date(2026, 1, 21); // 2026-02-21
  date.setFullYear(date.getFullYear() - yearsAgo);
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

function flag(value: number, min: number, max: number, critLow?: number, critHigh?: number): LabFlag {
  if (critLow !== undefined && value < critLow) return 'critical-low';
  if (critHigh !== undefined && value > critHigh) return 'critical-high';
  if (value < min) return 'low';
  if (value > max) return 'high';
  return 'normal';
}

const ALL_LAB_TRENDS: LabTrendData[] = [
  {
    testName: 'Glucose',
    unit: 'mg/dL',
    referenceMin: 70,
    referenceMax: 99,
    category: 'Metabolic',
    description: 'Fasting blood glucose measures blood sugar levels and is used to screen for diabetes.',
    dataPoints: [
      { date: d(2, 0), value: 92, flag: 'normal' },
      { date: d(1, 9), value: 98, flag: 'normal' },
      { date: d(1, 6), value: 105, flag: 'high' },
      { date: d(1, 3), value: 112, flag: 'high' },
      { date: d(1, 0), value: 108, flag: 'high' },
      { date: d(0, 9), value: 101, flag: 'high' },
      { date: d(0, 6), value: 97, flag: 'normal' },
      { date: d(0, 3), value: 94, flag: 'normal' },
    ]
  },
  {
    testName: 'HbA1c',
    unit: '%',
    referenceMin: 4.0,
    referenceMax: 5.6,
    category: 'Metabolic',
    description: 'Hemoglobin A1c reflects average blood sugar levels over the past 2-3 months.',
    dataPoints: [
      { date: d(2, 0), value: 5.4, flag: 'normal' },
      { date: d(1, 9), value: 5.6, flag: 'normal' },
      { date: d(1, 6), value: 5.9, flag: 'high' },
      { date: d(1, 3), value: 6.2, flag: 'high' },
      { date: d(1, 0), value: 6.0, flag: 'high' },
      { date: d(0, 9), value: 5.8, flag: 'high' },
      { date: d(0, 6), value: 5.5, flag: 'normal' },
      { date: d(0, 3), value: 5.3, flag: 'normal' },
    ]
  },
  {
    testName: 'Total Cholesterol',
    unit: 'mg/dL',
    referenceMin: 0,
    referenceMax: 200,
    category: 'Lipids',
    description: 'Total cholesterol is a measure of all cholesterol in your blood, including LDL and HDL.',
    dataPoints: [
      { date: d(2, 0), value: 195, flag: 'normal' },
      { date: d(1, 9), value: 208, flag: 'high' },
      { date: d(1, 6), value: 225, flag: 'high' },
      { date: d(1, 3), value: 218, flag: 'high' },
      { date: d(1, 0), value: 210, flag: 'high' },
      { date: d(0, 9), value: 202, flag: 'high' },
      { date: d(0, 3), value: 192, flag: 'normal' },
    ]
  },
  {
    testName: 'LDL Cholesterol',
    unit: 'mg/dL',
    referenceMin: 0,
    referenceMax: 100,
    category: 'Lipids',
    description: 'LDL (low-density lipoprotein) is often called "bad" cholesterol. High levels increase heart disease risk.',
    dataPoints: [
      { date: d(2, 0), value: 95, flag: 'normal' },
      { date: d(1, 9), value: 108, flag: 'high' },
      { date: d(1, 6), value: 128, flag: 'high' },
      { date: d(1, 3), value: 122, flag: 'high' },
      { date: d(1, 0), value: 115, flag: 'high' },
      { date: d(0, 9), value: 104, flag: 'high' },
      { date: d(0, 3), value: 91, flag: 'normal' },
    ]
  },
  {
    testName: 'HDL Cholesterol',
    unit: 'mg/dL',
    referenceMin: 40,
    referenceMax: 999,
    category: 'Lipids',
    description: 'HDL (high-density lipoprotein) is "good" cholesterol. Higher levels are associated with lower heart disease risk.',
    dataPoints: [
      { date: d(2, 0), value: 52, flag: 'normal' },
      { date: d(1, 9), value: 48, flag: 'normal' },
      { date: d(1, 6), value: 44, flag: 'normal' },
      { date: d(1, 3), value: 42, flag: 'normal' },
      { date: d(1, 0), value: 46, flag: 'normal' },
      { date: d(0, 9), value: 50, flag: 'normal' },
      { date: d(0, 3), value: 55, flag: 'normal' },
    ]
  },
  {
    testName: 'Triglycerides',
    unit: 'mg/dL',
    referenceMin: 0,
    referenceMax: 150,
    category: 'Lipids',
    description: 'Triglycerides are a type of fat in the blood. High levels may increase risk of heart disease.',
    dataPoints: [
      { date: d(2, 0), value: 138, flag: 'normal' },
      { date: d(1, 9), value: 155, flag: 'high' },
      { date: d(1, 6), value: 178, flag: 'high' },
      { date: d(1, 3), value: 201, flag: 'high' },
      { date: d(1, 0), value: 185, flag: 'high' },
      { date: d(0, 9), value: 162, flag: 'high' },
      { date: d(0, 3), value: 144, flag: 'normal' },
    ]
  },
  {
    testName: 'TSH',
    unit: 'mIU/L',
    referenceMin: 0.4,
    referenceMax: 4.0,
    category: 'Thyroid',
    description: 'Thyroid-stimulating hormone (TSH) measures how well your thyroid gland is working.',
    dataPoints: [
      { date: d(2, 0), value: 2.1, flag: 'normal' },
      { date: d(1, 6), value: 2.8, flag: 'normal' },
      { date: d(1, 3), value: 4.5, flag: 'high' },
      { date: d(1, 0), value: 5.2, flag: 'high' },
      { date: d(0, 9), value: 3.9, flag: 'normal' },
      { date: d(0, 6), value: 2.6, flag: 'normal' },
      { date: d(0, 3), value: 2.2, flag: 'normal' },
    ]
  },
  {
    testName: 'Hemoglobin',
    unit: 'g/dL',
    referenceMin: 13.5,
    referenceMax: 17.5,
    category: 'CBC',
    description: 'Hemoglobin is the protein in red blood cells that carries oxygen throughout the body.',
    dataPoints: [
      { date: d(2, 0), value: 14.8, flag: 'normal' },
      { date: d(1, 9), value: 14.2, flag: 'normal' },
      { date: d(1, 6), value: 13.8, flag: 'normal' },
      { date: d(1, 3), value: 13.1, flag: 'low' },
      { date: d(1, 0), value: 13.4, flag: 'low' },
      { date: d(0, 9), value: 13.9, flag: 'normal' },
      { date: d(0, 6), value: 14.5, flag: 'normal' },
      { date: d(0, 3), value: 14.9, flag: 'normal' },
    ]
  },
  {
    testName: 'White Blood Cell Count',
    unit: 'K/uL',
    referenceMin: 4.5,
    referenceMax: 11.0,
    category: 'CBC',
    description: 'White blood cells (WBC) are part of the immune system. Abnormal counts can indicate infection or other conditions.',
    dataPoints: [
      { date: d(2, 0), value: 7.2, flag: 'normal' },
      { date: d(1, 9), value: 8.1, flag: 'normal' },
      { date: d(1, 6), value: 11.8, flag: 'high' },
      { date: d(1, 3), value: 9.4, flag: 'normal' },
      { date: d(1, 0), value: 7.8, flag: 'normal' },
      { date: d(0, 9), value: 6.9, flag: 'normal' },
      { date: d(0, 3), value: 7.3, flag: 'normal' },
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class LabTrendsService {
  private readonly _selectedTestName = signal<string>('Glucose');
  private readonly _timeRange = signal<TimeRange>('1yr');

  readonly selectedTestName = this._selectedTestName.asReadonly();
  readonly timeRange = this._timeRange.asReadonly();
  readonly allTests = ALL_LAB_TRENDS;

  readonly filteredTrends = computed<LabTrendData[]>(() => {
    const range = this._timeRange();
    const cutoff = this._getCutoffDate(range);
    return ALL_LAB_TRENDS.map(lab => ({
      ...lab,
      dataPoints: lab.dataPoints
        .filter(dp => dp.date >= cutoff)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    }));
  });

  readonly selectedTrend = computed<LabTrendData | null>(() => {
    const name = this._selectedTestName();
    return this.filteredTrends().find(t => t.testName === name) ?? null;
  });

  readonly latestValuesByTest = computed<Map<string, LabDataPoint>>(() => {
    const map = new Map<string, LabDataPoint>();
    for (const lab of ALL_LAB_TRENDS) {
      const sorted = [...lab.dataPoints].sort((a, b) => b.date.getTime() - a.date.getTime());
      if (sorted.length > 0) {
        map.set(lab.testName, sorted[0]);
      }
    }
    return map;
  });

  readonly stats = computed(() => {
    const trend = this.selectedTrend();
    if (!trend || trend.dataPoints.length === 0) return null;

    const sorted = [...trend.dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());
    const values = sorted.map(dp => dp.value);
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const change = previous ? latest.value - previous.value : null;
    const changePercent = previous ? ((change! / previous.value) * 100) : null;

    return {
      latest,
      previous,
      change,
      changePercent,
      min: Math.min(...values),
      max: Math.max(...values),
      average: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
    };
  });

  selectTest(testName: string): void {
    this._selectedTestName.set(testName);
  }

  setTimeRange(range: TimeRange): void {
    this._timeRange.set(range);
  }

  private _getCutoffDate(range: TimeRange): Date {
    const now = new Date(2026, 1, 21);
    switch (range) {
      case '6mo': {
        const d6 = new Date(now);
        d6.setMonth(d6.getMonth() - 6);
        return d6;
      }
      case '1yr': {
        const d1 = new Date(now);
        d1.setFullYear(d1.getFullYear() - 1);
        return d1;
      }
      case '2yr': {
        const d2 = new Date(now);
        d2.setFullYear(d2.getFullYear() - 2);
        return d2;
      }
    }
  }
}
