import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  HealthAnalyticsService,
  WeightDataPoint,
  BpDataPoint,
  GlucoseDataPoint,
  ActivityDataPoint,
} from '../data-access';

// ── SVG chart constants ──────────────────────────────────────────────────────
const CHART_W = 700;
const CHART_H = 260;
const PAD_L   = 52;
const PAD_R   = 20;
const PAD_T   = 18;
const PAD_B   = 44;

interface XY { x: number; y: number; }

function buildSmoothPath(pts: XY[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  const tension = 0.4;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

function makePlot<T>(data: T[], getValue: (d: T) => number, padFactor = 0.1) {
  const values = data.map(getValue);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad    = (rawMax - rawMin) * padFactor || rawMax * padFactor || 5;
  const yMin   = rawMin - pad;
  const yMax   = rawMax + pad;
  const plotW  = CHART_W - PAD_L - PAD_R;
  const plotH  = CHART_H - PAD_T - PAD_B;
  const toX    = (i: number) => data.length === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (data.length - 1)) * plotW;
  const toY    = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const gridYLines: { y: number; label: string }[] = [];
  for (let s = 0; s <= 4; s++) {
    const v = yMin + (s / 4) * (yMax - yMin);
    gridYLines.push({ y: toY(v), label: v >= 100 ? Math.round(v).toString() : v.toFixed(1) });
  }
  return { toX, toY, gridYLines, yMin, yMax, plotW, plotH };
}

@Component({
  selector: 'app-health-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
<div class="ha-page">

  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <i class="pi pi-chart-line"></i>
      </div>
      <div>
        <h1 class="page-title">Health Analytics</h1>
        <p class="page-subtitle">Comprehensive view of your health trends, scores, and chronic condition management</p>
      </div>
    </div>
  </div>

  <!-- Tab bar -->
  <div class="tab-bar">
    @for (tab of tabs; track tab.id) {
      <button class="tab-btn" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
        <i class="pi" [class]="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </button>
    }
  </div>

  <!-- ══════════════════════════════════════════════════
       TAB 1 · Health Score Dashboard
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'score') {
    <div class="tab-content">
      <div class="score-layout">

        <!-- Circular gauge card -->
        <div class="card gauge-card">
          <h2 class="card-title">Overall Health Score</h2>
          <p class="card-sub">Based on your vitals, labs, activity, and preventive care</p>
          <div class="gauge-wrap">
            <svg viewBox="0 0 200 200" class="gauge-svg">
              <!-- Background track -->
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface-200,#e5e7eb)" stroke-width="18"/>
              <!-- Score arc — circumference = 2π×80 ≈ 502.65 -->
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                [attr.stroke]="gaugeColor()"
                stroke-width="18"
                stroke-linecap="round"
                stroke-dasharray="502.65"
                [attr.stroke-dashoffset]="gaugeOffset()"
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="96" text-anchor="middle" class="gauge-score-text">{{ svc.healthScore() }}</text>
              <text x="100" y="116" text-anchor="middle" class="gauge-label-text">out of 100</text>
            </svg>
            <div class="gauge-badge" [style.background]="gaugeColor()">{{ gaugeLabel() }}</div>
          </div>
          <!-- How is this calculated? -->
          <button class="collapsible-btn" (click)="showCalcInfo.set(!showCalcInfo())">
            <i class="pi pi-info-circle"></i>
            How is this calculated?
            <i class="pi" [class]="showCalcInfo() ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
          </button>
          @if (showCalcInfo()) {
            <div class="calc-info">
              <p>Your Health Score is a composite of six categories, each weighted by clinical significance:</p>
              <ul>
                <li><strong>Cardiovascular (20%)</strong> — Blood pressure, cholesterol, resting heart rate</li>
                <li><strong>Metabolic (20%)</strong> — Glucose, HbA1c, BMI</li>
                <li><strong>Nutrition (15%)</strong> — Diet quality surveys, micronutrient labs</li>
                <li><strong>Activity (15%)</strong> — Steps, active minutes, sleep quality</li>
                <li><strong>Preventive Care (20%)</strong> — Screenings, vaccinations, dental</li>
                <li><strong>Mental Health (10%)</strong> — PHQ-9 and GAD-7 scores</li>
              </ul>
              <p class="calc-disclaimer">This score is informational only and does not constitute medical advice. Consult your provider for interpretation.</p>
            </div>
          }
        </div>

        <!-- Category grid -->
        <div class="categories-grid">
          @for (cat of svc.healthScoreCategories(); track cat.name) {
            <div class="category-card">
              <div class="cat-header">
                <div class="cat-icon" [style.background]="cat.color + '20'" [style.color]="cat.color">
                  <i class="pi" [class]="cat.icon"></i>
                </div>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-score" [style.color]="cat.color">{{ cat.score }}</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" [style.width.%]="cat.score" [style.background]="cat.color"></div>
              </div>
              <div class="cat-scale">
                <span>0</span><span>{{ cat.score >= 80 ? 'Good' : cat.score >= 60 ? 'Fair' : 'Needs Attention' }}</span><span>100</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ══════════════════════════════════════════════════
       TAB 2 · Chronic Conditions
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'chronic') {
    <div class="tab-content">
      <!-- Sub-tabs -->
      <div class="sub-tab-bar">
        @for (sub of chronicTabs; track sub.id) {
          <button class="sub-tab-btn" [class.active]="chronicTab() === sub.id" (click)="chronicTab.set(sub.id)">
            {{ sub.label }}
          </button>
        }
      </div>

      <!-- Diabetes -->
      @if (chronicTab() === 'diabetes') {
        <div class="chronic-panel">
          <div class="chronic-grid">
            <div class="card">
              <div class="card-icon-header" style="color:#f97316">
                <i class="pi pi-chart-bar"></i>
                <h3>HbA1c</h3>
              </div>
              <div class="big-metric">6.2%</div>
              <div class="metric-sub">Target: &lt;7.0% (ADA guideline)</div>
              <div class="status-pill status-yellow">Pre-Diabetic Range</div>
              <div class="metric-trend">
                <i class="pi pi-arrow-down" style="color:var(--green-500)"></i>
                Improved from 6.4% (6 months ago)
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#3b82f6">
                <i class="pi pi-drop"></i>
                <h3>Fasting Glucose</h3>
              </div>
              <div class="big-metric">93 <span class="metric-unit">mg/dL</span></div>
              <div class="metric-sub">Normal range: 70–99 mg/dL</div>
              <div class="status-pill status-green">Normal</div>
              <div class="target-bar-wrap">
                <div class="target-bar-track">
                  <div class="target-zone" style="left:0%;width:51.7%;background:rgba(34,197,94,0.2);border:1px solid #22c55e"></div>
                  <div class="target-indicator" [style.left.%]="((93-70)/(200-70))*100"></div>
                </div>
                <div class="target-bar-labels"><span>70</span><span>99</span><span>200</span></div>
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#8b5cf6">
                <i class="pi pi-calendar"></i>
                <h3>Next Appointment</h3>
              </div>
              <div class="appt-info">
                <div class="appt-date">Mar 15, 2026</div>
                <div class="appt-with">Dr. Sarah Chen — Endocrinology</div>
                <div class="appt-type">Quarterly Diabetes Review</div>
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#ef4444">
                <i class="pi pi-list"></i>
                <h3>Current Medications</h3>
              </div>
              <ul class="med-list">
                <li><span class="med-name">Metformin 500mg</span><span class="med-freq">Twice daily with meals</span></li>
                <li><span class="med-name">Glipizide 5mg</span><span class="med-freq">Once daily before breakfast</span></li>
              </ul>
              <div class="med-note">Last refill: Jan 28, 2026</div>
            </div>
          </div>

          <div class="info-box">
            <i class="pi pi-lightbulb"></i>
            <div>
              <strong>Management Tips:</strong> Aim for 150 minutes of moderate exercise per week. Limit refined carbohydrates and monitor blood sugar before and 2 hours after meals. Keep a food diary to identify glucose spikes.
            </div>
          </div>
        </div>
      }

      <!-- Hypertension -->
      @if (chronicTab() === 'hypertension') {
        <div class="chronic-panel">
          <div class="chronic-grid">
            <div class="card">
              <div class="card-icon-header" style="color:#ef4444">
                <i class="pi pi-heart"></i>
                <h3>Current Blood Pressure</h3>
              </div>
              <div class="big-metric">128/82 <span class="metric-unit">mmHg</span></div>
              <div class="metric-sub">Stage 1 Hypertension (AHA)</div>
              <div class="status-pill status-orange">Stage 1 Hypertension</div>
              <div class="metric-trend">
                <i class="pi pi-arrow-down" style="color:var(--green-500)"></i>
                Trending down from 135/88 — keep it up!
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#3b82f6">
                <i class="pi pi-list"></i>
                <h3>Current Medications</h3>
              </div>
              <ul class="med-list">
                <li><span class="med-name">Lisinopril 10mg</span><span class="med-freq">Once daily</span></li>
                <li><span class="med-name">Amlodipine 5mg</span><span class="med-freq">Once daily</span></li>
              </ul>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#22c55e">
                <i class="pi pi-check-circle"></i>
                <h3>Lifestyle Tips</h3>
              </div>
              <ul class="tips-list">
                <li>Reduce sodium to &lt;2,300 mg/day (DASH diet)</li>
                <li>Exercise 30 min/day, most days of the week</li>
                <li>Limit alcohol to &lt;2 drinks/day</li>
                <li>Manage stress with mindfulness or yoga</li>
                <li>Monitor BP at home daily</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#8b5cf6">
                <i class="pi pi-info-circle"></i>
                <h3>AHA BP Categories</h3>
              </div>
              <div class="bp-zones">
                <div class="bp-zone" style="border-left:3px solid #22c55e">
                  <span class="bp-zone-label">Normal</span>
                  <span class="bp-zone-range">&lt;120/80</span>
                </div>
                <div class="bp-zone" style="border-left:3px solid #eab308">
                  <span class="bp-zone-label">Elevated</span>
                  <span class="bp-zone-range">120–129/&lt;80</span>
                </div>
                <div class="bp-zone" style="border-left:3px solid #f97316">
                  <span class="bp-zone-label">Stage 1 HTN</span>
                  <span class="bp-zone-range">130–139/80–89</span>
                </div>
                <div class="bp-zone" style="border-left:3px solid #ef4444">
                  <span class="bp-zone-label">Stage 2 HTN</span>
                  <span class="bp-zone-range">&ge;140/90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Asthma -->
      @if (chronicTab() === 'asthma') {
        <div class="chronic-panel">
          <div class="chronic-grid">
            <div class="card">
              <div class="card-icon-header" style="color:#3b82f6">
                <i class="pi pi-cloud"></i>
                <h3>Peak Flow</h3>
              </div>
              <div class="big-metric">420 <span class="metric-unit">L/min</span></div>
              <div class="metric-sub">Personal best: 460 L/min</div>
              <div class="status-pill status-yellow">Yellow Zone (91% of best)</div>
              <div class="peak-flow-zones">
                <div class="pfz" style="background:#fee2e2">Red (&lt;80%): &lt;368 L/min</div>
                <div class="pfz" style="background:#fef9c3">Yellow (80–99%): 368–459</div>
                <div class="pfz pfz-active" style="background:#dcfce7">Green (&ge;80% best): &ge;368</div>
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#f97316">
                <i class="pi pi-bolt"></i>
                <h3>Rescue Inhaler Use</h3>
              </div>
              <div class="big-metric">3 <span class="metric-unit">times/week</span></div>
              <div class="metric-sub">Target: &le;2 times/week (well-controlled)</div>
              <div class="status-pill status-orange">Partially Controlled</div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#ef4444">
                <i class="pi pi-exclamation-triangle"></i>
                <h3>Known Triggers</h3>
              </div>
              <div class="trigger-list">
                <span class="trigger-chip">Dust mites</span>
                <span class="trigger-chip">Pollen</span>
                <span class="trigger-chip">Cold air</span>
                <span class="trigger-chip">Exercise</span>
                <span class="trigger-chip">Pet dander</span>
              </div>
            </div>

            <div class="card">
              <div class="card-icon-header" style="color:#8b5cf6">
                <i class="pi pi-book"></i>
                <h3>Action Plan</h3>
              </div>
              <ul class="tips-list">
                <li><strong>Green Zone:</strong> Take controller medication daily (Fluticasone 110mcg)</li>
                <li><strong>Yellow Zone:</strong> Add albuterol 2 puffs every 4–6 hours</li>
                <li><strong>Red Zone:</strong> Call Dr. Morris or go to ER immediately</li>
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  }

  <!-- ══════════════════════════════════════════════════
       TAB 3 · Weight & BMI
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'weight') {
    <div class="tab-content">
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Current Weight</div>
          <div class="stat-value">{{ svc.latestWeight()?.weight | number:'1.1-1' }} <span class="stat-unit">lbs</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Target Weight</div>
          <div class="stat-value">175 <span class="stat-unit">lbs</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current BMI</div>
          <div class="stat-value">{{ svc.latestWeight()?.bmi | number:'1.1-1' }}</div>
          <div class="stat-meta">Overweight (25–29.9)</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Change (12 mo)</div>
          <div class="stat-value" [style.color]="svc.weightChange() <= 0 ? 'var(--green-600)' : 'var(--orange-600)'">
            <i class="pi" [class]="svc.weightChange() <= 0 ? 'pi-arrow-down' : 'pi-arrow-up'"></i>
            {{ svc.weightChange() | number:'1.1-1' }} <span class="stat-unit">lbs</span>
          </div>
        </div>
      </div>

      <!-- Weight chart -->
      <div class="card chart-card">
        <h3 class="chart-card-title">Weight Trend (12 Months)</h3>
        @let wplot = buildWeightChart();
        <svg class="trend-svg" [attr.viewBox]="'0 0 ' + CW + ' ' + CH" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="wGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.18"/>
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0"/>
            </linearGradient>
            <clipPath id="wClip">
              <rect [attr.x]="PL" [attr.y]="PT" [attr.width]="CW-PL-PR" [attr.height]="CH-PT-PB"/>
            </clipPath>
          </defs>
          <!-- Target zone band (175 lbs ± ~2) -->
          <rect [attr.x]="PL" [attr.y]="wplot.toY(177)" [attr.width]="CW-PL-PR"
                [attr.height]="wplot.toY(173) - wplot.toY(177)"
                fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="4 3"
                clip-path="url(#wClip)"/>
          <text [attr.x]="CW-PR+3" [attr.y]="wplot.toY(175)" class="chart-ref-label" fill="#16a34a">Target</text>
          <!-- Grid -->
          @for (g of wplot.gridYLines; track g.y) {
            <line [attr.x1]="PL" [attr.y1]="g.y" [attr.x2]="CW-PR" [attr.y2]="g.y" class="grid-line"/>
            <text [attr.x]="PL-6" [attr.y]="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
          }
          <!-- Area -->
          <path [attr.d]="wplot.areaPath" fill="url(#wGrad)" clip-path="url(#wClip)"/>
          <!-- Line -->
          <path [attr.d]="wplot.linePath" class="chart-line" fill="none" stroke="#3b82f6" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" clip-path="url(#wClip)"/>
          <!-- X labels -->
          @for (pt of wplot.points; track $index) {
            <text [attr.x]="pt.x" [attr.y]="CH-PB+15" class="axis-label x-label" text-anchor="middle">
              {{ fmtMonthShort(pt.date) }}
            </text>
          }
          <!-- Dots -->
          @for (pt of wplot.points; track $index) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
          }
          <!-- Axes -->
          <line [attr.x1]="PL" [attr.y1]="PT" [attr.x2]="PL" [attr.y2]="CH-PB" class="axis-line"/>
          <line [attr.x1]="PL" [attr.y1]="CH-PB" [attr.x2]="CW-PR" [attr.y2]="CH-PB" class="axis-line"/>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Weight (lbs)</div>
          <div class="legend-item"><span class="legend-swatch" style="background:rgba(34,197,94,0.2);border:1px solid #22c55e"></span>Target Zone</div>
        </div>
      </div>

      <div class="info-box">
        <i class="pi pi-info-circle"></i>
        <div>BMI of 18.5–24.9 is considered healthy. Your target weight of 175 lbs would put your BMI at approximately 25.1. Aim for 0.5–1 lb/week weight loss through a calorie deficit of 250–500 kcal/day.</div>
      </div>
    </div>
  }

  <!-- ══════════════════════════════════════════════════
       TAB 4 · Blood Pressure
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'bp') {
    <div class="tab-content">
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Latest Reading</div>
          <div class="stat-value">128/82 <span class="stat-unit">mmHg</span></div>
          <div class="stat-meta">Feb 21, 2026</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">12-Month Average</div>
          <div class="stat-value">{{ bpAvg().sys }}/{{ bpAvg().dia }} <span class="stat-unit">mmHg</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Systolic Trend</div>
          <div class="stat-value" style="color:var(--green-600)">
            <i class="pi pi-arrow-down"></i> -7 <span class="stat-unit">mmHg</span>
          </div>
          <div class="stat-meta">vs 12 months ago</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Category</div>
          <div class="stat-value" style="color:#f97316;font-size:0.95rem">Stage 1 HTN</div>
        </div>
      </div>

      <!-- BP chart -->
      <div class="card chart-card">
        <h3 class="chart-card-title">Blood Pressure Trend (12 Months)</h3>
        @let bpplot = buildBpChart();
        <svg class="trend-svg" [attr.viewBox]="'0 0 ' + CW + ' ' + CH" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="bpClip">
              <rect [attr.x]="PL" [attr.y]="PT" [attr.width]="CW-PL-PR" [attr.height]="CH-PT-PB"/>
            </clipPath>
          </defs>
          <!-- Zone bands -->
          <!-- Normal: <120 sys, green -->
          <rect [attr.x]="PL" [attr.y]="bpplot.toY(120)" [attr.width]="CW-PL-PR"
                [attr.height]="bpplot.toY(60) - bpplot.toY(120)"
                fill="rgba(34,197,94,0.10)" clip-path="url(#bpClip)"/>
          <!-- Elevated: 120-129 sys, yellow -->
          <rect [attr.x]="PL" [attr.y]="bpplot.toY(129)" [attr.width]="CW-PL-PR"
                [attr.height]="bpplot.toY(120) - bpplot.toY(129)"
                fill="rgba(234,179,8,0.12)" clip-path="url(#bpClip)"/>
          <!-- Stage 1: 130-139 sys, orange -->
          <rect [attr.x]="PL" [attr.y]="bpplot.toY(139)" [attr.width]="CW-PL-PR"
                [attr.height]="bpplot.toY(129) - bpplot.toY(139)"
                fill="rgba(249,115,22,0.14)" clip-path="url(#bpClip)"/>
          <!-- Stage 2: >=140 sys, red -->
          <rect [attr.x]="PL" [attr.y]="PT" [attr.width]="CW-PL-PR"
                [attr.height]="bpplot.toY(139) - PT"
                fill="rgba(239,68,68,0.10)" clip-path="url(#bpClip)"/>
          <!-- Zone labels -->
          <text [attr.x]="CW-PR-4" [attr.y]="bpplot.toY(100)" class="zone-label" fill="#16a34a" text-anchor="end">Normal</text>
          <text [attr.x]="CW-PR-4" [attr.y]="bpplot.toY(124)" class="zone-label" fill="#ca8a04" text-anchor="end">Elevated</text>
          <text [attr.x]="CW-PR-4" [attr.y]="bpplot.toY(134)" class="zone-label" fill="#ea580c" text-anchor="end">Stage 1</text>
          <!-- Grid -->
          @for (g of bpplot.gridYLines; track g.y) {
            <line [attr.x1]="PL" [attr.y1]="g.y" [attr.x2]="CW-PR" [attr.y2]="g.y" class="grid-line"/>
            <text [attr.x]="PL-6" [attr.y]="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
          }
          <!-- Systolic area + line -->
          <path [attr.d]="bpplot.sysAreaPath" fill="rgba(239,68,68,0.07)" clip-path="url(#bpClip)"/>
          <path [attr.d]="bpplot.sysPath" fill="none" stroke="#ef4444" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" clip-path="url(#bpClip)"/>
          <!-- Diastolic line -->
          <path [attr.d]="bpplot.diaPath" fill="none" stroke="#3b82f6" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" clip-path="url(#bpClip)"/>
          <!-- X labels -->
          @for (pt of bpplot.sysPoints; track $index) {
            <text [attr.x]="pt.x" [attr.y]="CH-PB+15" class="axis-label x-label" text-anchor="middle">
              {{ fmtMonthShort(pt.date) }}
            </text>
          }
          <!-- Systolic dots -->
          @for (pt of bpplot.sysPoints; track $index) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#ef4444" stroke="white" stroke-width="2"/>
          }
          <!-- Diastolic dots -->
          @for (pt of bpplot.diaPoints; track $index) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
          }
          <!-- Axes -->
          <line [attr.x1]="PL" [attr.y1]="PT" [attr.x2]="PL" [attr.y2]="CH-PB" class="axis-line"/>
          <line [attr.x1]="PL" [attr.y1]="CH-PB" [attr.x2]="CW-PR" [attr.y2]="CH-PB" class="axis-line"/>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Systolic</div>
          <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Diastolic</div>
          <div class="legend-item zone-legend"><span style="background:rgba(34,197,94,0.2);display:inline-block;width:12px;height:12px;border-radius:2px"></span>Normal zone</div>
        </div>
      </div>

      <div class="info-box">
        <i class="pi pi-info-circle"></i>
        <div>Your blood pressure has improved by 7 mmHg systolic over 12 months. Continue your current medications and lifestyle changes. Goal: achieve &lt;130/80 mmHg (AHA Stage 1 threshold).</div>
      </div>
    </div>
  }

  <!-- ══════════════════════════════════════════════════
       TAB 5 · Glucose
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'glucose') {
    <div class="tab-content">
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Latest Fasting</div>
          <div class="stat-value">{{ svc.latestGlucose()?.fasting }} <span class="stat-unit">mg/dL</span></div>
          <div class="stat-meta">Normal (&lt;100)</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Latest HbA1c</div>
          <div class="stat-value" style="color:#f97316">{{ svc.latestHba1c() }}%</div>
          <div class="stat-meta">Target: &lt;7.0%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Fasting (12 mo)</div>
          <div class="stat-value">{{ glucoseAvg() }} <span class="stat-unit">mg/dL</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Trend</div>
          <div class="stat-value" style="color:var(--green-600)">
            <i class="pi pi-arrow-down"></i> Improving
          </div>
        </div>
      </div>

      <!-- Glucose chart -->
      <div class="card chart-card">
        <h3 class="chart-card-title">Glucose Trend (12 Months)</h3>
        @let gplot = buildGlucoseChart();
        <svg class="trend-svg" [attr.viewBox]="'0 0 ' + CW + ' ' + CH" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.18"/>
              <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0"/>
            </linearGradient>
            <clipPath id="gClip">
              <rect [attr.x]="PL" [attr.y]="PT" [attr.width]="CW-PL-PR" [attr.height]="CH-PT-PB"/>
            </clipPath>
          </defs>
          <!-- Normal fasting band 70-99 -->
          <rect [attr.x]="PL" [attr.y]="gplot.toY(99)" [attr.width]="CW-PL-PR"
                [attr.height]="gplot.toY(70) - gplot.toY(99)"
                fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="4 3"
                clip-path="url(#gClip)"/>
          <text [attr.x]="CW-PR+3" [attr.y]="gplot.toY(99)" class="chart-ref-label" fill="#16a34a">99</text>
          <text [attr.x]="CW-PR+3" [attr.y]="gplot.toY(70)" class="chart-ref-label" fill="#16a34a">70</text>
          <!-- Grid -->
          @for (g of gplot.gridYLines; track g.y) {
            <line [attr.x1]="PL" [attr.y1]="g.y" [attr.x2]="CW-PR" [attr.y2]="g.y" class="grid-line"/>
            <text [attr.x]="PL-6" [attr.y]="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
          }
          <!-- Post-meal area (lighter) -->
          <path [attr.d]="gplot.postMealAreaPath" fill="rgba(249,115,22,0.07)" clip-path="url(#gClip)"/>
          <!-- Fasting line -->
          <path [attr.d]="gplot.fastingPath" fill="none" stroke="#22c55e" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" clip-path="url(#gClip)"/>
          <!-- Post-meal dots -->
          @for (pt of gplot.postMealPoints; track $index) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#f97316" stroke="white" stroke-width="2"/>
          }
          <!-- Fasting dots -->
          @for (pt of gplot.fastingPoints; track $index) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#22c55e" stroke="white" stroke-width="2"/>
          }
          <!-- X labels -->
          @for (pt of gplot.fastingPoints; track $index) {
            <text [attr.x]="pt.x" [attr.y]="CH-PB+15" class="axis-label x-label" text-anchor="middle">
              {{ fmtMonthShort(pt.date) }}
            </text>
          }
          <!-- Axes -->
          <line [attr.x1]="PL" [attr.y1]="PT" [attr.x2]="PL" [attr.y2]="CH-PB" class="axis-line"/>
          <line [attr.x1]="PL" [attr.y1]="CH-PB" [attr.x2]="CW-PR" [attr.y2]="CH-PB" class="axis-line"/>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Fasting Glucose</div>
          <div class="legend-item"><span class="legend-dot" style="background:#f97316"></span>Post-Meal Glucose</div>
          <div class="legend-item"><span class="legend-swatch" style="background:rgba(34,197,94,0.2);border:1px solid #22c55e"></span>Normal Range (70–99)</div>
        </div>
      </div>
    </div>
  }

  <!-- ══════════════════════════════════════════════════
       TAB 6 · Activity
  ══════════════════════════════════════════════════ -->
  @if (activeTab() === 'activity') {
    <div class="tab-content">
      <!-- Weekly summary cards -->
      <div class="activity-summary">
        <div class="activity-card">
          <div class="act-icon" style="background:#eff6ff;color:#3b82f6"><i class="pi pi-map"></i></div>
          <div class="act-label">Avg Daily Steps</div>
          <div class="act-value">{{ svc.avgSteps() | number }}</div>
          <div class="act-goal">Goal: 10,000</div>
          <div class="act-bar-track">
            <div class="act-bar-fill" [style.width.%]="(svc.avgSteps() / 10000) * 100" style="background:#3b82f6"></div>
          </div>
        </div>
        <div class="activity-card">
          <div class="act-icon" style="background:#f0fdf4;color:#22c55e"><i class="pi pi-bolt"></i></div>
          <div class="act-label">Avg Active Minutes</div>
          <div class="act-value">{{ svc.latestActivity()?.activeMinutes }}</div>
          <div class="act-goal">Goal: 60 min/day</div>
          <div class="act-bar-track">
            <div class="act-bar-fill" [style.width.%]="(svc.latestActivity()?.activeMinutes ?? 0) / 60 * 100" style="background:#22c55e"></div>
          </div>
        </div>
        <div class="activity-card">
          <div class="act-icon" style="background:#fff7ed;color:#f97316"><i class="pi pi-fire"></i></div>
          <div class="act-label">Avg Calories Burned</div>
          <div class="act-value">{{ svc.latestActivity()?.caloriesBurned | number }}</div>
          <div class="act-goal">Goal: 2,500 kcal</div>
          <div class="act-bar-track">
            <div class="act-bar-fill" [style.width.%]="(svc.latestActivity()?.caloriesBurned ?? 0) / 2500 * 100" style="background:#f97316"></div>
          </div>
        </div>
        <div class="activity-card">
          <div class="act-icon" style="background:#faf5ff;color:#8b5cf6"><i class="pi pi-moon"></i></div>
          <div class="act-label">Avg Sleep</div>
          <div class="act-value">{{ svc.avgSleep() }} <span style="font-size:0.85rem;font-weight:500">hrs</span></div>
          <div class="act-goal">Goal: 8 hrs/night</div>
          <div class="act-bar-track">
            <div class="act-bar-fill" [style.width.%]="(svc.avgSleep() / 8) * 100" style="background:#8b5cf6"></div>
          </div>
        </div>
      </div>

      <!-- Steps bar chart -->
      <div class="card chart-card">
        <h3 class="chart-card-title">Monthly Step Count (Last 7 Data Points)</h3>
        @let aplot = buildActivityChart();
        <svg class="trend-svg" [attr.viewBox]="'0 0 ' + CW + ' ' + CH" preserveAspectRatio="xMidYMid meet">
          <!-- Goal line -->
          <line [attr.x1]="PL" [attr.y1]="aplot.toY(10000)" [attr.x2]="CW-PR" [attr.y2]="aplot.toY(10000)"
                stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6 4"/>
          <text [attr.x]="CW-PR+3" [attr.y]="aplot.toY(10000)+4" class="chart-ref-label" fill="#16a34a">Goal</text>
          <!-- Grid -->
          @for (g of aplot.gridYLines; track g.y) {
            <line [attr.x1]="PL" [attr.y1]="g.y" [attr.x2]="CW-PR" [attr.y2]="g.y" class="grid-line"/>
            <text [attr.x]="PL-6" [attr.y]="g.y+4" class="axis-label" text-anchor="end">{{ g.label }}</text>
          }
          <!-- Bars -->
          @for (bar of aplot.bars; track $index) {
            <rect [attr.x]="bar.x - bar.w/2" [attr.y]="bar.top" [attr.width]="bar.w" [attr.height]="bar.h"
                  [attr.fill]="bar.steps >= 10000 ? '#22c55e' : '#3b82f6'" rx="3" opacity="0.85"/>
            <text [attr.x]="bar.x" [attr.y]="CH-PB+15" class="axis-label x-label" text-anchor="middle">
              {{ fmtMonthShort(bar.date) }}
            </text>
            <text [attr.x]="bar.x" [attr.y]="bar.top - 4" class="bar-val-label" text-anchor="middle">
              {{ (bar.steps / 1000).toFixed(1) }}k
            </text>
          }
          <!-- Axes -->
          <line [attr.x1]="PL" [attr.y1]="PT" [attr.x2]="PL" [attr.y2]="CH-PB" class="axis-line"/>
          <line [attr.x1]="PL" [attr.y1]="CH-PB" [attr.x2]="CW-PR" [attr.y2]="CH-PB" class="axis-line"/>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Steps (below goal)</div>
          <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Steps (at/above goal)</div>
          <div class="legend-item"><span style="display:inline-block;width:20px;height:2px;background:#22c55e;vertical-align:middle;margin-right:4px;border-top:2px dashed #22c55e"></span>10k Goal</div>
        </div>
      </div>

      <!-- Connected devices -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom:1rem">Connected Devices</h3>
        <div class="device-list">
          <div class="device-item">
            <div class="device-icon" style="background:#000;color:#fff"><i class="pi pi-apple"></i></div>
            <div>
              <div class="device-name">Apple Watch Series 9</div>
              <div class="device-status">Last synced: 2 hours ago</div>
            </div>
            <span class="status-pill status-green" style="margin-left:auto">Connected</span>
          </div>
          <div class="device-item">
            <div class="device-icon" style="background:#00b0b9;color:#fff"><i class="pi pi-chart-bar"></i></div>
            <div>
              <div class="device-name">Fitbit Charge 6</div>
              <div class="device-status">Last synced: 1 day ago</div>
            </div>
            <span class="status-pill status-yellow" style="margin-left:auto">Syncing</span>
          </div>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    .ha-page { max-width: 1280px; margin: 0 auto; }

    /* Page header */
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;
    }
    .page-title { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    /* Tab bar */
    .tab-bar {
      display: flex; gap: 2px; background: var(--surface-ground); border-radius: 10px;
      padding: 4px; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
      border: none; border-radius: 8px; background: transparent; cursor: pointer;
      font-family: inherit; font-size: 0.85rem; font-weight: 500; color: var(--text-color-secondary);
      transition: all 0.2s ease; white-space: nowrap;
    }
    .tab-btn.active { background: var(--surface-card); color: var(--primary-color); box-shadow: 0 1px 4px rgba(0,0,0,0.1); font-weight: 700; }
    .tab-btn:hover:not(.active) { color: var(--text-color); background: var(--surface-hover); }

    /* Sub-tab bar */
    .sub-tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .sub-tab-btn {
      padding: 0.4rem 1rem; border: 1px solid var(--surface-border); border-radius: 20px;
      background: var(--surface-card); cursor: pointer; font-family: inherit; font-size: 0.82rem;
      font-weight: 500; color: var(--text-color-secondary); transition: all 0.2s ease;
    }
    .sub-tab-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    /* Tab content */
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Card */
    .card {
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: var(--border-radius); padding: 1.5rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }
    .card-title { margin: 0 0 0.25rem; font-size: 1.1rem; font-weight: 700; color: var(--text-color); }
    .card-sub { margin: 0 0 1.25rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .card-icon-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .card-icon-header h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-color); }
    .card-icon-header i { font-size: 1rem; }

    /* Health Score gauge */
    .score-layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; align-items: start; }
    .gauge-card { display: flex; flex-direction: column; }
    .gauge-wrap { display: flex; flex-direction: column; align-items: center; margin: 1rem 0; position: relative; }
    .gauge-svg { width: 180px; height: 180px; }
    .gauge-score-text { font-size: 2.2rem; font-weight: 800; fill: var(--text-color); font-family: inherit; }
    .gauge-label-text { font-size: 0.7rem; fill: var(--text-color-secondary); font-family: inherit; }
    .gauge-badge {
      margin-top: 0.75rem; padding: 0.3rem 1rem; border-radius: 20px; color: white;
      font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em;
    }

    /* Collapsible info */
    .collapsible-btn {
      display: flex; align-items: center; gap: 0.5rem; background: none; border: none;
      cursor: pointer; font-family: inherit; font-size: 0.82rem; color: var(--primary-color);
      font-weight: 600; padding: 0.5rem 0; margin-top: 0.5rem;
    }
    .collapsible-btn i { font-size: 0.75rem; }
    .calc-info {
      background: var(--surface-ground); border-radius: 8px; padding: 1rem 1.25rem;
      font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.6; margin-top: 0.5rem;
    }
    .calc-info ul { margin: 0.5rem 0; padding-left: 1.25rem; }
    .calc-info li { margin-bottom: 0.3rem; }
    .calc-info p { margin: 0.5rem 0 0; }
    .calc-disclaimer { font-style: italic; font-size: 0.75rem; }

    /* Category cards grid */
    .categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .category-card {
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: var(--border-radius); padding: 1rem 1.25rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }
    .cat-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.75rem; }
    .cat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .cat-name { flex: 1; font-size: 0.88rem; font-weight: 600; color: var(--text-color); }
    .cat-score { font-size: 1.5rem; font-weight: 800; }
    .cat-bar-track { height: 8px; background: var(--surface-200, #e5e7eb); border-radius: 4px; overflow: hidden; }
    .cat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
    .cat-scale { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-color-secondary); margin-top: 0.3rem; }

    /* Chronic conditions */
    .chronic-panel { display: flex; flex-direction: column; gap: 1.25rem; }
    .chronic-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

    /* Big metric */
    .big-metric { font-size: 2rem; font-weight: 800; color: var(--text-color); margin: 0.5rem 0 0.25rem; }
    .metric-unit { font-size: 1rem; font-weight: 400; color: var(--text-color-secondary); }
    .metric-sub { font-size: 0.78rem; color: var(--text-color-secondary); margin-bottom: 0.625rem; }
    .metric-trend { display: flex; align-items: center; gap: 0.375rem; font-size: 0.78rem; color: var(--text-color-secondary); margin-top: 0.75rem; }

    /* Status pills */
    .status-pill { display: inline-block; padding: 0.2rem 0.625rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; margin-bottom: 0.5rem; }
    .status-green { background: #dcfce7; color: #16a34a; }
    .status-yellow { background: #fef9c3; color: #a16207; }
    .status-orange { background: #ffedd5; color: #c2410c; }
    .status-red { background: #fee2e2; color: #b91c1c; }

    /* Target bar */
    .target-bar-wrap { margin-top: 0.75rem; }
    .target-bar-track { position: relative; height: 12px; background: var(--surface-200, #e5e7eb); border-radius: 6px; overflow: hidden; }
    .target-zone { position: absolute; top: 0; height: 100%; }
    .target-indicator { position: absolute; top: -2px; width: 3px; height: 16px; background: var(--primary-color); border-radius: 2px; transform: translateX(-50%); }
    .target-bar-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

    /* Appointment */
    .appt-info { margin-top: 0.5rem; }
    .appt-date { font-size: 1.4rem; font-weight: 700; color: var(--primary-color); }
    .appt-with { font-size: 0.88rem; font-weight: 600; color: var(--text-color); margin-top: 0.25rem; }
    .appt-type { font-size: 0.78rem; color: var(--text-color-secondary); margin-top: 0.2rem; }

    /* Med list */
    .med-list { list-style: none; padding: 0; margin: 0.5rem 0; display: flex; flex-direction: column; gap: 0.625rem; }
    .med-list li { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid var(--surface-border); }
    .med-list li:last-child { border-bottom: none; }
    .med-name { font-size: 0.85rem; font-weight: 600; color: var(--text-color); }
    .med-freq { font-size: 0.75rem; color: var(--text-color-secondary); }
    .med-note { font-size: 0.72rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

    /* Tips list */
    .tips-list { list-style: none; padding: 0; margin: 0.5rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .tips-list li { font-size: 0.82rem; color: var(--text-color-secondary); padding-left: 1rem; position: relative; line-height: 1.4; }
    .tips-list li::before { content: '•'; position: absolute; left: 0; color: var(--primary-color); }

    /* BP zones */
    .bp-zones { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
    .bp-zone { padding: 0.4rem 0.75rem; border-radius: 4px; background: var(--surface-ground); display: flex; justify-content: space-between; }
    .bp-zone-label { font-size: 0.8rem; font-weight: 600; color: var(--text-color); }
    .bp-zone-range { font-size: 0.78rem; color: var(--text-color-secondary); }

    /* Asthma */
    .peak-flow-zones { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 4px; border-radius: 6px; overflow: hidden; }
    .pfz { padding: 0.35rem 0.75rem; font-size: 0.78rem; color: var(--text-color); }
    .pfz-active { font-weight: 700; }
    .trigger-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .trigger-chip { padding: 0.25rem 0.75rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: 20px; font-size: 0.78rem; color: var(--text-color); }

    /* Stats row */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .stat-card {
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: var(--border-radius); padding: 1rem 1.25rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }
    .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); margin-bottom: 0.375rem; }
    .stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-color); display: flex; align-items: baseline; gap: 0.25rem; flex-wrap: wrap; }
    .stat-value i { font-size: 0.9rem; }
    .stat-unit { font-size: 0.72rem; font-weight: 400; color: var(--text-color-secondary); }
    .stat-meta { font-size: 0.7rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

    /* Chart card */
    .chart-card { padding: 1.25rem 1rem 0.75rem; }
    .chart-card-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 700; color: var(--text-color); }
    .trend-svg { width: 100%; height: auto; display: block; overflow: visible; }

    /* SVG elements */
    .grid-line { stroke: var(--surface-border); stroke-width: 1; stroke-dasharray: 3 4; }
    .axis-line { stroke: var(--surface-border); stroke-width: 1.5; }
    .axis-label { font-size: 10px; fill: var(--text-color-secondary); font-family: inherit; }
    .x-label { font-size: 9px; }
    .chart-ref-label { font-size: 9px; font-family: inherit; }
    .zone-label { font-size: 9px; font-family: inherit; font-weight: 600; }
    .bar-val-label { font-size: 9px; fill: var(--text-color-secondary); font-family: inherit; }

    /* Legend */
    .chart-legend { display: flex; align-items: center; gap: 1.25rem; padding: 0.625rem 0.25rem 0.25rem; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--text-color-secondary); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .legend-swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
    .zone-legend { display: flex; align-items: center; gap: 0.375rem; }

    /* Info box */
    .info-box {
      display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.875rem 1.125rem;
      background: var(--blue-50, #eff6ff); border: 1px solid var(--blue-100, #dbeafe);
      border-radius: var(--border-radius); font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.5;
    }
    .info-box i { color: var(--blue-500); flex-shrink: 0; margin-top: 2px; }

    /* Activity */
    .activity-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .activity-card {
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: var(--border-radius); padding: 1.25rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }
    .act-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; margin-bottom: 0.75rem; }
    .act-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-color-secondary); margin-bottom: 0.25rem; }
    .act-value { font-size: 1.8rem; font-weight: 800; color: var(--text-color); margin-bottom: 0.25rem; }
    .act-goal { font-size: 0.72rem; color: var(--text-color-secondary); margin-bottom: 0.5rem; }
    .act-bar-track { height: 6px; background: var(--surface-200, #e5e7eb); border-radius: 3px; overflow: hidden; }
    .act-bar-fill { height: 100%; border-radius: 3px; max-width: 100%; }

    /* Devices */
    .device-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .device-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--surface-ground); border-radius: 8px; }
    .device-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    .device-name { font-size: 0.88rem; font-weight: 600; color: var(--text-color); }
    .device-status { font-size: 0.75rem; color: var(--text-color-secondary); }

    /* Responsive */
    @media (max-width: 1024px) {
      .score-layout { grid-template-columns: 1fr; }
      .categories-grid { grid-template-columns: repeat(3, 1fr); }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .activity-summary { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .categories-grid { grid-template-columns: repeat(2, 1fr); }
      .chronic-grid { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .activity-summary { grid-template-columns: repeat(2, 1fr); }
      .tab-btn span { display: none; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr 1fr; }
      .categories-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HealthAnalyticsComponent {
  readonly svc = inject(HealthAnalyticsService);

  // Expose chart constants to template
  readonly CW = CHART_W;
  readonly CH = CHART_H;
  readonly PL = PAD_L;
  readonly PR = PAD_R;
  readonly PT = PAD_T;
  readonly PB = PAD_B;

  readonly activeTab = signal<string>('score');
  readonly chronicTab = signal<string>('diabetes');
  readonly showCalcInfo = signal(false);

  readonly tabs = [
    { id: 'score',   label: 'Health Score',        icon: 'pi-star' },
    { id: 'chronic', label: 'Chronic Conditions',  icon: 'pi-heart' },
    { id: 'weight',  label: 'Weight & BMI',        icon: 'pi-chart-bar' },
    { id: 'bp',      label: 'Blood Pressure',      icon: 'pi-bolt' },
    { id: 'glucose', label: 'Glucose',             icon: 'pi-drop' },
    { id: 'activity',label: 'Activity',            icon: 'pi-map' },
  ];

  readonly chronicTabs = [
    { id: 'diabetes',     label: 'Diabetes' },
    { id: 'hypertension', label: 'Hypertension' },
    { id: 'asthma',       label: 'Asthma' },
  ];

  // Gauge computed values
  readonly gaugeOffset = computed(() => {
    const score = this.svc.healthScore();
    const circumference = 502.65;
    return circumference - (score / 100) * circumference;
  });

  readonly gaugeColor = computed(() => {
    const s = this.svc.healthScore();
    return s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
  });

  readonly gaugeLabel = computed(() => {
    const s = this.svc.healthScore();
    return s >= 80 ? 'Good' : s >= 60 ? 'Fair' : 'Needs Attention';
  });

  readonly bpAvg = computed(() => {
    const data = this.svc.bpData();
    if (data.length === 0) return { sys: 0, dia: 0 };
    const sys = Math.round(data.reduce((a, b) => a + b.systolic, 0) / data.length);
    const dia = Math.round(data.reduce((a, b) => a + b.diastolic, 0) / data.length);
    return { sys, dia };
  });

  readonly glucoseAvg = computed(() => {
    const data = this.svc.glucoseData();
    if (data.length === 0) return 0;
    return Math.round(data.reduce((a, b) => a + b.fasting, 0) / data.length);
  });

  // ── Chart builders ────────────────────────────────────────────────────────

  buildWeightChart() {
    const data = this.svc.weightData();
    const plot = makePlot(data, d => d.weight, 0.05);
    const pts = data.map((d, i) => ({ x: plot.toX(i), y: plot.toY(d.weight), date: d.date }));
    const linePath = buildSmoothPath(pts);
    const bottomY = PAD_T + (CHART_H - PAD_T - PAD_B);
    const areaPath = pts.length
      ? `${linePath} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`
      : '';
    return { ...plot, points: pts, linePath, areaPath };
  }

  buildBpChart() {
    const data = this.svc.bpData();
    // Use combined domain for both lines
    const allVals = data.flatMap(d => [d.systolic, d.diastolic]);
    const rawMin = Math.min(...allVals, 60);
    const rawMax = Math.max(...allVals, 145);
    const pad    = (rawMax - rawMin) * 0.1;
    const yMin   = rawMin - pad;
    const yMax   = rawMax + pad;
    const plotW  = CHART_W - PAD_L - PAD_R;
    const plotH  = CHART_H - PAD_T - PAD_B;
    const toX    = (i: number) => data.length === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (data.length - 1)) * plotW;
    const toY    = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    const gridYLines: { y: number; label: string }[] = [];
    for (let s = 0; s <= 4; s++) {
      const v = yMin + (s / 4) * (yMax - yMin);
      gridYLines.push({ y: toY(v), label: Math.round(v).toString() });
    }

    const sysPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.systolic), date: d.date }));
    const diaPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.diastolic), date: d.date }));

    const sysPath = buildSmoothPath(sysPoints);
    const diaPath = buildSmoothPath(diaPoints);
    const bottomY = PAD_T + plotH;
    const sysAreaPath = sysPoints.length
      ? `${sysPath} L ${sysPoints[sysPoints.length - 1].x},${bottomY} L ${sysPoints[0].x},${bottomY} Z`
      : '';

    return { toX, toY, gridYLines, sysPoints, diaPoints, sysPath, diaPath, sysAreaPath };
  }

  buildGlucoseChart() {
    const data = this.svc.glucoseData();
    const allVals = data.flatMap(d => [d.fasting, ...(d.postMeal ? [d.postMeal] : [])]);
    const rawMin = Math.min(...allVals, 60);
    const rawMax = Math.max(...allVals, 180);
    const pad    = (rawMax - rawMin) * 0.12;
    const yMin   = rawMin - pad;
    const yMax   = rawMax + pad;
    const plotW  = CHART_W - PAD_L - PAD_R;
    const plotH  = CHART_H - PAD_T - PAD_B;
    const toX    = (i: number) => data.length === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (data.length - 1)) * plotW;
    const toY    = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    const gridYLines: { y: number; label: string }[] = [];
    for (let s = 0; s <= 4; s++) {
      const v = yMin + (s / 4) * (yMax - yMin);
      gridYLines.push({ y: toY(v), label: Math.round(v).toString() });
    }

    const fastingPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.fasting), date: d.date }));
    const postMealPoints = data
      .map((d, i) => d.postMeal ? { x: toX(i), y: toY(d.postMeal), date: d.date } : null)
      .filter((p): p is { x: number; y: number; date: Date } => p !== null);

    const fastingPath = buildSmoothPath(fastingPoints);
    const bottomY = PAD_T + plotH;
    const postMealAreaPath = postMealPoints.length
      ? `M ${postMealPoints[0].x},${bottomY} ` +
        postMealPoints.map(p => `L ${p.x},${p.y}`).join(' ') +
        ` L ${postMealPoints[postMealPoints.length - 1].x},${bottomY} Z`
      : '';

    return { toX, toY, gridYLines, fastingPoints, postMealPoints, fastingPath, postMealAreaPath };
  }

  buildActivityChart() {
    const data = this.svc.last7DaysActivity();
    const plot = makePlot(data, d => d.steps, 0.1);
    const plotW = CHART_W - PAD_L - PAD_R;
    const barW  = Math.max(20, (plotW / (data.length + 1)) * 0.65);
    const bottomY = PAD_T + (CHART_H - PAD_T - PAD_B);
    const bars = data.map((d, i) => {
      const x    = plot.toX(i);
      const top  = plot.toY(d.steps);
      const h    = Math.max(2, bottomY - top);
      return { x, top, h, w: barW, steps: d.steps, date: d.date };
    });
    return { ...plot, bars };
  }

  fmtMonthShort(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}
