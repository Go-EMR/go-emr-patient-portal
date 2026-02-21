import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import {
  CareTeamService,
  CareTeamMember,
  MemberStatus,
  MessagePriority,
  ComposeMessage,
  MessageAttachment
} from '../data-access';

@Component({
  selector: 'app-care-team',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    TooltipModule,
    BadgeModule
  ],
  template: `
    <div class="care-team-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-users"></i>
          </div>
          <div>
            <h1 class="page-title">Your Care Team</h1>
            <p class="page-subtitle">Connect with your healthcare providers, send secure messages, and manage your care relationships</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-badge stat-online">
            <span class="status-dot status-online-dot"></span>
            {{ service.onlineMembers().length }} Online Now
          </div>
          <div class="stat-badge stat-members">
            <i class="pi pi-users"></i>
            {{ service.careTeam().length }} Members
          </div>
          @if (service.totalUnread() > 0) {
            <div class="stat-badge stat-messages">
              <i class="pi pi-envelope"></i>
              {{ service.totalUnread() }} Unread
            </div>
          }
        </div>
      </div>

      <!-- Primary Care Section -->
      <section class="team-section">
        <div class="section-label">
          <div class="section-label-icon section-label-primary">
            <i class="pi pi-home"></i>
          </div>
          <div>
            <h2 class="section-title">Primary Care</h2>
            <p class="section-subtitle">Your primary care providers and day-to-day healthcare team</p>
          </div>
        </div>

        <div class="members-grid">
          @for (member of service.membersByRole().primary; track member.id) {
            <div class="member-card" [class.member-card-selected]="service.selectedMember()?.id === member.id"
                 (click)="toggleDetail(member)">
              <div class="member-card-header">
                <div class="avatar-wrap">
                  <div class="member-avatar" [class]="'avatar-' + getAvatarColor(member.id)">
                    {{ member.avatar }}
                  </div>
                  <span class="status-indicator" [class]="'status-' + member.status"
                        [pTooltip]="getStatusLabel(member.status)" tooltipPosition="top"></span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-role">{{ member.role }}</div>
                  <div class="member-specialty">{{ member.specialty }}</div>
                </div>
              </div>

              <div class="member-meta">
                <div class="meta-row">
                  <i class="pi pi-calendar-minus"></i>
                  <span>Last visit: {{ formatDate(member.lastVisitDate) }}</span>
                </div>
                <div class="meta-row">
                  <i class="pi pi-calendar-plus"></i>
                  <span>Next available: {{ formatDate(member.nextAvailableDate) }}</span>
                </div>
              </div>

              <div class="member-actions" (click)="$event.stopPropagation()">
                <button class="action-btn action-btn-primary" (click)="openCompose(member)">
                  <i class="pi pi-envelope"></i>
                  Message
                  @if (getUnreadCount(member.id) > 0) {
                    <span class="btn-badge">{{ getUnreadCount(member.id) }}</span>
                  }
                </button>
                <button class="action-btn" (click)="callMember(member)">
                  <i class="pi pi-phone"></i>
                  Call
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Specialists Section -->
      <section class="team-section">
        <div class="section-label">
          <div class="section-label-icon section-label-specialist">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div>
            <h2 class="section-title">Specialists</h2>
            <p class="section-subtitle">Specialist physicians coordinating your specialized care</p>
          </div>
        </div>

        <div class="members-grid">
          @for (member of service.membersByRole().specialist; track member.id) {
            <div class="member-card" [class.member-card-selected]="service.selectedMember()?.id === member.id"
                 (click)="toggleDetail(member)">
              <div class="member-card-header">
                <div class="avatar-wrap">
                  <div class="member-avatar" [class]="'avatar-' + getAvatarColor(member.id)">
                    {{ member.avatar }}
                  </div>
                  <span class="status-indicator" [class]="'status-' + member.status"
                        [pTooltip]="getStatusLabel(member.status)" tooltipPosition="top"></span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-role">{{ member.role }}</div>
                  <div class="member-specialty">{{ member.specialty }}</div>
                </div>
              </div>

              <div class="member-meta">
                <div class="meta-row">
                  <i class="pi pi-calendar-minus"></i>
                  <span>Last visit: {{ formatDate(member.lastVisitDate) }}</span>
                </div>
                <div class="meta-row">
                  <i class="pi pi-calendar-plus"></i>
                  <span>Next available: {{ formatDate(member.nextAvailableDate) }}</span>
                </div>
              </div>

              <div class="member-actions" (click)="$event.stopPropagation()">
                <button class="action-btn action-btn-primary" (click)="openCompose(member)">
                  <i class="pi pi-envelope"></i>
                  Message
                  @if (getUnreadCount(member.id) > 0) {
                    <span class="btn-badge">{{ getUnreadCount(member.id) }}</span>
                  }
                </button>
                <button class="action-btn" (click)="callMember(member)">
                  <i class="pi pi-phone"></i>
                  Call
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Support Staff Section -->
      <section class="team-section">
        <div class="section-label">
          <div class="section-label-icon section-label-support">
            <i class="pi pi-star-fill"></i>
          </div>
          <div>
            <h2 class="section-title">Support Staff</h2>
            <p class="section-subtitle">Allied health professionals and support staff on your care team</p>
          </div>
        </div>

        <div class="members-grid">
          @for (member of service.membersByRole().support; track member.id) {
            <div class="member-card" [class.member-card-selected]="service.selectedMember()?.id === member.id"
                 (click)="toggleDetail(member)">
              <div class="member-card-header">
                <div class="avatar-wrap">
                  <div class="member-avatar" [class]="'avatar-' + getAvatarColor(member.id)">
                    {{ member.avatar }}
                  </div>
                  <span class="status-indicator" [class]="'status-' + member.status"
                        [pTooltip]="getStatusLabel(member.status)" tooltipPosition="top"></span>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-role">{{ member.role }}</div>
                  <div class="member-specialty">{{ member.specialty }}</div>
                </div>
              </div>

              <div class="member-meta">
                <div class="meta-row">
                  <i class="pi pi-calendar-minus"></i>
                  <span>Last visit: {{ formatDate(member.lastVisitDate) }}</span>
                </div>
                <div class="meta-row">
                  <i class="pi pi-calendar-plus"></i>
                  <span>Next available: {{ formatDate(member.nextAvailableDate) }}</span>
                </div>
              </div>

              <div class="member-actions" (click)="$event.stopPropagation()">
                <button class="action-btn action-btn-primary" (click)="openCompose(member)">
                  <i class="pi pi-envelope"></i>
                  Message
                  @if (getUnreadCount(member.id) > 0) {
                    <span class="btn-badge">{{ getUnreadCount(member.id) }}</span>
                  }
                </button>
                <button class="action-btn" (click)="callMember(member)">
                  <i class="pi pi-phone"></i>
                  Call
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Member Detail Panel -->
      @if (service.selectedMember(); as member) {
        <section class="detail-panel">
          <div class="detail-panel-inner">

            <div class="detail-close-row">
              <h2 class="detail-panel-title">Provider Details</h2>
              <button class="detail-close-btn" (click)="service.selectMember(null)">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div class="detail-profile">
              <div class="detail-avatar" [class]="'avatar-' + getAvatarColor(member.id)">
                {{ member.avatar }}
              </div>
              <div class="detail-identity">
                <div class="detail-name">{{ member.name }}</div>
                <div class="detail-role">{{ member.role }}</div>
                <div class="detail-specialty-tag">{{ member.specialty }}</div>
                <div class="detail-status-row">
                  <span class="status-indicator-inline" [class]="'status-inline-' + member.status"></span>
                  <span class="detail-status-text">{{ getStatusLabel(member.status) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">About</div>
              <p class="detail-bio">{{ member.bio }}</p>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">Education & Training</div>
              <div class="detail-education">
                <i class="pi pi-graduation-cap"></i>
                <span>{{ member.education }}</span>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-field">
                <div class="detail-field-label">Experience</div>
                <div class="detail-field-value">{{ member.yearsExperience }} years</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">Languages</div>
                <div class="detail-field-value">{{ member.languages.join(', ') }}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">Next Available</div>
                <div class="detail-field-value">{{ formatDate(member.nextAvailableDate) }}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">Last Visit</div>
                <div class="detail-field-value">{{ formatDate(member.lastVisitDate) }}</div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">Contact</div>
              <div class="detail-contact-list">
                <div class="detail-contact-item">
                  <i class="pi pi-phone"></i>
                  <a [href]="'tel:' + member.phone" class="detail-contact-link">{{ member.phone }}</a>
                </div>
                <div class="detail-contact-item">
                  <i class="pi pi-envelope"></i>
                  <span class="detail-contact-link">{{ member.email }}</span>
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <button class="detail-action-primary" (click)="openCompose(member); service.selectMember(null)">
                <i class="pi pi-envelope"></i>
                Send Message
              </button>
              <button class="detail-action-secondary" (click)="callMember(member)">
                <i class="pi pi-phone"></i>
                Call Office
              </button>
            </div>

          </div>
        </section>
      }

      <!-- Message Threads Section -->
      <section class="team-section">
        <div class="section-label">
          <div class="section-label-icon section-label-messages">
            <i class="pi pi-envelope"></i>
          </div>
          <div>
            <h2 class="section-title">Recent Messages</h2>
            <p class="section-subtitle">Secure message threads with your care team</p>
          </div>
        </div>

        <div class="threads-list">
          @for (thread of service.messageThreads(); track thread.id) {
            <div class="thread-item" [class.thread-item-active]="service.activeThreadId() === thread.id"
                 (click)="service.setActiveThread(thread.id)">
              <div class="thread-avatar" [class]="'avatar-' + getAvatarColor(thread.memberId)">
                {{ getMemberAvatar(thread.memberId) }}
              </div>
              <div class="thread-content">
                <div class="thread-header-row">
                  <div class="thread-sender">{{ getMemberName(thread.memberId) }}</div>
                  <div class="thread-time">{{ formatRelativeTime(thread.lastMessageTime) }}</div>
                </div>
                <div class="thread-subject">{{ thread.subject }}</div>
                <div class="thread-preview" [class.thread-preview-unread]="thread.unreadCount > 0">
                  {{ thread.lastMessage }}
                </div>
              </div>
              @if (thread.unreadCount > 0) {
                <div class="thread-badge">{{ thread.unreadCount }}</div>
              }
            </div>
          }
        </div>

        <!-- Thread Messages -->
        @if (service.activeThread(); as thread) {
          <div class="thread-conversation">
            <div class="thread-conv-header">
              <button class="conv-back-btn" (click)="service.setActiveThread(null)">
                <i class="pi pi-arrow-left"></i>
              </button>
              <div class="conv-header-info">
                <div class="conv-header-title">{{ thread.subject }}</div>
                <div class="conv-header-sub">{{ getMemberName(thread.memberId) }}</div>
              </div>
              <button class="conv-reply-btn" (click)="openComposeForThread(thread.memberId)">
                <i class="pi pi-reply"></i>
                Reply
              </button>
            </div>

            <div class="messages-list">
              @for (msg of thread.messages; track msg.id) {
                <div class="message-bubble-wrap" [class.message-from-patient]="msg.sender === 'patient'">
                  @if (msg.sender !== 'patient') {
                    <div class="bubble-avatar" [class]="'avatar-' + getAvatarColor(thread.memberId)">
                      {{ msg.senderAvatar }}
                    </div>
                  }
                  <div class="message-bubble-col">
                    @if (msg.sender !== 'patient') {
                      <div class="bubble-sender">{{ msg.senderName }}</div>
                    }
                    <div class="message-bubble" [class.message-bubble-patient]="msg.sender === 'patient'"
                         [class.bubble-urgent]="msg.priority === 'urgent'">
                      @if (msg.priority === 'urgent') {
                        <div class="bubble-priority">
                          <i class="pi pi-exclamation-triangle"></i>
                          Urgent
                        </div>
                      }
                      <p class="bubble-text">{{ msg.text }}</p>
                      @if (msg.attachments.length > 0) {
                        <div class="bubble-attachments">
                          @for (att of msg.attachments; track att.name) {
                            <div class="attachment-chip">
                              <i [class]="getAttachmentIcon(att.type)"></i>
                              <span class="att-name">{{ att.name }}</span>
                              <span class="att-size">{{ att.size }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                    <div class="bubble-meta">
                      <span class="bubble-time">{{ formatMessageTime(msg.timestamp) }}</span>
                      @if (msg.sender === 'patient') {
                        <span class="bubble-read-status">
                          @if (msg.isRead) {
                            <i class="pi pi-check-circle read-icon-read" [pTooltip]="'Read ' + formatMessageTime(msg.readAt ?? '')" tooltipPosition="top"></i>
                          } @else {
                            <i class="pi pi-check read-icon-sent" pTooltip="Delivered" tooltipPosition="top"></i>
                          }
                        </span>
                      }
                    </div>
                  </div>
                  @if (msg.sender === 'patient') {
                    <div class="bubble-avatar avatar-teal-patient">
                      AJ
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </section>

    </div>

    <!-- Compose Message Dialog -->
    <p-dialog
      [(visible)]="composeVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '560px', maxWidth: '95vw' }"
      styleClass="compose-dialog"
      header="New Secure Message">

      @if (composeTarget()) {
        <div class="compose-recipient-bar">
          <div class="compose-recipient-avatar" [class]="'avatar-' + getAvatarColor(composeTarget()!.id)">
            {{ composeTarget()!.avatar }}
          </div>
          <div class="compose-recipient-info">
            <div class="compose-recipient-name">{{ composeTarget()!.name }}</div>
            <div class="compose-recipient-role">{{ composeTarget()!.role }}</div>
          </div>
        </div>
      }

      <div class="compose-form">

        <div class="compose-field">
          <label class="compose-label">Subject</label>
          <input class="compose-input" type="text" [(ngModel)]="composeSubject"
                 placeholder="Brief description of your message" />
        </div>

        <div class="compose-field">
          <label class="compose-label">Priority</label>
          <div class="priority-selector">
            <button class="priority-btn" [class.priority-btn-active]="composePriority() === 'routine'"
                    (click)="composePriority.set('routine')">
              <i class="pi pi-circle"></i>
              Routine
            </button>
            <button class="priority-btn priority-btn-urgent" [class.priority-btn-active]="composePriority() === 'urgent'"
                    (click)="composePriority.set('urgent')">
              <i class="pi pi-exclamation-triangle"></i>
              Urgent
            </button>
          </div>
          @if (composePriority() === 'urgent') {
            <p class="priority-note">
              <i class="pi pi-info-circle"></i>
              For life-threatening emergencies, call 911. Urgent messages are reviewed within 4 business hours.
            </p>
          }
        </div>

        <div class="compose-field">
          <label class="compose-label">Message</label>
          <textarea class="compose-textarea" [(ngModel)]="composeText" rows="6"
                    placeholder="Type your message here. Include relevant symptoms, dates, and any questions you have for your provider."></textarea>
          <div class="compose-char-count">{{ composeText.length }} characters</div>
        </div>

        <div class="compose-field">
          <label class="compose-label">Attachments (Simulated)</label>
          <div class="attachment-area">
            @for (att of composeAttachments(); track att.name) {
              <div class="attachment-chip-compose">
                <i [class]="getAttachmentIcon(att.type)"></i>
                <span>{{ att.name }}</span>
                <button class="att-remove" (click)="removeAttachment(att.name)">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            }
            <button class="attach-btn" (click)="simulateAttachment()">
              <i class="pi pi-paperclip"></i>
              Attach File
            </button>
          </div>
        </div>

      </div>

      <ng-template pTemplate="footer">
        <div class="compose-footer">
          <div class="compose-footer-note">
            <i class="pi pi-lock"></i>
            End-to-end encrypted, HIPAA-compliant messaging
          </div>
          <div class="compose-footer-actions">
            <button class="compose-cancel" (click)="closeCompose()">Cancel</button>
            <button class="compose-send" [disabled]="!canSend()" (click)="sendMessage()">
              <i class="pi pi-send"></i>
              Send Message
            </button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Call Simulation Dialog -->
    <p-dialog
      [(visible)]="callVisible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '380px', maxWidth: '95vw' }"
      styleClass="call-dialog"
      header="Contact Office">

      @if (callTarget()) {
        <div class="call-body">
          <div class="call-avatar-wrap">
            <div class="call-avatar" [class]="'avatar-' + getAvatarColor(callTarget()!.id)">
              {{ callTarget()!.avatar }}
            </div>
          </div>
          <div class="call-name">{{ callTarget()!.name }}</div>
          <div class="call-role">{{ callTarget()!.role }}</div>
          <a class="call-number" [href]="'tel:' + callTarget()!.phone">
            <i class="pi pi-phone"></i>
            {{ callTarget()!.phone }}
          </a>
          <p class="call-note">Office hours: Monday–Friday, 8:00 AM – 5:00 PM EST</p>
        </div>
      }

      <ng-template pTemplate="footer">
        <div class="call-footer">
          <button class="call-close-btn" (click)="callVisible = false">Close</button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .care-team-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 128, 128, 0.25);
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
      max-width: 500px;
    }

    .header-stats {
      display: flex;
      gap: 0.625rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .stat-online {
      background: var(--green-50, #f0fdf4);
      color: var(--green-700);
      border: 1px solid var(--green-200, #bbf7d0);
    }

    .stat-members {
      background: var(--blue-50, #eff6ff);
      color: var(--blue-700);
      border: 1px solid var(--blue-200, #bfdbfe);
    }

    .stat-messages {
      background: var(--orange-50, #fff7ed);
      color: var(--orange-700);
      border: 1px solid var(--orange-200, #fed7aa);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-online-dot {
      background: var(--green-500);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
      animation: pulse-green 2s infinite;
    }

    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
      70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    /* ===== Team Section ===== */
    .team-section {
      margin-bottom: 2.5rem;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .section-label-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      flex-shrink: 0;
    }

    .section-label-primary {
      background: var(--teal-50, #f0fdfa);
      color: var(--teal-600);
    }

    .section-label-specialist {
      background: var(--red-50, #fef2f2);
      color: var(--red-600);
    }

    .section-label-support {
      background: #f5f0ff;
      color: #7c3aed;
    }

    .section-label-messages {
      background: var(--blue-50, #eff6ff);
      color: var(--blue-600);
    }

    .section-title {
      margin: 0 0 0.2rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .section-subtitle {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    /* ===== Members Grid ===== */
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    /* ===== Member Card ===== */
    .member-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.18s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .member-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      border-color: var(--primary-300, #7dd3fc);
      transform: translateY(-1px);
    }

    .member-card-selected {
      border-color: var(--primary-400);
      box-shadow: 0 0 0 2px var(--primary-100), 0 4px 16px rgba(0,0,0,0.1);
    }

    .member-card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
    }

    .avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .member-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: white;
    }

    /* Avatar color variants */
    .avatar-teal { background: linear-gradient(135deg, var(--teal-500), var(--teal-700)); }
    .avatar-blue { background: linear-gradient(135deg, var(--blue-500), var(--blue-700)); }
    .avatar-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .avatar-red { background: linear-gradient(135deg, var(--red-500), var(--red-700)); }
    .avatar-orange { background: linear-gradient(135deg, var(--orange-500), var(--orange-700)); }
    .avatar-green { background: linear-gradient(135deg, var(--green-500), var(--green-700)); }
    .avatar-teal-patient { background: linear-gradient(135deg, var(--teal-400), var(--teal-600)); }

    /* Status indicator dot */
    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--surface-card);
    }

    .status-online {
      background: var(--green-500);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
      animation: pulse-green 2s infinite;
    }

    .status-offline {
      background: var(--surface-400, #94a3b8);
    }

    .status-busy {
      background: var(--yellow-500);
    }

    .member-info {
      flex: 1;
      min-width: 0;
    }

    .member-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-role {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      margin-bottom: 0.125rem;
    }

    .member-specialty {
      font-size: 0.75rem;
      color: var(--primary-600);
      font-weight: 500;
    }

    .member-meta {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .meta-row i {
      font-size: 0.75rem;
      width: 14px;
      text-align: center;
      color: var(--text-color-secondary);
    }

    /* ===== Action Buttons on Card ===== */
    .member-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      transition: all 0.15s ease;
      font-family: inherit;
      position: relative;
    }

    .action-btn:hover {
      background: var(--surface-hover);
      border-color: var(--surface-400, #94a3b8);
    }

    .action-btn-primary {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .action-btn-primary:hover {
      background: var(--primary-700);
      border-color: var(--primary-700);
    }

    .btn-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      background: var(--red-500);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ===== Detail Panel ===== */
    .detail-panel {
      background: var(--surface-card);
      border: 1px solid var(--primary-200, #a5f3fc);
      border-radius: 14px;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .detail-panel-inner {
      padding: 1.75rem;
    }

    .detail-close-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .detail-panel-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .detail-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: all 0.15s ease;
    }

    .detail-close-btn:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .detail-profile {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      margin-bottom: 1.75rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .detail-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .detail-identity {
      flex: 1;
    }

    .detail-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.25rem;
    }

    .detail-role {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.375rem;
    }

    .detail-specialty-tag {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      background: var(--primary-50);
      color: var(--primary-700);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .detail-status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-indicator-inline {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-inline-online { background: var(--green-500); }
    .status-inline-offline { background: var(--surface-400, #94a3b8); }
    .status-inline-busy { background: var(--yellow-500); }

    .detail-status-text {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      margin-bottom: 0.625rem;
    }

    .detail-bio {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.7;
      color: var(--text-color);
    }

    .detail-education {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: var(--text-color);
    }

    .detail-education i {
      color: var(--primary-600);
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.875rem 2rem;
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      background: var(--surface-ground);
      border-radius: 10px;
    }

    .detail-field-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      margin-bottom: 0.2rem;
    }

    .detail-field-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .detail-contact-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .detail-contact-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
    }

    .detail-contact-item i {
      color: var(--primary-600);
      width: 16px;
    }

    .detail-contact-link {
      color: var(--primary-700);
      text-decoration: none;
    }

    .detail-contact-link:hover {
      text-decoration: underline;
    }

    .detail-actions {
      display: flex;
      gap: 0.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--surface-border);
    }

    .detail-action-primary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      background: var(--primary-color);
      color: white;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .detail-action-primary:hover {
      background: var(--primary-700);
    }

    .detail-action-secondary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color);
      border: 1px solid var(--surface-border);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .detail-action-secondary:hover {
      background: var(--surface-hover);
    }

    /* ===== Message Threads ===== */
    .threads-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 1.25rem;
    }

    .thread-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: all 0.15s ease;
      border-bottom: 1px solid var(--surface-border);
      position: relative;
    }

    .thread-item:last-child {
      border-bottom: none;
    }

    .thread-item:hover {
      background: var(--surface-hover);
    }

    .thread-item-active {
      background: var(--primary-50);
      border-color: var(--primary-100);
    }

    .thread-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .thread-content {
      flex: 1;
      min-width: 0;
    }

    .thread-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
    }

    .thread-sender {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .thread-time {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    .thread-subject {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 0.125rem;
    }

    .thread-preview {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-preview-unread {
      color: var(--text-color);
      font-weight: 500;
    }

    .thread-badge {
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 10px;
      background: var(--primary-color);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ===== Thread Conversation ===== */
    .thread-conversation {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .thread-conv-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .conv-back-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .conv-back-btn:hover {
      background: var(--surface-hover);
    }

    .conv-header-info {
      flex: 1;
      min-width: 0;
    }

    .conv-header-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .conv-header-sub {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .conv-reply-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.4rem 0.875rem;
      border-radius: 8px;
      background: var(--primary-color);
      color: white;
      border: none;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      flex-shrink: 0;
    }

    .conv-reply-btn:hover {
      background: var(--primary-700);
    }

    .messages-list {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-height: 480px;
      overflow-y: auto;
    }

    .message-bubble-wrap {
      display: flex;
      align-items: flex-end;
      gap: 0.625rem;
    }

    .message-from-patient {
      flex-direction: row-reverse;
    }

    .bubble-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .message-bubble-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 70%;
    }

    .message-from-patient .message-bubble-col {
      align-items: flex-end;
    }

    .bubble-sender {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      padding: 0 0.375rem;
    }

    .message-bubble {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 12px 12px 12px 4px;
      padding: 0.75rem 1rem;
    }

    .message-bubble-patient {
      background: var(--primary-600);
      border-color: var(--primary-600);
      border-radius: 12px 12px 4px 12px;
    }

    .bubble-urgent {
      border-color: var(--red-400);
      background: var(--red-50, #fef2f2);
    }

    .bubble-priority {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--red-600);
      margin-bottom: 0.375rem;
    }

    .bubble-text {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-color);
    }

    .message-bubble-patient .bubble-text {
      color: white;
    }

    .bubble-attachments {
      margin-top: 0.625rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .attachment-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.625rem;
      background: rgba(255,255,255,0.15);
      border-radius: 6px;
      font-size: 0.75rem;
      color: inherit;
    }

    .message-bubble:not(.message-bubble-patient) .attachment-chip {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color);
    }

    .att-name {
      flex: 1;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .att-size {
      opacity: 0.7;
      white-space: nowrap;
    }

    .bubble-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0 0.375rem;
    }

    .bubble-time {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .bubble-read-status {
      font-size: 0.75rem;
    }

    .read-icon-read {
      color: var(--primary-500);
    }

    .read-icon-sent {
      color: var(--surface-400, #94a3b8);
    }

    /* ===== Compose Dialog ===== */
    .compose-recipient-bar {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
      margin: -1.25rem -1.5rem 1.25rem;
    }

    .compose-recipient-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .compose-recipient-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .compose-recipient-role {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .compose-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .compose-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .compose-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      letter-spacing: 0.04em;
    }

    .compose-input {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.15s ease;
      outline: none;
    }

    .compose-input:focus {
      border-color: var(--primary-400);
      box-shadow: 0 0 0 2px var(--primary-100);
    }

    .compose-textarea {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
      min-height: 120px;
      transition: border-color 0.15s ease;
      outline: none;
      line-height: 1.6;
    }

    .compose-textarea:focus {
      border-color: var(--primary-400);
      box-shadow: 0 0 0 2px var(--primary-100);
    }

    .compose-char-count {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      text-align: right;
    }

    /* Priority selector */
    .priority-selector {
      display: flex;
      gap: 0.5rem;
    }

    .priority-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .priority-btn.priority-btn-active {
      background: var(--primary-50);
      color: var(--primary-700);
      border-color: var(--primary-300);
    }

    .priority-btn-urgent.priority-btn-active {
      background: var(--red-50, #fef2f2);
      color: var(--red-700);
      border-color: var(--red-300, #fca5a5);
    }

    .priority-note {
      margin: 0;
      font-size: 0.75rem;
      color: var(--red-600);
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--red-50, #fef2f2);
      border-radius: 6px;
      border: 1px solid var(--red-200, #fecaca);
      line-height: 1.5;
    }

    /* Attachment area */
    .attachment-area {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      padding: 0.625rem;
      border: 1px dashed var(--surface-400, #94a3b8);
      border-radius: 8px;
      min-height: 48px;
      background: var(--surface-ground);
    }

    .attachment-chip-compose {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--text-color);
    }

    .att-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      padding: 0;
      display: flex;
      align-items: center;
      font-size: 0.7rem;
      transition: color 0.15s ease;
    }

    .att-remove:hover {
      color: var(--red-500);
    }

    .attach-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-color-secondary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .attach-btn:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    /* Compose footer */
    .compose-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .compose-footer-note {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .compose-footer-note i {
      color: var(--green-600);
    }

    .compose-footer-actions {
      display: flex;
      gap: 0.5rem;
    }

    .compose-cancel {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .compose-cancel:hover {
      background: var(--surface-hover);
    }

    .compose-send {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1.125rem;
      border-radius: 8px;
      background: var(--primary-color);
      color: white;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .compose-send:hover:not(:disabled) {
      background: var(--primary-700);
    }

    .compose-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ===== Call Dialog ===== */
    .call-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0 0.5rem;
      text-align: center;
    }

    .call-avatar-wrap {
      margin-bottom: 0.25rem;
    }

    .call-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .call-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .call-role {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .call-number {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
      margin-top: 0.25rem;
    }

    .call-number:hover {
      background: var(--primary-100);
    }

    .call-note {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .call-footer {
      display: flex;
      justify-content: center;
    }

    .call-close-btn {
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .call-close-btn:hover {
      background: var(--surface-hover);
    }

    /* ===== Responsive ===== */
    @media (max-width: 1024px) {
      .members-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-stats {
        width: 100%;
      }

      .members-grid {
        grid-template-columns: 1fr;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .message-bubble-col {
        max-width: 85%;
      }

      .compose-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .compose-footer-actions {
        justify-content: flex-end;
      }

      .detail-profile {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .detail-status-row {
        justify-content: center;
      }

      .detail-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CareTeamComponent {
  readonly service = inject(CareTeamService);

  composeVisible = false;
  composeTarget = signal<CareTeamMember | null>(null);
  composeSubject = '';
  composeText = '';
  composePriority = signal<MessagePriority>('routine');
  composeAttachments = signal<MessageAttachment[]>([]);

  callVisible = false;
  callTarget = signal<CareTeamMember | null>(null);

  canSend = computed(() =>
    this.composeTarget() !== null && this.composeText.trim().length > 0
  );

  private readonly AVATAR_COLORS: Record<string, string> = {
    'ct-001': 'teal',
    'ct-002': 'blue',
    'ct-003': 'purple',
    'ct-004': 'orange',
    'ct-005': 'green',
    'ct-006': 'red'
  };

  private readonly SIMULATED_ATTACHMENTS: MessageAttachment[] = [
    { name: 'Symptom_Log.pdf', type: 'pdf', size: '128 KB' },
    { name: 'Blood_Pressure_Reading.png', type: 'image', size: '84 KB' },
    { name: 'Medication_Schedule.docx', type: 'docx', size: '56 KB' }
  ];

  getAvatarColor(memberId: string): string {
    return this.AVATAR_COLORS[memberId] ?? 'teal';
  }

  getStatusLabel(status: MemberStatus): string {
    const labels: Record<MemberStatus, string> = {
      online: 'Available',
      offline: 'Offline',
      busy: 'Busy — may be delayed'
    };
    return labels[status];
  }

  toggleDetail(member: CareTeamMember): void {
    const current = this.service.selectedMember();
    this.service.selectMember(current?.id === member.id ? null : member);
  }

  openCompose(member: CareTeamMember): void {
    this.composeTarget.set(member);
    this.composeSubject = '';
    this.composeText = '';
    this.composePriority.set('routine');
    this.composeAttachments.set([]);
    this.composeVisible = true;
  }

  openComposeForThread(memberId: string): void {
    const member = this.service.careTeam().find(m => m.id === memberId);
    if (member) {
      this.openCompose(member);
    }
  }

  closeCompose(): void {
    this.composeVisible = false;
    this.composeTarget.set(null);
  }

  sendMessage(): void {
    const target = this.composeTarget();
    if (!target || !this.composeText.trim()) return;

    const compose = {
      recipientId: target.id,
      subject: this.composeSubject || `Message to ${target.name}`,
      text: this.composeText.trim(),
      priority: this.composePriority(),
      attachments: this.composeAttachments()
    };

    this.service.sendMessage(compose);
    this.closeCompose();
  }

  simulateAttachment(): void {
    const existing = this.composeAttachments();
    const available = this.SIMULATED_ATTACHMENTS.filter(
      a => !existing.some(e => e.name === a.name)
    );
    if (available.length > 0) {
      this.composeAttachments.update(atts => [...atts, available[0]]);
    }
  }

  removeAttachment(name: string): void {
    this.composeAttachments.update(atts => atts.filter(a => a.name !== name));
  }

  callMember(member: CareTeamMember): void {
    this.callTarget.set(member);
    this.callVisible = true;
  }

  getMemberName(memberId: string): string {
    return this.service.careTeam().find(m => m.id === memberId)?.name ?? 'Provider';
  }

  getMemberAvatar(memberId: string): string {
    return this.service.careTeam().find(m => m.id === memberId)?.avatar ?? '??';
  }

  getUnreadCount(memberId: string): number {
    return this.service.messageThreads().find(t => t.memberId === memberId)?.unreadCount ?? 0;
  }

  getAttachmentIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: 'pi pi-file-pdf',
      image: 'pi pi-image',
      docx: 'pi pi-file-word',
      doc: 'pi pi-file-word',
      png: 'pi pi-image',
      jpg: 'pi pi-image'
    };
    return icons[type] ?? 'pi pi-file';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatMessageTime(isoStr: string): string {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  formatRelativeTime(isoStr: string): string {
    if (!isoStr) return '';
    const now = new Date();
    const d = new Date(isoStr);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
