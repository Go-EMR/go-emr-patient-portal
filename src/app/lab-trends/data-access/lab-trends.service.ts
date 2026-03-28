import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

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

@Injectable({ providedIn: 'root' })
export class LabTrendsService {
  private readonly authService = inject(AuthService);

  private readonly _selectedTestName = signal<string>('');
  private readonly _timeRange = signal<TimeRange>('1yr');
  private readonly _allTests = signal<LabTrendData[]>([]);

  readonly selectedTestName = this._selectedTestName.asReadonly();
  readonly timeRange = this._timeRange.asReadonly();
  readonly allTests = this._allTests.asReadonly();

  readonly filteredTrends = computed<LabTrendData[]>(() => {
    const range = this._timeRange();
    const cutoff = this._getCutoffDate(range);
    return this._allTests().map(lab => ({
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
    for (const lab of this._allTests()) {
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

  /** Load lab trends from the backend for the current patient. */
  async loadLabTrends(): Promise<void> {
    const patientId = this.authService.user()?.patientId
      ?? localStorage.getItem('portal_patient_id');
    if (!patientId) return;

    const token = localStorage.getItem('portal_token') || '';
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/labs?page=1&page_size=200`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.status === 404) return;
      if (!resp.ok) return;

      const data: {
        labs?: Array<{
          id: string;
          test_name: string;
          order_date: string;
          result_date?: string;
          status: string;
          results?: Array<{
            name: string;
            value: string;
            unit: string;
            reference_min?: number;
            reference_max?: number;
            flag?: string;
          }>;
        }>;
      } = await resp.json();

      const grouped = new Map<string, LabTrendData>();

      for (const lab of data.labs ?? []) {
        if (!lab.results || lab.results.length === 0) continue;
        const resultDate = lab.result_date ? new Date(lab.result_date) : new Date(lab.order_date);

        for (const result of lab.results) {
          const testName = result.name || lab.test_name;
          const numericValue = parseFloat(result.value);
          if (isNaN(numericValue)) continue;

          if (!grouped.has(testName)) {
            grouped.set(testName, {
              testName,
              unit: result.unit || '',
              referenceMin: result.reference_min ?? 0,
              referenceMax: result.reference_max ?? 0,
              dataPoints: [],
              category: lab.test_name,
              description: testName,
            });
          }

          const flag = this.mapApiFlag(result.flag ?? '', numericValue,
            result.reference_min, result.reference_max);

          grouped.get(testName)!.dataPoints.push({
            date: resultDate,
            value: numericValue,
            flag,
          });
        }
      }

      const tests = Array.from(grouped.values());
      this._allTests.set(tests);
      if (tests.length > 0 && !this._selectedTestName()) {
        this._selectedTestName.set(tests[0].testName);
      }
    } catch { /* leave empty */ }
  }

  private mapApiFlag(
    apiFlag: string,
    value: number,
    refMin?: number,
    refMax?: number
  ): LabFlag {
    const f = apiFlag.toLowerCase();
    if (f === 'critical-high' || f === 'critical high' || f === 'ch') return 'critical-high';
    if (f === 'critical-low'  || f === 'critical low'  || f === 'cl') return 'critical-low';
    if (f === 'high' || f === 'h' || f === 'abnormal-high') return 'high';
    if (f === 'low'  || f === 'l' || f === 'abnormal-low')  return 'low';
    if (f === 'normal' || f === 'n') return 'normal';
    // Derive from reference range when flag is absent
    if (refMin !== undefined && refMax !== undefined) {
      if (value < refMin) return 'low';
      if (value > refMax) return 'high';
      return 'normal';
    }
    return 'normal';
  }

  private _getCutoffDate(range: TimeRange): Date {
    const now = new Date();
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
