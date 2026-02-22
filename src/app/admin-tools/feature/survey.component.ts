import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { RatingModule } from 'primeng/rating';

interface SurveyQuestion {
  id: string;
  text: string;
  category: string;
  icon: string;
}

interface AppointmentInfo {
  provider: string;
  specialty: string;
  date: Date;
  type: string;
  location: string;
}

@Component({
  selector: 'app-survey',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    TextareaModule,
    RatingModule
],
  template: `
    <div class="survey-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-star"></i>
          </div>
          <div>
            <h1 class="page-title">Patient Experience Survey</h1>
            <p class="page-subtitle">Help us improve care quality by sharing your experience</p>
          </div>
        </div>
        <div class="cahps-badge">
          <i class="pi pi-shield"></i>
          CAHPS Survey
        </div>
      </div>

      <!-- Appointment Context Card -->
      <div class="appt-context-card">
        <div class="appt-context-icon">
          <i class="pi pi-calendar-check"></i>
        </div>
        <div class="appt-context-details">
          <span class="appt-context-label">Survey for appointment</span>
          <strong class="appt-context-provider">{{ appointment.provider }}</strong>
          <div class="appt-context-meta">
            <span><i class="pi pi-tag"></i> {{ appointment.specialty }}</span>
            <span><i class="pi pi-calendar"></i> {{ formatDate(appointment.date) }}</span>
            <span><i class="pi pi-map-marker"></i> {{ appointment.location }}</span>
          </div>
        </div>
        <p-tag value="Pending" severity="warn"></p-tag>
      </div>

      <!-- Submitted Thank-You -->
      @if (submitted()) {
        <div class="thank-you-card">
          <div class="thank-you-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div class="thank-you-body">
            <h2 class="thank-you-title">Thank You for Your Feedback!</h2>
            <p class="thank-you-sub">Your responses help us deliver better care. Average rating: <strong>{{ averageRating().toFixed(1) }} / 5</strong></p>
            <p class="thank-you-sub">A summary has been shared with your care team. Your identity remains confidential.</p>
          </div>
          <div class="thank-you-rating-display">
            <div class="stars-display">
              @for (star of [1,2,3,4,5]; track star) {
                <i class="pi" [class.pi-star-fill]="star <= Math.round(averageRating())" [class.pi-star]="star > Math.round(averageRating())"></i>
              }
            </div>
            <span class="avg-rating-label">Overall Rating</span>
          </div>
        </div>
      }

      <!-- Survey Form -->
      @if (!submitted()) {
        <div class="survey-form">

          <!-- Progress Indicator -->
          <div class="progress-bar-row">
            <div class="progress-label">
              {{ answeredCount() }} of {{ questions.length }} questions answered
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="(answeredCount() / questions.length) * 100"
              ></div>
            </div>
            <div class="progress-pct">{{ Math.round((answeredCount() / questions.length) * 100) }}%</div>
          </div>

          <!-- Questions -->
          <div class="questions-list">
            @for (q of questions; track q.id; let i = $index) {
              <div class="question-card" [class.answered]="answers()[q.id] > 0">
                <div class="question-header">
                  <div class="question-num">
                    @if (answers()[q.id] > 0) {
                      <i class="pi pi-check"></i>
                    } @else {
                      <span>{{ i + 1 }}</span>
                    }
                  </div>
                  <div class="question-body">
                    <div class="question-category">
                      <i [class]="q.icon"></i>
                      {{ q.category }}
                    </div>
                    <p class="question-text">{{ q.text }}</p>
                  </div>
                </div>

                <!-- Star Rating -->
                <div class="rating-section">
                  <div class="rating-labels">
                    <span class="rating-label-min">Poor</span>
                    <span class="rating-label-max">Excellent</span>
                  </div>
                  <div class="stars-row">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button
                        class="star-btn"
                        [class.filled]="answers()[q.id] >= star"
                        (click)="setAnswer(q.id, star)"
                        [attr.aria-label]="'Rate ' + star + ' out of 5'"
                      >
                        <i class="pi" [class.pi-star-fill]="answers()[q.id] >= star" [class.pi-star]="answers()[q.id] < star"></i>
                      </button>
                    }
                    @if (answers()[q.id] > 0) {
                      <span class="rating-value-badge">{{ getRatingLabel(answers()[q.id]) }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Comments -->
          <div class="comments-card">
            <div class="comments-header">
              <i class="pi pi-comment"></i>
              <div>
                <h3 class="comments-title">Additional Comments</h3>
                <p class="comments-subtitle">Share anything else about your experience (optional)</p>
              </div>
            </div>
            <textarea
              pTextarea
              [(ngModel)]="comments"
              rows="4"
              placeholder="Tell us more about your visit — what went well, what could be improved..."
              class="comments-textarea"
            ></textarea>
            <div class="char-count">{{ comments.length }} characters</div>
          </div>

          <!-- Submit -->
          <div class="submit-section">
            <div class="submit-note">
              <i class="pi pi-lock"></i>
              Your responses are confidential and used only to improve care quality.
            </div>
            <button
              pButton
              label="Submit Survey"
              icon="pi pi-send"
              [disabled]="answeredCount() < questions.length"
              (click)="submitSurvey()"
            ></button>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .survey-page {
      max-width: 800px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title {
      margin: 0 0 0.2rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .page-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .cahps-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--blue-50, #eff6ff);
      color: var(--blue-700);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    /* ===== Appointment Context Card ===== */
    .appt-context-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      flex-wrap: wrap;
    }

    .appt-context-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .appt-context-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .appt-context-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
    }

    .appt-context-provider {
      font-size: 0.95rem;
      color: var(--text-color);
    }

    .appt-context-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      margin-top: 0.2rem;
    }

    .appt-context-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .appt-context-meta i {
      font-size: 0.7rem;
    }

    /* ===== Thank You Card ===== */
    .thank-you-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, var(--green-50, #f0fdf4), var(--teal-50, #f0fdfa));
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: var(--border-radius);
      flex-wrap: wrap;
    }

    .thank-you-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--green-100, #dcfce7);
      color: var(--green-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
    }

    .thank-you-body {
      flex: 1;
    }

    .thank-you-title {
      margin: 0 0 0.5rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--green-800, #166534);
    }

    .thank-you-sub {
      margin: 0 0 0.25rem;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .thank-you-rating-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }

    .stars-display {
      display: flex;
      gap: 0.3rem;
    }

    .stars-display i {
      font-size: 1.5rem;
      color: #f59e0b;
    }

    .avg-rating-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
    }

    /* ===== Progress Bar ===== */
    .progress-bar-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .progress-label {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    .progress-track {
      flex: 1;
      height: 8px;
      background: var(--surface-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
      border-radius: 8px;
      transition: width 0.3s ease;
    }

    .progress-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary-color);
      white-space: nowrap;
    }

    /* ===== Questions ===== */
    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .question-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      transition: border-color 0.2s ease;
    }

    .question-card.answered {
      border-color: var(--primary-200, #a5b4fc);
    }

    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .question-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-ground);
      border: 2px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .question-card.answered .question-num {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .question-body {
      flex: 1;
    }

    .question-category {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin-bottom: 0.375rem;
    }

    .question-category i {
      font-size: 0.65rem;
    }

    .question-text {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-color);
      line-height: 1.4;
    }

    /* ===== Star Rating ===== */
    .rating-section {
      padding-left: 3rem;
    }

    .rating-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .rating-label-min,
    .rating-label-max {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .stars-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .star-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: transform 0.1s ease;
      line-height: 1;
    }

    .star-btn:hover {
      transform: scale(1.2);
    }

    .star-btn i {
      font-size: 1.75rem;
      color: var(--surface-300, #d1d5db);
      transition: color 0.15s ease;
    }

    .star-btn.filled i {
      color: #f59e0b;
    }

    .star-btn:hover i {
      color: #f59e0b;
    }

    .rating-value-badge {
      margin-left: 0.5rem;
      padding: 0.2rem 0.6rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    /* ===== Comments ===== */
    .comments-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .comments-header {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 0.875rem;
    }

    .comments-header > i {
      font-size: 1.1rem;
      color: var(--primary-color);
      margin-top: 2px;
    }

    .comments-title {
      margin: 0 0 0.2rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .comments-subtitle {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .comments-textarea {
      width: 100%;
      resize: vertical;
      font-family: inherit;
      font-size: 0.875rem;
      box-sizing: border-box;
    }

    .char-count {
      text-align: right;
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.375rem;
    }

    /* ===== Submit ===== */
    .submit-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      flex-wrap: wrap;
    }

    .submit-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .submit-note i {
      color: var(--green-500);
    }

    /* ===== Responsive ===== */
    @media (max-width: 640px) {
      .rating-section {
        padding-left: 0;
      }

      .star-btn i {
        font-size: 1.5rem;
      }

      .submit-section {
        flex-direction: column;
        align-items: stretch;
      }

      .submit-section button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class SurveyComponent {
  protected readonly Math = Math;

  appointment: AppointmentInfo = {
    provider: 'Dr. Sarah Johnson',
    specialty: 'Internal Medicine',
    date: new Date(Date.now() - 3 * 86400000),
    type: 'Follow-up Visit',
    location: 'GoHealth Main Clinic, Room 4B'
  };

  questions: SurveyQuestion[] = [
    { id: 'q1', text: 'How would you rate your overall experience?', category: 'Overall Experience', icon: 'pi pi-star' },
    { id: 'q2', text: 'How well did your provider listen to you?', category: 'Communication', icon: 'pi pi-comments' },
    { id: 'q3', text: 'How clearly did your provider explain things?', category: 'Communication', icon: 'pi pi-megaphone' },
    { id: 'q4', text: 'How long did you wait to be seen?', category: 'Wait Time', icon: 'pi pi-clock' },
    { id: 'q5', text: 'Would you recommend this provider to a friend or family member?', category: 'Recommendation', icon: 'pi pi-thumbs-up' }
  ];

  private _answers = signal<Record<string, number>>({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 });
  answers = this._answers.asReadonly();

  comments: string = '';
  submitted = signal(false);

  answeredCount = computed(() =>
    Object.values(this._answers()).filter(v => v > 0).length
  );

  averageRating = computed(() => {
    const vals = Object.values(this._answers()).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  setAnswer(questionId: string, rating: number): void {
    this._answers.update(prev => ({ ...prev, [questionId]: rating }));
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] ?? '';
  }

  submitSurvey(): void {
    if (this.answeredCount() < this.questions.length) return;
    this.submitted.set(true);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
