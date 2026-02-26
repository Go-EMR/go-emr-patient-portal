import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CarePlansService } from '../data-access/care-plans.service';
import { CarePlan, CarePlanActivity, CarePlanGoal } from '../../shared/data-access/models';

@Component({
  selector: 'app-care-plans',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TabsModule,
    AccordionModule,
    DividerModule,
    ProgressBarModule,
    CheckboxModule,
    SkeletonModule,
    TooltipModule,
  ],
  template: `
    <div class="cp-page" role="main" aria-label="Care Plans">
      <!-- Header -->
      <header class="cp-header">
        <div class="cp-header-text">
          <h1 class="cp-title">
            <i class="pi pi-clipboard cp-title-icon" aria-hidden="true"></i>
            Care Plans
          </h1>
          <p class="cp-subtitle">Personalized care plans created by your healthcare team</p>
        </div>
        <div class="cp-header-stats">
          <div class="cp-stat">
            <span class="cp-stat-value">{{ service.activePlans().length }}</span>
            <span class="cp-stat-label">Active Plans</span>
          </div>
          <div class="cp-stat cp-stat--completed">
            <span class="cp-stat-value">{{ service.completedPlans().length }}</span>
            <span class="cp-stat-label">Completed</span>
          </div>
        </div>
      </header>

      <!-- Loading -->
      @if (service.loading()) {
        <div class="cp-skeleton-grid" aria-busy="true" aria-label="Loading care plans">
          @for (i of [1,2]; track i) {
            <div class="cp-skeleton-card">
              <p-skeleton height="1.5rem" width="50%" styleClass="mb-2" />
              <p-skeleton height="0.875rem" width="30%" styleClass="mb-3" />
              <p-skeleton height="0.625rem" width="100%" styleClass="mb-1" />
              <p-skeleton height="0.625rem" width="80%" />
            </div>
          }
        </div>
      }

      @if (!service.loading()) {
        <p-tabs [value]="activeTab">
          <p-tablist>
            <p-tab [value]="0">
              <span class="cp-tab-label">
                Active Plans
                @if (service.activePlans().length > 0) {
                  <span class="cp-tab-badge">{{ service.activePlans().length }}</span>
                }
              </span>
            </p-tab>
            <p-tab [value]="1">
              <span class="cp-tab-label">
                Completed / On Hold
                @if (service.completedPlans().length > 0) {
                  <span class="cp-tab-badge cp-tab-badge--muted">{{ service.completedPlans().length }}</span>
                }
              </span>
            </p-tab>
          </p-tablist>
          <p-tabpanels>
            <!-- Active Plans -->
            <p-tabpanel [value]="0">
              @if (service.activePlans().length === 0) {
                <div class="cp-empty" role="status">
                  <i class="pi pi-clipboard cp-empty-icon" aria-hidden="true"></i>
                  <h3>No Active Care Plans</h3>
                  <p>Your care team will create a plan if needed at your next visit.</p>
                </div>
              } @else {
                <div class="cp-plans-list" role="list">
                  @for (plan of service.activePlans(); track plan.id) {
                    <ng-container *ngTemplateOutlet="planCard; context: { $implicit: plan }" />
                  }
                </div>
              }
            </p-tabpanel>

            <!-- Completed Plans -->
            <p-tabpanel [value]="1">
              @if (service.completedPlans().length === 0) {
                <div class="cp-empty" role="status">
                  <i class="pi pi-check-circle cp-empty-icon" aria-hidden="true"></i>
                  <h3>No Completed Plans Yet</h3>
                  <p>Completed care plans will appear here.</p>
                </div>
              } @else {
                <div class="cp-plans-list" role="list">
                  @for (plan of service.completedPlans(); track plan.id) {
                    <ng-container *ngTemplateOutlet="planCard; context: { $implicit: plan }" />
                  }
                </div>
              }
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      }

      <!-- Plan Card Template -->
      <ng-template #planCard let-plan>
        <article
          class="cp-plan-card"
          [class.cp-plan-card--urgent]="plan.priority === 'urgent'"
          [class.cp-plan-card--completed]="plan.status === 'completed'"
          role="listitem"
          [attr.aria-label]="plan.title + ' care plan'"
        >
          <!-- Plan Header -->
          <div class="cp-plan-header">
            <div class="cp-plan-header-left">
              <div class="cp-plan-icon" [class]="'cp-plan-icon--' + getCategoryColor(plan.category)" aria-hidden="true">
                <i [class]="'pi ' + getCategoryIcon(plan.category)"></i>
              </div>
              <div>
                <div class="cp-plan-title-row">
                  <h2 class="cp-plan-title">{{ plan.title }}</h2>
                  @if (plan.priority === 'urgent') {
                    <p-tag value="Urgent" severity="danger" [rounded]="true" />
                  }
                </div>
                <p class="cp-plan-provider">
                  <i class="pi pi-user-md" aria-hidden="true"></i>
                  {{ plan.managingProvider }}
                </p>
                <p class="cp-plan-category">{{ plan.category }}</p>
              </div>
            </div>
            <div class="cp-plan-header-right">
              <p-tag
                [value]="getStatusLabel(plan.status)"
                [severity]="getStatusSeverity(plan.status)"
                [rounded]="true"
              />
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="cp-progress-section" [attr.aria-label]="'Overall progress: ' + plan.overallProgress + '%'">
            <div class="cp-progress-header">
              <span class="cp-progress-label">Overall Progress</span>
              <span class="cp-progress-pct" [class.cp-progress-pct--complete]="plan.overallProgress === 100">
                {{ plan.overallProgress }}%
              </span>
            </div>
            <p-progressBar
              [value]="plan.overallProgress"
              [showValue]="false"
              styleClass="cp-progress-bar"
              [style]="{ height: '8px' }"
              [attr.aria-valuenow]="plan.overallProgress"
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>

          <!-- Meta Dates -->
          <div class="cp-plan-dates">
            <div class="cp-date-item">
              <span class="cp-date-label">Started</span>
              <span class="cp-date-value">{{ plan.startDate | date:'MMM d, yyyy' }}</span>
            </div>
            @if (plan.nextReviewDate) {
              <div class="cp-date-item">
                <span class="cp-date-label">Next Review</span>
                <span class="cp-date-value">{{ plan.nextReviewDate | date:'MMM d, yyyy' }}</span>
              </div>
            }
            @if (plan.endDate) {
              <div class="cp-date-item">
                <span class="cp-date-label">Completed</span>
                <span class="cp-date-value cp-date-value--success">{{ plan.endDate | date:'MMM d, yyyy' }}</span>
              </div>
            }
          </div>

          <!-- Accordion Details -->
          <p-accordion [multiple]="true">

            <!-- Overview -->
            <p-accordion-panel value="overview">
              <p-accordion-header>
                <span class="cp-acc-header">
                  <i class="pi pi-info-circle" aria-hidden="true"></i> Overview & Care Team
                </span>
              </p-accordion-header>
              <p-accordion-content>
                <p class="cp-overview-text">{{ plan.description }}</p>
                <p-divider />
                <div class="cp-team-section">
                  <h4 class="cp-team-heading">Care Team Members</h4>
                  <div class="cp-team-list" role="list">
                    @for (member of plan.careTeamMembers; track member) {
                      <div class="cp-team-member" role="listitem">
                        <div class="cp-team-avatar" aria-hidden="true">
                          {{ getTeamMemberInitials(member) }}
                        </div>
                        <span class="cp-team-name">{{ member }}</span>
                      </div>
                    }
                  </div>
                </div>
              </p-accordion-content>
            </p-accordion-panel>

            <!-- Goals -->
            <p-accordion-panel value="goals">
              <p-accordion-header>
                <span class="cp-acc-header">
                  <i class="pi pi-flag" aria-hidden="true"></i> Goals
                  <span class="cp-acc-count">{{ plan.goals.length }}</span>
                </span>
              </p-accordion-header>
              <p-accordion-content>
                <div class="cp-goals-list" role="list">
                  @for (goal of plan.goals; track goal.id) {
                    <div
                      class="cp-goal-item"
                      [class]="'cp-goal-item--' + goal.status"
                      role="listitem"
                      [attr.aria-label]="goal.description + ', progress: ' + goal.progress + '%'"
                    >
                      <div class="cp-goal-header">
                        <div class="cp-goal-status-dot" [class]="'cp-goal-dot--' + goal.status" aria-hidden="true"></div>
                        <p class="cp-goal-desc">{{ goal.description }}</p>
                        <p-tag
                          [value]="getGoalStatusLabel(goal.status)"
                          [severity]="getGoalStatusSeverity(goal.status)"
                          [rounded]="true"
                        />
                      </div>
                      <div class="cp-goal-progress">
                        <p-progressBar
                          [value]="goal.progress"
                          [showValue]="false"
                          styleClass="cp-goal-progress-bar"
                          [style]="{ height: '6px' }"
                        />
                        <span class="cp-goal-pct">{{ goal.progress }}%</span>
                      </div>
                      @if (goal.targetDate) {
                        <p class="cp-goal-target">
                          <i class="pi pi-calendar" aria-hidden="true"></i>
                          Target: {{ goal.targetDate | date:'MMMM d, yyyy' }}
                        </p>
                      }
                      @if (goal.milestonesAchieved.length > 0) {
                        <div class="cp-milestones">
                          <p class="cp-milestones-label">Milestones achieved:</p>
                          <ul class="cp-milestones-list">
                            @for (m of goal.milestonesAchieved; track m) {
                              <li>
                                <i class="pi pi-check-circle" aria-hidden="true"></i>
                                {{ m }}
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  }
                </div>
              </p-accordion-content>
            </p-accordion-panel>

            <!-- Activities -->
            <p-accordion-panel value="activities">
              <p-accordion-header>
                <span class="cp-acc-header">
                  <i class="pi pi-list-check" aria-hidden="true"></i> Activities & Tasks
                  <span class="cp-acc-count">
                    {{ getCompletedCount(plan.activities) }}/{{ plan.activities.length }}
                  </span>
                </span>
              </p-accordion-header>
              <p-accordion-content>
                <div class="cp-activities-list" role="list">
                  @for (cat of activityCategories; track cat.key) {
                    @let catActivities = getActivitiesByCategory(plan.activities, cat.key);
                    @if (catActivities.length > 0) {
                      <div class="cp-activity-category" role="group" [attr.aria-label]="cat.label + ' activities'">
                        <div class="cp-category-header">
                          <i [class]="'pi ' + cat.icon" aria-hidden="true" [style.color]="cat.color"></i>
                          <span class="cp-category-label">{{ cat.label }}</span>
                        </div>
                        @for (activity of catActivities; track activity.id) {
                          <div
                            class="cp-activity-item"
                            [class.cp-activity-item--done]="activity.completed"
                            role="listitem"
                          >
                            <p-checkbox
                              [ngModel]="activity.completed"
                              (ngModelChange)="onActivityToggle(plan.id, activity.id)"
                              [binary]="true"
                              [inputId]="'act-' + activity.id"
                              [disabled]="plan.status === 'completed'"
                              styleClass="cp-checkbox"
                              [attr.aria-label]="activity.description + (activity.completed ? ' (completed)' : '')"
                            />
                            <div class="cp-activity-content">
                              <label [for]="'act-' + activity.id" class="cp-activity-desc">
                                {{ activity.description }}
                              </label>
                              <div class="cp-activity-meta">
                                <span class="cp-activity-freq">
                                  <i class="pi pi-refresh" aria-hidden="true"></i>
                                  {{ activity.frequency }}
                                </span>
                                @if (activity.notes) {
                                  <span class="cp-activity-note">{{ activity.notes }}</span>
                                }
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              </p-accordion-content>
            </p-accordion-panel>

            <!-- Provider Notes -->
            @if (plan.providerNotes) {
              <p-accordion-panel value="notes">
                <p-accordion-header>
                  <span class="cp-acc-header">
                    <i class="pi pi-comment" aria-hidden="true"></i> Provider Notes
                  </span>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="cp-provider-notes">
                    <div class="cp-notes-avatar" aria-hidden="true">
                      {{ getInitials(plan.managingProvider) }}
                    </div>
                    <div class="cp-notes-content">
                      <p class="cp-notes-author">{{ plan.managingProvider }}</p>
                      <p class="cp-notes-text">{{ plan.providerNotes }}</p>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

          </p-accordion>
        </article>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .cp-page {
      padding: 2rem;
      max-width: 960px;
      margin: 0 auto;
    }

    /* Header */
    .cp-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .cp-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .cp-title-icon { color: var(--primary-color); font-size: 1.5rem; }
    .cp-subtitle { color: var(--surface-500); margin: 0; font-size: 0.9375rem; }

    .cp-header-stats {
      display: flex;
      gap: 1.25rem;
    }
    .cp-stat {
      text-align: center;
      padding: 0.875rem 1.25rem;
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-0) 100%);
      border: 1px solid var(--primary-200);
      border-radius: 0.75rem;
      min-width: 80px;
    }
    .cp-stat--completed {
      background: linear-gradient(135deg, #f0fdf4 0%, var(--surface-0) 100%);
      border-color: #86efac;
    }
    .cp-stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    .cp-stat--completed .cp-stat-value { color: #16a34a; }
    .cp-stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Skeleton */
    .cp-skeleton-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .cp-skeleton-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.875rem;
      padding: 1.5rem;
    }

    /* Tabs */
    .cp-tab-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .cp-tab-badge {
      background: var(--primary-color);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 1rem;
    }
    .cp-tab-badge--muted {
      background: var(--surface-300);
      color: var(--surface-700);
    }

    /* Empty */
    .cp-empty {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--surface-400);
    }
    .cp-empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .cp-empty h3 { margin: 0 0 0.5rem; color: var(--surface-600); }
    .cp-empty p { margin: 0; }

    /* Plans List */
    .cp-plans-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-top: 1.25rem;
    }

    /* Plan Card */
    .cp-plan-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.875rem;
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }
    .cp-plan-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
    .cp-plan-card--urgent {
      border-left: 4px solid #ef4444;
    }
    .cp-plan-card--completed {
      opacity: 0.85;
      border-left: 4px solid #22c55e;
    }

    .cp-plan-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.375rem 1.5rem 0;
      flex-wrap: wrap;
    }
    .cp-plan-header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .cp-plan-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.25rem;
    }
    .cp-plan-icon--teal { background: #ccfbf1; color: #0d9488; }
    .cp-plan-icon--blue { background: #dbeafe; color: #2563eb; }
    .cp-plan-icon--purple { background: #ede9fe; color: #7c3aed; }
    .cp-plan-icon--orange { background: #ffedd5; color: #ea580c; }

    .cp-plan-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }
    .cp-plan-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0;
    }
    .cp-plan-provider {
      font-size: 0.875rem;
      color: var(--primary-color);
      font-weight: 600;
      margin: 0 0 0.15rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .cp-plan-category {
      font-size: 0.8rem;
      color: var(--surface-400);
      margin: 0;
    }

    /* Progress */
    .cp-progress-section {
      padding: 1rem 1.5rem 0.75rem;
    }
    .cp-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .cp-progress-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cp-progress-pct {
      font-size: 0.9375rem;
      font-weight: 800;
      color: var(--primary-color);
    }
    .cp-progress-pct--complete { color: #16a34a; }
    :host ::ng-deep .cp-progress-bar .p-progressbar-value {
      background: linear-gradient(90deg, var(--primary-color) 0%, var(--teal-400) 100%);
      border-radius: 1rem;
      transition: width 0.8s ease;
    }
    :host ::ng-deep .cp-progress-bar { border-radius: 1rem; overflow: hidden; }

    /* Dates */
    .cp-plan-dates {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1.5rem 1rem;
      border-bottom: 1px solid var(--surface-100);
      flex-wrap: wrap;
    }
    .cp-date-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .cp-date-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-400);
    }
    .cp-date-value { font-size: 0.875rem; font-weight: 600; color: var(--surface-600); }
    .cp-date-value--success { color: #16a34a; }

    /* Accordion */
    :host ::ng-deep .cp-plan-card .p-accordion-panel {
      border-bottom: 1px solid var(--surface-100);
    }
    :host ::ng-deep .cp-plan-card .p-accordion-panel:last-child {
      border-bottom: none;
    }
    :host ::ng-deep .cp-plan-card .p-accordion-header-link {
      padding: 0.875rem 1.5rem;
    }
    :host ::ng-deep .cp-plan-card .p-accordion-content {
      padding: 0 1.5rem 1.25rem;
    }
    .cp-acc-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--surface-700);
    }
    .cp-acc-header i { color: var(--primary-color); }
    .cp-acc-count {
      background: var(--surface-100);
      color: var(--surface-600);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 1rem;
    }

    /* Overview */
    .cp-overview-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--surface-700);
      margin: 0;
    }
    .cp-team-heading {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--surface-600);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.875rem;
    }
    .cp-team-list { display: flex; flex-direction: column; gap: 0.625rem; }
    .cp-team-member {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .cp-team-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-400) 0%, var(--teal-500) 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .cp-team-name { font-size: 0.875rem; color: var(--surface-700); }

    /* Goals */
    .cp-goals-list { display: flex; flex-direction: column; gap: 1rem; }
    .cp-goal-item {
      padding: 1rem;
      border-radius: 0.625rem;
      border: 1px solid var(--surface-200);
      background: var(--surface-50);
    }
    .cp-goal-item--completed { background: #f0fdf4; border-color: #bbf7d0; }
    .cp-goal-item--at-risk { background: #fff7ed; border-color: #fed7aa; }
    .cp-goal-item--on-track { background: var(--primary-50); border-color: var(--primary-100); }
    .cp-goal-item--not-started { background: var(--surface-50); }

    .cp-goal-header {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      margin-bottom: 0.625rem;
      flex-wrap: wrap;
    }
    .cp-goal-status-dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 0.3rem;
    }
    .cp-goal-dot--on-track { background: var(--primary-color); }
    .cp-goal-dot--at-risk { background: #f59e0b; }
    .cp-goal-dot--completed { background: #22c55e; }
    .cp-goal-dot--not-started { background: var(--surface-300); }

    .cp-goal-desc {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--surface-800);
      margin: 0;
      line-height: 1.4;
    }
    .cp-goal-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    :host ::ng-deep .cp-goal-progress-bar { flex: 1; border-radius: 1rem; overflow: hidden; }
    :host ::ng-deep .cp-goal-progress-bar .p-progressbar-value {
      border-radius: 1rem;
      transition: width 0.8s ease;
    }
    .cp-goal-pct { font-size: 0.8125rem; font-weight: 700; color: var(--surface-600); width: 2.5rem; text-align: right; }
    .cp-goal-target {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin: 0 0 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .cp-milestones-label {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-500);
      margin: 0.375rem 0 0.375rem;
    }
    .cp-milestones-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .cp-milestones-list li {
      font-size: 0.8125rem;
      color: var(--surface-600);
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
    }
    .cp-milestones-list li i { color: #22c55e; flex-shrink: 0; margin-top: 0.1rem; }

    /* Activities */
    .cp-activities-list { display: flex; flex-direction: column; gap: 1rem; }
    .cp-activity-category { }
    .cp-category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
      padding-bottom: 0.375rem;
      border-bottom: 1px solid var(--surface-100);
    }
    .cp-category-label {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-500);
    }
    .cp-activity-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-100);
      transition: background 0.15s, border-color 0.15s;
      cursor: pointer;
    }
    .cp-activity-item--done {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .cp-activity-item--done .cp-activity-desc {
      text-decoration: line-through;
      color: var(--surface-400);
    }
    .cp-activity-content { flex: 1; }
    .cp-activity-desc {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--surface-700);
      margin-bottom: 0.25rem;
      cursor: pointer;
      line-height: 1.4;
    }
    .cp-activity-meta {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .cp-activity-freq {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      color: var(--surface-500);
    }
    .cp-activity-freq i { font-size: 0.7rem; }
    .cp-activity-note {
      font-size: 0.8rem;
      color: var(--surface-400);
      font-style: italic;
    }

    /* Provider Notes */
    .cp-provider-notes {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
    }
    .cp-notes-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--primary-color) 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .cp-notes-content { flex: 1; }
    .cp-notes-author {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0 0 0.375rem;
    }
    .cp-notes-text {
      font-size: 0.9rem;
      line-height: 1.7;
      color: var(--surface-700);
      margin: 0;
    }

    @media (max-width: 640px) {
      .cp-page { padding: 1rem; }
      .cp-header { flex-direction: column; }
    }
  `]
})
export class CarePlansComponent {
  readonly service = inject(CarePlansService);
  readonly activeTab = 0;

  readonly activityCategories = [
    { key: 'medication', label: 'Medications', icon: 'pi-box', color: '#7c3aed' },
    { key: 'monitoring', label: 'Monitoring', icon: 'pi-chart-line', color: '#0891b2' },
    { key: 'exercise', label: 'Exercise', icon: 'pi-heart-fill', color: '#16a34a' },
    { key: 'diet', label: 'Diet & Nutrition', icon: 'pi-apple', color: '#ea580c' },
    { key: 'appointment', label: 'Appointments', icon: 'pi-calendar', color: '#2563eb' },
    { key: 'other', label: 'Other', icon: 'pi-check-circle', color: '#6b7280' }
  ];

  onActivityToggle(planId: string, activityId: string): void {
    this.service.toggleActivity(planId, activityId);
  }

  getActivitiesByCategory(activities: CarePlanActivity[], category: string): CarePlanActivity[] {
    return activities.filter(a => a.category === category);
  }

  getCompletedCount(activities: CarePlanActivity[]): number {
    return activities.filter(a => a.completed).length;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'active': 'Active',
      'completed': 'Completed',
      'on-hold': 'On Hold'
    };
    return map[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'warn' | 'secondary'> = {
      'active': 'secondary',
      'completed': 'success',
      'on-hold': 'warn'
    };
    return map[status];
  }

  getGoalStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'on-track': 'On Track',
      'at-risk': 'At Risk',
      'completed': 'Completed',
      'not-started': 'Not Started'
    };
    return map[status] ?? status;
  }

  getGoalStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      'on-track': 'secondary',
      'at-risk': 'warn',
      'completed': 'success',
      'not-started': 'secondary'
    };
    return map[status];
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'Chronic Disease Management': 'pi-heart',
      'Post-Procedure Recovery': 'pi-shield',
      'Mental Health': 'pi-users',
    };
    return map[category] ?? 'pi-clipboard';
  }

  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      'Chronic Disease Management': 'teal',
      'Post-Procedure Recovery': 'blue',
      'Mental Health': 'purple',
    };
    return map[category] ?? 'orange';
  }

  getInitials(name: string): string {
    return name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getTeamMemberInitials(member: string): string {
    const name = member.split('(')[0].trim().replace('Dr. ', '');
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }
}
