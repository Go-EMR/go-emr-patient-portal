import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SymptomCheckerService, TriageLevel } from '../data-access';

@Component({
  selector: 'app-symptom-checker',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
    <div class="checker-page">
      <div class="checker-layout">
        <!-- Chat column -->
        <div class="chat-column">
          <div class="chat-header-bar">
            <div class="assistant-info">
              <div class="assistant-avatar">
                <i class="pi pi-heart-fill"></i>
              </div>
              <div>
                <strong>Health Assistant</strong>
                <span class="status-dot">AI-Powered Symptom Checker</span>
              </div>
            </div>
            <button pButton icon="pi pi-refresh" class="p-button-text p-button-rounded"
                    pTooltip="Start over" (click)="checker.reset()"></button>
          </div>

          <div class="chat-messages">
            @for (bubble of checker.chatHistory(); track bubble.id) {
              @if (bubble.type === 'bot') {
                <div class="msg bot-msg">
                  <div class="bot-avatar"><i class="pi pi-heart-fill"></i></div>
                  <div class="msg-content">
                    <div class="msg-bubble bot">{{ bubble.text }}</div>
                    <span class="msg-time">{{ bubble.timestamp | date:'h:mm a' }}</span>
                  </div>
                </div>
              }
              @if (bubble.type === 'user') {
                <div class="msg user-msg">
                  <div class="msg-content">
                    <div class="msg-bubble user">{{ bubble.text }}</div>
                    <span class="msg-time">{{ bubble.timestamp | date:'h:mm a' }}</span>
                  </div>
                </div>
              }
              @if (bubble.type === 'result' && bubble.result) {
                <div class="msg bot-msg">
                  <div class="bot-avatar"><i class="pi pi-heart-fill"></i></div>
                  <div class="result-card" [class]="'triage-' + bubble.result.level">
                    <div class="result-header">
                      <div class="result-icon">
                        @switch (bubble.result.level) {
                          @case ('emergency') { <i class="pi pi-exclamation-triangle"></i> }
                          @case ('urgent-care') { <i class="pi pi-clock"></i> }
                          @case ('schedule') { <i class="pi pi-calendar"></i> }
                          @case ('self-care') { <i class="pi pi-check-circle"></i> }
                        }
                      </div>
                      <div>
                        <div class="result-level">{{ getLevelLabel(bubble.result.level) }}</div>
                        <h3>{{ bubble.result.title }}</h3>
                      </div>
                    </div>
                    <p class="result-desc">{{ bubble.result.description }}</p>
                    <div class="result-section">
                      <h4>Recommendations</h4>
                      <ul>
                        @for (rec of bubble.result.recommendations; track rec) {
                          <li>{{ rec }}</li>
                        }
                      </ul>
                    </div>
                    <div class="result-section">
                      <h4>Possible Conditions</h4>
                      <div class="condition-tags">
                        @for (cond of bubble.result.possibleConditions; track cond) {
                          <span class="condition-tag">{{ cond }}</span>
                        }
                      </div>
                    </div>
                    <div class="result-disclaimer">
                      <i class="pi pi-info-circle"></i>
                      {{ bubble.result.disclaimer }}
                    </div>
                    <div class="result-actions">
                      @if (bubble.result.level === 'schedule' || bubble.result.level === 'urgent-care') {
                        <button pButton label="Book Appointment" icon="pi pi-calendar" (click)="navigate('/appointments')"></button>
                      }
                      <button pButton label="Message Provider" icon="pi pi-envelope" class="p-button-outlined" (click)="navigate('/messages')"></button>
                    </div>
                  </div>
                </div>
              }
            }

            @if (checker.isTyping()) {
              <div class="msg bot-msg">
                <div class="bot-avatar"><i class="pi pi-heart-fill"></i></div>
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            }
          </div>

          <!-- Input area changes based on step -->
          <div class="input-area">
            @switch (checker.step()) {
              @case ('select-area') {
                <div class="body-area-grid">
                  @for (area of checker.bodyAreas; track area.id) {
                    <button class="area-btn" (click)="checker.selectArea(area)">
                      <i [class]="'pi ' + area.icon"></i>
                      <span>{{ area.label }}</span>
                    </button>
                  }
                </div>
              }
              @case ('symptoms') {
                <div class="symptom-select">
                  <div class="symptom-chips">
                    @for (symptom of checker.availableSymptoms(); track symptom) {
                      <button class="symptom-chip" [class.selected]="checker.selectedSymptoms().includes(symptom)"
                              (click)="checker.toggleSymptom(symptom)">
                        @if (checker.selectedSymptoms().includes(symptom)) {
                          <i class="pi pi-check"></i>
                        }
                        {{ symptom }}
                      </button>
                    }
                  </div>
                  <button pButton label="Continue" icon="pi pi-arrow-right" iconPos="right"
                          [disabled]="checker.selectedSymptoms().length === 0"
                          (click)="checker.confirmSymptoms()" class="continue-btn"></button>
                </div>
              }
              @case ('severity') {
                <div class="severity-select">
                  <div class="severity-slider">
                    <div class="severity-track">
                      @for (n of severityValues; track n) {
                        <button class="severity-dot" [class.active]="checker.severity() === n"
                                [class.low]="n <= 3" [class.mid]="n >= 4 && n <= 6" [class.high]="n >= 7"
                                (click)="checker.setSeverity(n)">
                          {{ n }}
                        </button>
                      }
                    </div>
                    <div class="severity-labels">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                  <button pButton label="Continue" icon="pi pi-arrow-right" iconPos="right"
                          (click)="checker.confirmSeverity()" class="continue-btn"></button>
                </div>
              }
              @case ('details') {
                <div class="duration-select">
                  <div class="duration-options">
                    @for (opt of durationOptions; track opt) {
                      <button class="duration-btn" (click)="checker.selectDuration(opt)">{{ opt }}</button>
                    }
                  </div>
                </div>
              }
              @case ('result') {
                <div class="result-input">
                  <button pButton label="Start New Assessment" icon="pi pi-refresh" class="p-button-outlined"
                          (click)="checker.reset()"></button>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checker-page { max-width: 800px; margin: 0 auto; height: calc(100vh - 100px); display: flex; flex-direction: column; }

    .checker-layout { flex: 1; display: flex; overflow: hidden; background: var(--surface-card); border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

    .chat-column { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .chat-header-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border);
    }

    .assistant-info { display: flex; align-items: center; gap: 0.75rem; }
    .assistant-info div:last-child { display: flex; flex-direction: column; }
    .assistant-info strong { font-size: 0.95rem; }

    .assistant-avatar {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }

    .status-dot { font-size: 0.75rem; color: var(--text-color-secondary); }

    .chat-messages { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }

    .msg { display: flex; gap: 0.5rem; max-width: 90%; }
    .bot-msg { align-self: flex-start; }
    .user-msg { align-self: flex-end; flex-direction: row-reverse; }

    .bot-avatar {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
      color: var(--primary-600); display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem;
    }

    .msg-content { display: flex; flex-direction: column; }
    .user-msg .msg-content { align-items: flex-end; }

    .msg-bubble {
      padding: 0.75rem 1rem; border-radius: 14px;
      font-size: 0.9rem; line-height: 1.5;
    }

    .msg-bubble.bot {
      background: var(--surface-100); color: var(--text-color);
      border-bottom-left-radius: 4px;
    }

    .msg-bubble.user {
      background: var(--primary-color); color: white;
      border-bottom-right-radius: 4px;
    }

    .msg-time { font-size: 0.65rem; color: var(--text-color-secondary); margin-top: 0.25rem; padding: 0 0.25rem; }

    /* Typing indicator */
    .typing-indicator {
      display: flex; gap: 4px; padding: 0.75rem 1rem;
      background: var(--surface-100); border-radius: 14px; border-bottom-left-radius: 4px;
    }
    .typing-indicator span {
      width: 8px; height: 8px; border-radius: 50%; background: var(--text-color-secondary);
      animation: typing-bounce 1.4s ease-in-out infinite;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* Result card */
    .result-card {
      border-radius: 14px; padding: 1.25rem; max-width: 420px;
      border: 1px solid var(--surface-border);
    }

    .triage-self-care { background: var(--green-50); border-color: var(--green-200); }
    .triage-schedule { background: var(--blue-50); border-color: var(--blue-200); }
    .triage-urgent-care { background: var(--orange-50); border-color: var(--orange-200); }
    .triage-emergency { background: var(--red-50); border-color: var(--red-200); }

    .result-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }

    .result-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }

    .triage-self-care .result-icon { background: var(--green-100); color: var(--green-700); }
    .triage-schedule .result-icon { background: var(--blue-100); color: var(--blue-700); }
    .triage-urgent-care .result-icon { background: var(--orange-100); color: var(--orange-700); }
    .triage-emergency .result-icon { background: var(--red-100); color: var(--red-700); }

    .result-level { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .triage-self-care .result-level { color: var(--green-600); }
    .triage-schedule .result-level { color: var(--blue-600); }
    .triage-urgent-care .result-level { color: var(--orange-600); }
    .triage-emergency .result-level { color: var(--red-600); }

    .result-header h3 { margin: 0.125rem 0 0; font-size: 1.05rem; }

    .result-desc { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0 0 1rem; line-height: 1.4; }

    .result-section { margin-bottom: 1rem; }
    .result-section h4 { margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--text-color); }
    .result-section ul { margin: 0; padding-left: 1.25rem; }
    .result-section li { font-size: 0.8rem; color: var(--text-color-secondary); margin-bottom: 0.25rem; }

    .condition-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .condition-tag {
      font-size: 0.75rem; padding: 0.25rem 0.625rem; border-radius: 20px;
      background: rgba(0,0,0,0.06); color: var(--text-color-secondary);
    }

    .result-disclaimer {
      font-size: 0.75rem; color: var(--text-color-secondary); display: flex;
      align-items: flex-start; gap: 0.5rem; padding: 0.75rem;
      background: rgba(0,0,0,0.04); border-radius: 8px; margin-bottom: 1rem; line-height: 1.4;
    }
    .result-disclaimer i { margin-top: 2px; flex-shrink: 0; }

    .result-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    /* Input area */
    .input-area {
      border-top: 1px solid var(--surface-border); padding: 1rem 1.25rem;
      background: var(--surface-card);
    }

    .body-area-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;
    }

    .area-btn {
      display: flex; flex-direction: column; align-items: center; gap: 0.375rem;
      padding: 1rem 0.5rem; border: 1px solid var(--surface-border);
      border-radius: 12px; background: var(--surface-card); cursor: pointer;
      transition: all 0.2s ease; font-family: inherit; color: var(--text-color);
    }

    .area-btn:hover {
      background: var(--primary-50); border-color: var(--primary-200); transform: translateY(-2px);
    }

    .area-btn i { font-size: 1.25rem; color: var(--primary-color); }
    .area-btn span { font-size: 0.8rem; font-weight: 500; }

    .symptom-select { display: flex; flex-direction: column; gap: 0.75rem; }

    .symptom-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }

    .symptom-chip {
      display: flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 0.875rem; border-radius: 20px;
      border: 1px solid var(--surface-border); background: var(--surface-card);
      cursor: pointer; font-size: 0.8rem; font-family: inherit;
      color: var(--text-color); transition: all 0.15s ease;
    }

    .symptom-chip.selected {
      background: var(--primary-color); color: white;
      border-color: var(--primary-color);
    }

    .symptom-chip:hover:not(.selected) { background: var(--surface-hover); }
    .symptom-chip i { font-size: 0.7rem; }

    .continue-btn { width: 100%; justify-content: center; }

    .severity-select { display: flex; flex-direction: column; gap: 1rem; }

    .severity-slider { padding: 0 0.5rem; }

    .severity-track { display: flex; justify-content: space-between; gap: 0.25rem; margin-bottom: 0.5rem; }

    .severity-dot {
      width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--surface-border);
      background: var(--surface-card); cursor: pointer; font-size: 0.8rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease; font-family: inherit; color: var(--text-color);
    }

    .severity-dot:hover { transform: scale(1.1); }

    .severity-dot.active.low { background: var(--green-500); color: white; border-color: var(--green-500); }
    .severity-dot.active.mid { background: var(--orange-500); color: white; border-color: var(--orange-500); }
    .severity-dot.active.high { background: var(--red-500); color: white; border-color: var(--red-500); }

    .severity-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-color-secondary); }

    .duration-select { }

    .duration-options { display: flex; flex-direction: column; gap: 0.375rem; }

    .duration-btn {
      padding: 0.75rem 1rem; border: 1px solid var(--surface-border);
      border-radius: 10px; background: var(--surface-card); cursor: pointer;
      font-size: 0.875rem; text-align: left; font-family: inherit;
      color: var(--text-color); transition: all 0.15s ease;
    }

    .duration-btn:hover {
      background: var(--primary-50); border-color: var(--primary-200);
    }

    .result-input { text-align: center; }

    @media (max-width: 768px) {
      .body-area-grid { grid-template-columns: repeat(2, 1fr); }
      .severity-dot { width: 30px; height: 30px; font-size: 0.7rem; }
    }
  `]
})
export class SymptomCheckerComponent implements OnInit {
  readonly checker = inject(SymptomCheckerService);
  private readonly router = inject(Router);

  severityValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  durationOptions = ['Just started today', 'A few days', 'About a week', '1-2 weeks', 'More than 2 weeks', 'More than a month'];

  ngOnInit(): void {
    this.checker.reset();
  }

  getLevelLabel(level: TriageLevel): string {
    const labels: Record<TriageLevel, string> = {
      'self-care': 'LOW RISK',
      'schedule': 'MODERATE',
      'urgent-care': 'HIGH',
      'emergency': 'CRITICAL'
    };
    return labels[level];
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
