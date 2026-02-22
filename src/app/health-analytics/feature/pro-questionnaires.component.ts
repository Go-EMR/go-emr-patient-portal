import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HealthAnalyticsService } from '../data-access';

// ── PHQ-9 Questions ──────────────────────────────────────────────────────────
const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
];

// ── GAD-7 Questions ──────────────────────────────────────────────────────────
const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const FREQUENCY_OPTIONS = [
  { label: 'Not at all',              value: 0 },
  { label: 'Several days',            value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day',        value: 3 },
];

function phq9Severity(score: number): { label: string; color: string } {
  if (score <= 4)  return { label: 'Minimal depression',   color: '#22c55e' };
  if (score <= 9)  return { label: 'Mild depression',      color: '#84cc16' };
  if (score <= 14) return { label: 'Moderate depression',  color: '#f59e0b' };
  if (score <= 19) return { label: 'Moderately severe',    color: '#f97316' };
  return               { label: 'Severe depression',       color: '#ef4444' };
}

function gad7Severity(score: number): { label: string; color: string } {
  if (score <= 4)  return { label: 'Minimal anxiety',      color: '#22c55e' };
  if (score <= 9)  return { label: 'Mild anxiety',         color: '#84cc16' };
  if (score <= 14) return { label: 'Moderate anxiety',     color: '#f59e0b' };
  return               { label: 'Severe anxiety',          color: '#ef4444' };
}

// Sparkline for history scores (simple SVG path)
function historySparkPath(scores: number[], maxScore: number, w: number, h: number): string {
  if (scores.length < 2) return '';
  const toX = (i: number) => (i / (scores.length - 1)) * w;
  const toY = (v: number) => h - (v / maxScore) * h;
  return scores.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)},${toY(s).toFixed(1)}`).join(' ');
}

@Component({
  selector: 'app-pro-questionnaires',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
<div class="pro-page">

  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <i class="pi pi-clipboard"></i>
      </div>
      <div>
        <h1 class="page-title">Patient-Reported Outcomes</h1>
        <p class="page-subtitle">Mental health screening questionnaires — PHQ-9 and GAD-7</p>
      </div>
    </div>
  </div>

  <!-- Questionnaire selector -->
  <div class="q-selector">
    <button class="q-tab" [class.active]="activeQ() === 'phq9'" (click)="switchQ('phq9')">
      <i class="pi pi-sun"></i>
      PHQ-9 Depression Screening
    </button>
    <button class="q-tab" [class.active]="activeQ() === 'gad7'" (click)="switchQ('gad7')">
      <i class="pi pi-bolt"></i>
      GAD-7 Anxiety Screening
    </button>
  </div>

  <div class="pro-layout">

    <!-- Left: Questionnaire form -->
    <div class="q-form-col">

      @if (!submitted()) {
        <div class="card q-card">
          <div class="q-header">
            <div class="q-badge" [style.background]="activeQ() === 'phq9' ? '#faf5ff' : '#eff6ff'" [style.color]="activeQ() === 'phq9' ? '#7c3aed' : '#2563eb'">
              {{ activeQ() === 'phq9' ? 'PHQ-9' : 'GAD-7' }}
            </div>
            <h2 class="q-title">{{ activeQ() === 'phq9' ? 'Depression Screening' : 'Anxiety Screening' }}</h2>
            <p class="q-instruction">Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?</p>
          </div>

          <div class="q-questions">
            @for (question of currentQuestions(); track $index) {
              <div class="q-item" [class.answered]="currentAnswers()[$index] !== -1">
                <div class="q-num">{{ $index + 1 }}</div>
                <div class="q-text">{{ question }}</div>
                <div class="q-options">
                  @for (opt of frequencyOptions; track opt.value) {
                    <label class="q-option" [class.selected]="currentAnswers()[$index] === opt.value">
                      <input type="radio" [name]="'q' + $index" [value]="opt.value"
                             [checked]="currentAnswers()[$index] === opt.value"
                             (change)="setAnswer($index, opt.value)"/>
                      <span class="opt-dot"></span>
                      <span class="opt-label">{{ opt.label }}</span>
                      <span class="opt-score">({{ opt.value }})</span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Functional impairment question (PHQ-9 only) -->
          @if (activeQ() === 'phq9') {
            <div class="functional-q">
              <p class="q-instruction">If you checked off <strong>any problems</strong>, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?</p>
              <div class="func-options">
                @for (opt of functionalOptions; track opt) {
                  <label class="func-option" [class.selected]="functionalAnswer() === opt">
                    <input type="radio" name="functional" [value]="opt" [checked]="functionalAnswer() === opt" (change)="functionalAnswer.set(opt)"/>
                    <span>{{ opt }}</span>
                  </label>
                }
              </div>
            </div>
          }

          <!-- Progress bar -->
          <div class="q-progress">
            <div class="q-progress-label">
              <span>{{ answeredCount() }} of {{ currentQuestions().length }} answered</span>
              <span>{{ answeredCount() === currentQuestions().length ? 'Ready to submit' : 'Please answer all questions' }}</span>
            </div>
            <div class="q-progress-track">
              <div class="q-progress-fill" [style.width.%]="(answeredCount() / currentQuestions().length) * 100"></div>
            </div>
          </div>

          <button class="submit-btn" [disabled]="answeredCount() < currentQuestions().length" (click)="submitQuestionnaire()">
            <i class="pi pi-check-circle"></i>
            Submit {{ activeQ() === 'phq9' ? 'PHQ-9' : 'GAD-7' }}
          </button>
        </div>

      } @else {
        <!-- Results card -->
        <div class="card result-card">
          <div class="result-header">
            <i class="pi pi-check-circle result-icon"></i>
            <h2>Questionnaire Submitted</h2>
            <p>Your responses have been recorded. Here is your result:</p>
          </div>

          <div class="result-score-wrap">
            <div class="result-score-circle" [style.border-color]="currentSeverity().color">
              <div class="result-score-num" [style.color]="currentSeverity().color">{{ currentScore() }}</div>
              <div class="result-score-max">/ {{ activeQ() === 'phq9' ? 27 : 21 }}</div>
            </div>
            <div class="result-severity" [style.color]="currentSeverity().color">{{ currentSeverity().label }}</div>
          </div>

          <div class="result-breakdown">
            <h3>Score Interpretation</h3>
            @if (activeQ() === 'phq9') {
              <div class="interp-table">
                <div class="interp-row" [class.current-range]="currentScore() <= 4">
                  <span class="interp-range">0–4</span><span class="interp-label" style="color:#22c55e">Minimal depression</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 5 && currentScore() <= 9">
                  <span class="interp-range">5–9</span><span class="interp-label" style="color:#84cc16">Mild depression</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 10 && currentScore() <= 14">
                  <span class="interp-range">10–14</span><span class="interp-label" style="color:#f59e0b">Moderate depression</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 15 && currentScore() <= 19">
                  <span class="interp-range">15–19</span><span class="interp-label" style="color:#f97316">Moderately severe</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 20">
                  <span class="interp-range">20–27</span><span class="interp-label" style="color:#ef4444">Severe depression</span>
                </div>
              </div>
            } @else {
              <div class="interp-table">
                <div class="interp-row" [class.current-range]="currentScore() <= 4">
                  <span class="interp-range">0–4</span><span class="interp-label" style="color:#22c55e">Minimal anxiety</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 5 && currentScore() <= 9">
                  <span class="interp-range">5–9</span><span class="interp-label" style="color:#84cc16">Mild anxiety</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 10 && currentScore() <= 14">
                  <span class="interp-range">10–14</span><span class="interp-label" style="color:#f59e0b">Moderate anxiety</span>
                </div>
                <div class="interp-row" [class.current-range]="currentScore() >= 15">
                  <span class="interp-range">15–21</span><span class="interp-label" style="color:#ef4444">Severe anxiety</span>
                </div>
              </div>
            }
          </div>

          <div class="crisis-notice">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <strong>If you are in crisis:</strong> Call or text 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.
              This questionnaire is a screening tool only and does not replace a clinical evaluation.
            </div>
          </div>

          <button class="retry-btn" (click)="resetQuestionnaire()">
            <i class="pi pi-refresh"></i>
            Take Again
          </button>
        </div>
      }
    </div>

    <!-- Right: History panel -->
    <div class="q-history-col">
      <div class="card">
        <h3 class="history-title">Score History</h3>

        <!-- PHQ-9 history -->
        <div class="history-section">
          <div class="history-label">PHQ-9 — Depression</div>
          @let phqHist = svc.phq9History();
          <svg class="history-spark" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
            <path [attr.d]="phqSparkPath()" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            @for (pt of phqSvgPoints(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
              <text [attr.x]="pt.x" [attr.y]="pt.y - 7" text-anchor="middle" class="spark-val">{{ phqHist[$index].score }}</text>
            }
          </svg>
          <div class="history-entries">
            @for (entry of phqHist; track entry.date.getTime()) {
              <div class="history-entry">
                <span class="he-date">{{ fmtDate(entry.date) }}</span>
                <span class="he-score" [style.color]="phq9Severity(entry.score).color">{{ entry.score }}/27</span>
                <span class="he-sev" [style.color]="phq9Severity(entry.score).color">{{ entry.severity }}</span>
              </div>
            }
          </div>
        </div>

        <div class="history-divider"></div>

        <!-- GAD-7 history -->
        <div class="history-section">
          <div class="history-label">GAD-7 — Anxiety</div>
          @let gad7Hist = svc.gad7History();
          <svg class="history-spark" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
            <path [attr.d]="gadSparkPath()" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            @for (pt of gadSvgPoints(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" fill="#2563eb" stroke="white" stroke-width="1.5"/>
              <text [attr.x]="pt.x" [attr.y]="pt.y - 7" text-anchor="middle" class="spark-val">{{ gad7Hist[$index].score }}</text>
            }
          </svg>
          <div class="history-entries">
            @for (entry of gad7Hist; track entry.date.getTime()) {
              <div class="history-entry">
                <span class="he-date">{{ fmtDate(entry.date) }}</span>
                <span class="he-score" [style.color]="gad7Severity(entry.score).color">{{ entry.score }}/21</span>
                <span class="he-sev" [style.color]="gad7Severity(entry.score).color">{{ entry.severity }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Info card -->
      <div class="card info-card">
        <h3 class="info-card-title"><i class="pi pi-info-circle"></i> About These Questionnaires</h3>
        <p>The <strong>PHQ-9</strong> (Patient Health Questionnaire-9) is a validated tool for screening and measuring depression severity.</p>
        <p>The <strong>GAD-7</strong> (Generalized Anxiety Disorder-7) is a validated tool for screening and measuring anxiety severity.</p>
        <p>Complete these questionnaires regularly and share results with your mental health provider for the most benefit.</p>
        <div class="frequency-rec">
          <i class="pi pi-calendar"></i>
          <span>Recommended frequency: Every 2 weeks during active treatment, monthly for maintenance</span>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .pro-page { max-width: 1200px; margin: 0 auto; }

    /* Header */
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;
    }
    .page-title { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    /* Questionnaire selector */
    .q-selector { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .q-tab {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem;
      border: 2px solid var(--surface-border); border-radius: 10px; background: var(--surface-card);
      cursor: pointer; font-family: inherit; font-size: 0.88rem; font-weight: 600;
      color: var(--text-color-secondary); transition: all 0.2s ease;
    }
    .q-tab.active { border-color: var(--primary-color); color: var(--primary-color); background: var(--primary-50, #f5f3ff); }
    .q-tab:hover:not(.active) { border-color: var(--primary-300); color: var(--text-color); }

    /* Layout */
    .pro-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
    .q-form-col { display: flex; flex-direction: column; gap: 1rem; }
    .q-history-col { display: flex; flex-direction: column; gap: 1rem; }

    /* Card */
    .card {
      background: var(--surface-card); border: 1px solid var(--surface-border);
      border-radius: var(--border-radius); padding: 1.5rem;
      box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.06));
    }

    /* Questionnaire card */
    .q-card { padding: 0; overflow: hidden; }
    .q-header { padding: 1.5rem; border-bottom: 1px solid var(--surface-border); }
    .q-badge {
      display: inline-block; padding: 0.2rem 0.75rem; border-radius: 20px;
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      margin-bottom: 0.625rem;
    }
    .q-title { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-color); }
    .q-instruction { margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.5; }

    /* Questions */
    .q-questions { padding: 0 1.5rem; }
    .q-item {
      padding: 1.25rem 0; border-bottom: 1px solid var(--surface-border);
      transition: background 0.15s ease;
    }
    .q-item:last-child { border-bottom: none; }
    .q-item.answered .q-num { background: var(--green-500); color: white; }
    .q-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 50%; background: var(--surface-200, #e5e7eb);
      color: var(--text-color-secondary); font-size: 0.72rem; font-weight: 700;
      margin-bottom: 0.5rem; transition: all 0.2s ease;
    }
    .q-text { font-size: 0.9rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.75rem; line-height: 1.4; }
    .q-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .q-option {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
      border: 1.5px solid var(--surface-border); border-radius: 8px; cursor: pointer;
      transition: all 0.15s ease; position: relative;
    }
    .q-option input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
    .q-option.selected { border-color: var(--primary-color); background: var(--primary-50, #f5f3ff); }
    .q-option:hover:not(.selected) { border-color: var(--primary-300); background: var(--surface-hover); }
    .opt-dot {
      width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--surface-border);
      flex-shrink: 0; transition: all 0.15s ease;
    }
    .q-option.selected .opt-dot { border-color: var(--primary-color); background: var(--primary-color); }
    .opt-label { font-size: 0.78rem; color: var(--text-color); flex: 1; font-weight: 500; }
    .opt-score { font-size: 0.7rem; color: var(--text-color-secondary); font-weight: 600; }

    /* Functional question */
    .functional-q { padding: 1.25rem 1.5rem; border-top: 1px solid var(--surface-border); background: var(--surface-ground); }
    .func-options { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
    .func-option {
      display: flex; align-items: center; gap: 0.375rem; padding: 0.4rem 0.875rem;
      border: 1.5px solid var(--surface-border); border-radius: 20px; cursor: pointer; font-size: 0.8rem;
      transition: all 0.15s ease; background: var(--surface-card);
    }
    .func-option input { display: none; }
    .func-option.selected { border-color: var(--primary-color); background: var(--primary-50, #f5f3ff); color: var(--primary-color); font-weight: 700; }

    /* Progress */
    .q-progress { padding: 1rem 1.5rem; border-top: 1px solid var(--surface-border); }
    .q-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-color-secondary); margin-bottom: 0.5rem; }
    .q-progress-track { height: 6px; background: var(--surface-200, #e5e7eb); border-radius: 3px; overflow: hidden; }
    .q-progress-fill { height: 100%; background: var(--primary-color); border-radius: 3px; transition: width 0.3s ease; }

    /* Submit button */
    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      margin: 0 1.5rem 1.5rem; padding: 0.75rem; border: none; border-radius: 10px;
      background: var(--primary-color); color: white; font-family: inherit; font-size: 0.95rem;
      font-weight: 700; cursor: pointer; transition: all 0.2s ease;
    }
    .submit-btn:hover:not([disabled]) { filter: brightness(1.08); transform: translateY(-1px); }
    .submit-btn[disabled] { opacity: 0.45; cursor: not-allowed; transform: none; }

    /* Results */
    .result-card { text-align: center; }
    .result-header { margin-bottom: 1.5rem; }
    .result-icon { font-size: 3rem; color: var(--green-500); display: block; margin-bottom: 0.75rem; }
    .result-header h2 { margin: 0 0 0.375rem; font-size: 1.4rem; font-weight: 700; color: var(--text-color); }
    .result-header p { margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); }
    .result-score-wrap { display: flex; flex-direction: column; align-items: center; margin: 1.5rem 0; }
    .result-score-circle {
      width: 120px; height: 120px; border-radius: 50%; border: 6px solid; display: flex;
      flex-direction: column; align-items: center; justify-content: center; margin-bottom: 0.75rem;
    }
    .result-score-num { font-size: 2.5rem; font-weight: 900; line-height: 1; }
    .result-score-max { font-size: 0.8rem; color: var(--text-color-secondary); }
    .result-severity { font-size: 1.1rem; font-weight: 700; }
    .result-breakdown { text-align: left; margin: 1.25rem 0; }
    .result-breakdown h3 { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 700; color: var(--text-color); }
    .interp-table { display: flex; flex-direction: column; gap: 0.375rem; }
    .interp-row { display: flex; align-items: center; gap: 1rem; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.82rem; }
    .interp-row.current-range { background: var(--surface-ground); font-weight: 700; }
    .interp-range { min-width: 48px; font-weight: 700; color: var(--text-color); }
    .interp-label { font-weight: 600; }
    .crisis-notice {
      display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.875rem 1rem;
      background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;
      font-size: 0.78rem; color: #9a3412; text-align: left; margin: 1.25rem 0;
    }
    .crisis-notice i { color: #f97316; flex-shrink: 0; margin-top: 2px; }
    .retry-btn {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.5rem;
      border: 2px solid var(--primary-color); border-radius: 8px; background: transparent;
      color: var(--primary-color); font-family: inherit; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s ease;
    }
    .retry-btn:hover { background: var(--primary-color); color: white; }

    /* History panel */
    .history-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 700; color: var(--text-color); }
    .history-section { margin-bottom: 0.5rem; }
    .history-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); margin-bottom: 0.5rem; }
    .history-spark { width: 100%; height: auto; display: block; margin-bottom: 0.75rem; overflow: visible; }
    .spark-val { font-size: 9px; fill: var(--text-color-secondary); font-family: inherit; }
    .history-entries { display: flex; flex-direction: column; gap: 0.375rem; }
    .history-entry { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0.625rem; background: var(--surface-ground); border-radius: 6px; }
    .he-date { font-size: 0.75rem; color: var(--text-color-secondary); flex: 1; }
    .he-score { font-size: 0.82rem; font-weight: 700; }
    .he-sev { font-size: 0.72rem; font-weight: 600; }
    .history-divider { height: 1px; background: var(--surface-border); margin: 1rem 0; }

    /* Info card */
    .info-card p { margin: 0 0 0.625rem; font-size: 0.82rem; color: var(--text-color-secondary); line-height: 1.5; }
    .info-card-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.875rem; font-size: 0.95rem; font-weight: 700; color: var(--text-color); }
    .info-card-title i { color: var(--primary-color); }
    .frequency-rec { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.625rem 0.875rem; background: var(--surface-ground); border-radius: 8px; margin-top: 0.5rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .frequency-rec i { color: var(--primary-color); flex-shrink: 0; margin-top: 1px; }

    /* Responsive */
    @media (max-width: 1024px) {
      .pro-layout { grid-template-columns: 1fr; }
      .q-history-col { grid-row: 1; }
    }
    @media (max-width: 640px) {
      .q-options { grid-template-columns: 1fr; }
    }
  `]
})
export class ProQuestionnairesComponent {
  readonly svc = inject(HealthAnalyticsService);

  readonly activeQ = signal<'phq9' | 'gad7'>('phq9');
  readonly submitted = signal(false);
  readonly functionalAnswer = signal('');

  private readonly _phq9Answers = signal<number[]>(Array(9).fill(-1));
  private readonly _gad7Answers = signal<number[]>(Array(7).fill(-1));

  readonly frequencyOptions = FREQUENCY_OPTIONS;
  readonly functionalOptions = ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'];

  readonly currentQuestions = computed(() =>
    this.activeQ() === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS
  );

  readonly currentAnswers = computed(() =>
    this.activeQ() === 'phq9' ? this._phq9Answers() : this._gad7Answers()
  );

  readonly answeredCount = computed(() =>
    this.currentAnswers().filter(a => a !== -1).length
  );

  readonly currentScore = computed(() =>
    this.currentAnswers().filter(a => a !== -1).reduce((sum, v) => sum + v, 0)
  );

  readonly currentSeverity = computed(() =>
    this.activeQ() === 'phq9'
      ? phq9Severity(this.currentScore())
      : gad7Severity(this.currentScore())
  );

  // Expose severity functions to template
  readonly phq9Severity = phq9Severity;
  readonly gad7Severity = gad7Severity;

  // Spark paths for history charts
  readonly phqSparkPath = computed(() => {
    const scores = this.svc.phq9History().map(h => h.score);
    return historySparkPath(scores, 27, 200, 50);
  });

  readonly gadSparkPath = computed(() => {
    const scores = this.svc.gad7History().map(h => h.score);
    return historySparkPath(scores, 21, 200, 50);
  });

  readonly phqSvgPoints = computed(() => {
    const hist = this.svc.phq9History();
    return hist.map((h, i) => {
      const x = hist.length === 1 ? 100 : (i / (hist.length - 1)) * 200;
      const y = 50 - (h.score / 27) * 50;
      return { x, y };
    });
  });

  readonly gadSvgPoints = computed(() => {
    const hist = this.svc.gad7History();
    return hist.map((h, i) => {
      const x = hist.length === 1 ? 100 : (i / (hist.length - 1)) * 200;
      const y = 50 - (h.score / 21) * 50;
      return { x, y };
    });
  });

  switchQ(q: 'phq9' | 'gad7'): void {
    this.activeQ.set(q);
    this.submitted.set(false);
  }

  setAnswer(index: number, value: number): void {
    const current = [...this.currentAnswers()];
    current[index] = value;
    if (this.activeQ() === 'phq9') {
      this._phq9Answers.set(current);
    } else {
      this._gad7Answers.set(current);
    }
  }

  submitQuestionnaire(): void {
    if (this.answeredCount() < this.currentQuestions().length) return;
    this.submitted.set(true);
  }

  resetQuestionnaire(): void {
    if (this.activeQ() === 'phq9') {
      this._phq9Answers.set(Array(9).fill(-1));
    } else {
      this._gad7Answers.set(Array(7).fill(-1));
    }
    this.functionalAnswer.set('');
    this.submitted.set(false);
  }

  fmtDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
