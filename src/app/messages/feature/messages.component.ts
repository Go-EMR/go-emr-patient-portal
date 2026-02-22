import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageThread } from '../../shared/data-access';

// ---------------------------------------------------------------------------
// Domain types local to the messages feature
// ---------------------------------------------------------------------------

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'responded';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'provider' | 'staff';
  content: string;
  sentAt: Date;
  status: MessageStatus;
}

interface Attachment {
  name: string;
  size: string;
}

// ---------------------------------------------------------------------------
// Feature 11.4: Message routing rules
// ---------------------------------------------------------------------------

interface RoutingRule {
  category: string;
  destination: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Feature 11.5: Quick reply templates
// ---------------------------------------------------------------------------

interface QuickReplyTemplate {
  id: string;
  label: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    DialogModule,
    SelectModule,
    Textarea,
    SelectButtonModule
  ],
  template: `
    <div class="messages-page">

      <!-- Page header -->
      <header class="page-header">
        <div>
          <h1>Messages</h1>
          <p>Secure communication with your care team</p>
        </div>
        <button pButton label="New Message" icon="pi pi-plus" (click)="showComposeDialog = true"></button>
      </header>

      <!-- Two-column layout -->
      <div class="messages-layout">

        <!-- Thread list sidebar -->
        <aside class="threads-list">
          <div class="search-box">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input type="text" pInputText placeholder="Search messages" [(ngModel)]="searchQuery" class="w-full" />
            </span>
          </div>

          <!-- Episode grouping toggle -->
          <div class="episode-toggle-row">
            <p-selectButton
              [options]="threadViewOptions"
              [(ngModel)]="threadView"
              optionLabel="label"
              optionValue="value"
              [style]="{'width':'100%'}"
              aria-label="Switch between all messages and grouped by episode">
            </p-selectButton>
          </div>

          <div class="threads">
            @if (threadView === 'all') {
              <!-- Flat list: all messages -->
              @for (thread of filteredThreads(); track thread.id) {
                <div
                  class="thread-item"
                  [class.active]="selectedThread()?.id === thread.id"
                  [class.unread]="thread.unreadCount > 0"
                  (click)="selectThread(thread)"
                >
                  <p-avatar [label]="(thread.participants[1]?.name ?? '?').charAt(0)" shape="circle"></p-avatar>
                  <div class="thread-content">
                    <span class="thread-from">{{ thread.participants[1]?.name ?? 'Care Team' }}</span>
                    <span class="thread-subject">{{ thread.subject }}</span>
                    <span class="thread-preview">{{ thread.lastMessagePreview }}</span>
                  </div>
                  <div class="thread-meta">
                    <span class="thread-time">{{ thread.lastMessageAt | date:'MMM d' }}</span>
                    @if (thread.unreadCount > 0) {
                      <p-badge [value]="thread.unreadCount.toString()"></p-badge>
                    }
                  </div>
                </div>
              }
            } @else {
              <!-- Grouped by episode -->
              @for (group of episodeGroups(); track group.episode) {
                <!-- Episode header / divider -->
                <div
                  class="episode-header"
                  (click)="toggleEpisode(group.episode)"
                  [attr.aria-expanded]="!collapsedEpisodes().has(group.episode)"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="toggleEpisode(group.episode)"
                  (keydown.space)="toggleEpisode(group.episode)"
                  [attr.aria-label]="'Episode: ' + group.episode + ', ' + group.threads.length + ' thread(s)'"
                >
                  <div class="episode-header-left">
                    <i class="pi pi-folder episode-icon" aria-hidden="true"></i>
                    <span class="episode-name">{{ group.episode }}</span>
                    <span class="episode-count">{{ group.threads.length }}</span>
                  </div>
                  <i
                    class="pi episode-chevron"
                    [class.pi-chevron-down]="!collapsedEpisodes().has(group.episode)"
                    [class.pi-chevron-right]="collapsedEpisodes().has(group.episode)"
                    aria-hidden="true">
                  </i>
                </div>

                <!-- Threads within episode (collapsible) -->
                @if (!collapsedEpisodes().has(group.episode)) {
                  @for (thread of group.threads; track thread.id) {
                    <div
                      class="thread-item thread-item-indented"
                      [class.active]="selectedThread()?.id === thread.id"
                      [class.unread]="thread.unreadCount > 0"
                      (click)="selectThread(thread)"
                    >
                      <p-avatar [label]="(thread.participants[1]?.name ?? '?').charAt(0)" shape="circle"></p-avatar>
                      <div class="thread-content">
                        <span class="thread-from">{{ thread.participants[1]?.name ?? 'Care Team' }}</span>
                        <span class="thread-subject">{{ thread.subject }}</span>
                        <span class="thread-preview">{{ thread.lastMessagePreview }}</span>
                      </div>
                      <div class="thread-meta">
                        <span class="thread-time">{{ thread.lastMessageAt | date:'MMM d' }}</span>
                        @if (thread.unreadCount > 0) {
                          <p-badge [value]="thread.unreadCount.toString()"></p-badge>
                        }
                      </div>
                    </div>
                  }
                }
              }
            }
          </div>
        </aside>

        <!-- Message view panel -->
        <main class="message-view">
          @if (selectedThread()) {

            <!-- Feature 3: SLA info bar -->
            <div class="sla-bar">
              <i class="pi pi-info-circle sla-icon"></i>
              <span class="sla-text">
                <strong>Response Time:</strong> Expect a response within 2 business days.
                For urgent matters, please call your provider's office or dial 911.
              </span>
            </div>

            <!-- Thread header -->
            <div class="message-header">
              <h2>{{ selectedThread()!.subject }}</h2>
              <span class="category">{{ selectedThread()!.category }}</span>
            </div>

            <!-- Feature 1: Conversation bubbles with read receipts -->
            <div class="message-body">
              @for (msg of threadMessages(); track msg.id) {
                @if (msg.senderType === 'patient') {

                  <!-- Sent bubble (patient, right-aligned) -->
                  <div class="message-bubble sent">
                    <div class="bubble-content sent-bubble">
                      <p>{{ msg.content }}</p>
                      <span class="time">{{ msg.sentAt | date:'short' }}</span>
                      <!-- Read receipt status indicator -->
                      <div class="status-indicator" [title]="msg.status">
                        @if (msg.status === 'sending') {
                          <i class="pi pi-spin pi-spinner status-icon status-sending"></i>
                        }
                        @if (msg.status === 'sent') {
                          <i class="pi pi-check status-icon status-sent" title="Sent"></i>
                        }
                        @if (msg.status === 'delivered') {
                          <span class="double-check status-delivered">
                            <i class="pi pi-check"></i><i class="pi pi-check overlap"></i>
                          </span>
                        }
                        @if (msg.status === 'read') {
                          <span class="double-check status-read">
                            <i class="pi pi-check"></i><i class="pi pi-check overlap"></i>
                          </span>
                        }
                        @if (msg.status === 'responded') {
                          <span class="double-check status-responded">
                            <i class="pi pi-check"></i><i class="pi pi-check overlap"></i>
                          </span>
                          <span class="responded-label">Responded</span>
                        }
                      </div>
                    </div>
                  </div>

                } @else {

                  <!-- Received bubble (provider/staff, left-aligned) -->
                  <div class="message-bubble received">
                    <p-avatar
                      [label]="msg.senderName.charAt(0)"
                      shape="circle"
                      [style]="{'background-color': 'var(--teal-100)', color: 'var(--teal-700)'}"
                    ></p-avatar>
                    <div class="bubble-content">
                      <span class="sender">{{ msg.senderName }}</span>
                      <p>{{ msg.content }}</p>
                      <span class="time">{{ msg.sentAt | date:'short' }}</span>
                    </div>
                  </div>

                }
              }
            </div>

            <!-- Feature 11.5: Quick Reply Templates -->
            <div class="quick-replies-section">
              <span class="quick-replies-label">
                <i class="pi pi-bolt"></i>
                Quick Replies
              </span>
              <div class="quick-replies-chips">
                @for (template of quickReplyTemplates; track template.id) {
                  <button
                    class="quick-reply-chip"
                    (click)="applyQuickReply(template.text)"
                    [title]="template.text"
                  >
                    {{ template.label }}
                  </button>
                }
              </div>
            </div>

            <!-- Reply composer -->
            <div class="message-compose">
              <textarea
                pTextarea
                [(ngModel)]="replyText"
                rows="3"
                placeholder="Type your reply..."
                class="w-full"
              ></textarea>
              <button pButton label="Send" icon="pi pi-send" [disabled]="!replyText.trim()"></button>
            </div>

          } @else {
            <div class="no-selection">
              <i class="pi pi-envelope"></i>
              <p>Select a conversation to view messages</p>
            </div>
          }
        </main>
      </div>

      <!-- Feature 2: Enhanced compose dialog with category + attachments -->
      <p-dialog
        header="New Message"
        [(visible)]="showComposeDialog"
        [modal]="true"
        [style]="{width: '620px'}"
      >
        <div class="compose-form">

          <div class="field">
            <label>To</label>
            <p-select
              [options]="recipients"
              [(ngModel)]="selectedRecipient"
              placeholder="Select recipient"
              [style]="{width:'100%'}"
            ></p-select>
          </div>

          <!-- Category dropdown (Feature 2) -->
          <div class="field">
            <label>Category</label>
            <p-select
              [options]="categoryOptions"
              [ngModel]="selectedCategory()"
              (ngModelChange)="selectedCategory.set($event)"
              placeholder="Select category"
              [style]="{width:'100%'}"
            ></p-select>
          </div>

          <!-- Feature 11.4: Message Routing Rules info box -->
          @if (currentRoutingRule()) {
            <div class="routing-info-box">
              <div class="routing-info-icon">
                <i class="pi" [class]="currentRoutingRule()!.icon"></i>
              </div>
              <div class="routing-info-text">
                <span class="routing-info-label">This message will be routed to:</span>
                <span class="routing-info-destination">{{ currentRoutingRule()!.destination }}</span>
              </div>
            </div>
          }

          <div class="field">
            <label>Subject</label>
            <input type="text" pInputText [(ngModel)]="newSubject" class="w-full" />
          </div>

          <div class="field">
            <label>Message</label>
            <textarea pTextarea [(ngModel)]="newMessage" rows="5" class="w-full"></textarea>
          </div>

          <!-- Attachments section (Feature 2) -->
          <div class="field">
            <label>Attachments</label>
            <div class="upload-area" (click)="addAttachment()">
              <i class="pi pi-cloud-upload upload-icon"></i>
              <p class="upload-text">Drop files here or click to browse</p>
              <p class="upload-hint">PDF, JPG, PNG up to 10MB</p>
            </div>
            @if (attachments().length > 0) {
              <ul class="attachment-list">
                @for (file of attachments(); track file.name; let i = $index) {
                  <li class="attachment-item">
                    <i class="pi pi-file attachment-file-icon"></i>
                    <span class="attachment-name">{{ file.name }}</span>
                    <span class="attachment-size">{{ file.size }}</span>
                    <button
                      pButton
                      icon="pi pi-times"
                      class="p-button-text p-button-sm p-button-danger remove-btn"
                      (click)="removeAttachment(i)"
                    ></button>
                  </li>
                }
              </ul>
            }
          </div>

        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="closeCompose()"></button>
          <button pButton label="Send" icon="pi pi-send" (click)="closeCompose()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* -----------------------------------------------------------------------
       Layout
    ----------------------------------------------------------------------- */
    .messages-page {
      max-width: 1400px;
      margin: 0 auto;
      height: calc(100vh - 100px);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-header h1 { margin: 0; }

    .page-header p {
      color: var(--text-color-secondary);
      margin: 0.5rem 0 0;
    }

    .messages-layout {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
      height: calc(100% - 80px);
    }

    /* -----------------------------------------------------------------------
       Thread list
    ----------------------------------------------------------------------- */
    .threads-list {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-box {
      padding: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .threads {
      flex: 1;
      overflow-y: auto;
    }

    .thread-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--surface-border);
      transition: background 0.15s;
    }

    .thread-item:hover { background: var(--surface-hover); }
    .thread-item.active { background: var(--primary-50); }
    .thread-item.unread { background: var(--surface-50); }

    .thread-content { flex: 1; min-width: 0; }

    .thread-from { display: block; font-weight: 500; }

    .thread-subject {
      display: block;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-preview {
      display: block;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .thread-meta { text-align: right; }

    .thread-time {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* -----------------------------------------------------------------------
       Message view
    ----------------------------------------------------------------------- */
    .message-view {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Feature 3 - SLA bar */
    .sla-bar {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.625rem 1.25rem;
      background: var(--blue-50, #eff6ff);
      border-bottom: 1px solid var(--blue-100, #dbeafe);
    }

    .sla-icon {
      color: var(--blue-500, #3b82f6);
      font-size: 0.875rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .sla-text {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }

    .message-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .message-header h2 { margin: 0; }

    .category {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
    }

    .message-body {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* -----------------------------------------------------------------------
       Message bubbles
    ----------------------------------------------------------------------- */
    .message-bubble {
      display: flex;
      gap: 1rem;
      max-width: 80%;
    }

    .message-bubble.received {
      align-self: flex-start;
    }

    .message-bubble.sent {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .bubble-content {
      padding: 0.875rem 1rem;
      border-radius: 12px;
      max-width: 100%;
    }

    .message-bubble.received .bubble-content {
      background: var(--surface-100);
      border-radius: 4px 12px 12px 12px;
    }

    .sent-bubble {
      background: var(--primary-500, #6366f1);
      color: #ffffff;
      border-radius: 12px 4px 12px 12px;
    }

    .sent-bubble .time {
      color: rgba(255, 255, 255, 0.75);
    }

    .bubble-content .sender {
      font-weight: 500;
      display: block;
      margin-bottom: 0.5rem;
    }

    .bubble-content p { margin: 0; }

    .bubble-content .time {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.375rem;
      display: block;
    }

    /* Feature 1 - Read receipt status indicators */
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .status-icon {
      font-size: 0.75rem;
    }

    .status-sending { color: rgba(255, 255, 255, 0.6); }
    .status-sent    { color: rgba(255, 255, 255, 0.7); }

    .double-check {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
    }

    .double-check .pi-check { font-size: 0.7rem; }

    .double-check .overlap {
      margin-left: -5px;
    }

    .status-delivered .pi-check { color: rgba(255, 255, 255, 0.7); }
    .status-read      .pi-check { color: #93c5fd; }
    .status-responded .pi-check { color: #86efac; }

    .responded-label {
      font-size: 0.65rem;
      color: #86efac;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    /* -----------------------------------------------------------------------
       Feature 11.5: Quick Reply Templates
    ----------------------------------------------------------------------- */
    .quick-replies-section {
      padding: 0.625rem 1rem 0.5rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      flex-wrap: wrap;
      background: var(--surface-ground);
    }

    .quick-replies-label {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      flex-shrink: 0;
      padding-top: 0.2rem;
    }

    .quick-replies-label i {
      color: var(--primary-400);
      font-size: 0.8rem;
    }

    .quick-replies-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      flex: 1;
    }

    .quick-reply-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.75rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quick-reply-chip:hover {
      background: var(--primary-50);
      border-color: var(--primary-300);
      color: var(--primary-700);
    }

    .quick-reply-chip:active {
      background: var(--primary-100);
      border-color: var(--primary-400);
    }

    /* -----------------------------------------------------------------------
       Reply composer
    ----------------------------------------------------------------------- */
    .message-compose {
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    /* -----------------------------------------------------------------------
       Empty state
    ----------------------------------------------------------------------- */
    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-color-secondary);
    }

    .no-selection i {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    /* -----------------------------------------------------------------------
       Compose dialog - Feature 2
    ----------------------------------------------------------------------- */
    .compose-form .field {
      margin-bottom: 1.5rem;
    }

    .compose-form label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    /* -----------------------------------------------------------------------
       Feature 11.4: Routing Info Box
    ----------------------------------------------------------------------- */
    .routing-info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;
      transition: all 0.2s ease;
    }

    .routing-info-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #dcfce7;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .routing-info-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .routing-info-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #15803d;
    }

    .routing-info-destination {
      font-size: 0.875rem;
      font-weight: 600;
      color: #14532d;
    }

    /* Upload area */
    .upload-area {
      border: 2px dashed var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }

    .upload-area:hover {
      border-color: var(--primary-400);
      background: var(--primary-50);
    }

    .upload-icon {
      font-size: 2rem;
      color: var(--primary-500);
      display: block;
      margin-bottom: 0.5rem;
    }

    .upload-text {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
      color: var(--text-color);
      font-weight: 500;
    }

    .upload-hint {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Attachment list */
    .attachment-list {
      list-style: none;
      margin: 0.75rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
    }

    .attachment-file-icon {
      color: var(--primary-500);
      font-size: 0.875rem;
    }

    .attachment-name {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .attachment-size {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    .remove-btn {
      flex-shrink: 0;
      width: 1.75rem !important;
      height: 1.75rem !important;
      padding: 0 !important;
    }

    /* -----------------------------------------------------------------------
       Episode grouping toggle
    ----------------------------------------------------------------------- */
    .episode-toggle-row {
      padding: 0.625rem 0.75rem 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    :host ::ng-deep .episode-toggle-row .p-selectbutton .p-button {
      font-size: 0.775rem;
      padding: 0.375rem 0.625rem;
      flex: 1;
    }

    /* Episode header row (divider / collapsible trigger) */
    .episode-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.875rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
      cursor: pointer;
      user-select: none;
      transition: background 0.12s;
    }

    .episode-header:hover {
      background: var(--primary-50);
    }

    .episode-header:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .episode-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .episode-icon {
      color: var(--primary-500);
      font-size: 0.8rem;
    }

    .episode-name {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-color);
      letter-spacing: 0.01em;
    }

    .episode-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: 100px;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .episode-chevron {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      transition: transform 0.15s ease;
    }

    /* Indented thread items when inside an episode group */
    .thread-item-indented {
      padding-left: 1.5rem;
      border-left: 3px solid var(--primary-100);
    }

    .thread-item-indented.active {
      border-left-color: var(--primary-400);
    }

    /* -----------------------------------------------------------------------
       Utility
    ----------------------------------------------------------------------- */
    .w-full { width: 100%; }
  `]
})
export class MessagesComponent {

  // -------------------------------------------------------------------------
  // Feature: Episode grouping view toggle
  // -------------------------------------------------------------------------

  /** 'all' = flat list (default), 'episode' = grouped by episode */
  threadView: 'all' | 'episode' = 'all';

  readonly threadViewOptions = [
    { label: 'All Messages', value: 'all' },
    { label: 'Group by Episode', value: 'episode' },
  ];

  /** Tracks which episode sections are collapsed (by episode name). */
  collapsedEpisodes = signal<Set<string>>(new Set());

  toggleEpisode(episode: string): void {
    this.collapsedEpisodes.update(set => {
      const next = new Set(set);
      if (next.has(episode)) {
        next.delete(episode);
      } else {
        next.add(episode);
      }
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Simple form state
  // -------------------------------------------------------------------------

  searchQuery = '';
  replyText = '';
  showComposeDialog = false;
  selectedRecipient: string | null = null;
  newSubject = '';
  newMessage = '';

  // -------------------------------------------------------------------------
  // Feature 2: Category + attachments signals
  // -------------------------------------------------------------------------

  selectedCategory = signal<string | null>(null);
  attachments = signal<Attachment[]>([]);

  categoryOptions = [
    { label: 'Medical Question',    value: 'Medical Question' },
    { label: 'Prescription Refill', value: 'Prescription Refill' },
    { label: 'Billing Question',    value: 'Billing Question' },
    { label: 'Test Results',        value: 'Test Results' },
    { label: 'Appointment',         value: 'Appointment' },
    { label: 'Other',               value: 'Other' }
  ];

  recipients = [
    { label: 'Dr. Sarah Johnson',  value: 'P1' },
    { label: 'Nursing Team',       value: 'P2' },
    { label: 'Billing Department', value: 'P3' }
  ];

  // -------------------------------------------------------------------------
  // Feature 11.4: Routing rules
  // -------------------------------------------------------------------------

  private readonly routingRules: RoutingRule[] = [
    {
      category: 'Medical Question',
      destination: 'Dr. Sarah Johnson (Primary Care Physician)',
      icon: 'pi-user-edit'
    },
    {
      category: 'Prescription Refill',
      destination: 'Pharmacy Team (Nurse Lisa Patel)',
      icon: 'pi-box'
    },
    {
      category: 'Billing Question',
      destination: 'Billing Department (Admin)',
      icon: 'pi-wallet'
    },
    {
      category: 'Test Results',
      destination: 'Lab Results Team (Dr. Michael Chen)',
      icon: 'pi-chart-bar'
    },
    {
      category: 'Appointment',
      destination: 'Scheduling Desk',
      icon: 'pi-calendar'
    },
    {
      category: 'Other',
      destination: 'General Inbox (Care Team)',
      icon: 'pi-inbox'
    }
  ];

  /**
   * Derived signal: routing rule for the currently selected compose category.
   */
  readonly currentRoutingRule = computed<RoutingRule | null>(() => {
    const cat = this.selectedCategory();
    if (!cat) return null;
    return this.routingRules.find(r => r.category === cat) ?? null;
  });

  // -------------------------------------------------------------------------
  // Feature 11.5: Quick reply templates
  // -------------------------------------------------------------------------

  readonly quickReplyTemplates: QuickReplyTemplate[] = [
    {
      id: 'qr-1',
      label: 'Thank you, understood.',
      text: 'Thank you, I understand the instructions.'
    },
    {
      id: 'qr-2',
      label: 'Follow-up question',
      text: 'I have a follow-up question about this.'
    },
    {
      id: 'qr-3',
      label: 'Request callback',
      text: 'Please schedule a callback at your convenience.'
    },
    {
      id: 'qr-4',
      label: 'Request refill',
      text: 'I\'d like to request a medication refill.'
    }
  ];

  /**
   * Auto-fills the reply text area with the selected template text.
   */
  applyQuickReply(text: string): void {
    this.replyText = text;
  }

  // -------------------------------------------------------------------------
  // Feature 2: Attachment methods
  // -------------------------------------------------------------------------

  /** Simulates picking a file by appending a mock attachment entry. */
  addAttachment(): void {
    const mockFiles = [
      { name: 'lab-results-jan-2026.pdf',  size: '248 KB' },
      { name: 'insurance-card-front.jpg',  size: '1.1 MB' },
      { name: 'referral-form.pdf',         size: '512 KB' },
      { name: 'prior-auth-request.png',    size: '830 KB' }
    ];
    const next = mockFiles[this.attachments().length % mockFiles.length];
    this.attachments.update(list => [...list, next]);
  }

  removeAttachment(index: number): void {
    this.attachments.update(list => list.filter((_, i) => i !== index));
  }

  /** Reset compose form on close. */
  closeCompose(): void {
    this.showComposeDialog = false;
    this.selectedRecipient = null;
    this.newSubject = '';
    this.newMessage = '';
    this.selectedCategory.set(null);
    this.attachments.set([]);
  }

  // -------------------------------------------------------------------------
  // Thread & message state
  // -------------------------------------------------------------------------

  selectedThread = signal<MessageThread | null>(null);

  threads = signal<(MessageThread & { episode?: string })[]>([
    {
      id: 'T1',
      subject: 'Question about medication',
      category: 'prescription',
      episode: 'Annual Physical 2026',
      participants: [
        { id: 'PAT', name: 'John Smith',       type: 'patient' },
        { id: 'D1',  name: 'Dr. Sarah Johnson', type: 'provider' }
      ],
      lastMessageAt: new Date(Date.now() - 86400000),
      lastMessagePreview: 'Some mild side effects are normal during the first week...',
      unreadCount: 1,
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 86400000)
    },
    {
      id: 'T2',
      subject: 'Lab results ready',
      category: 'lab_results',
      episode: 'Annual Physical 2026',
      participants: [
        { id: 'PAT', name: 'John Smith',       type: 'patient' },
        { id: 'D1',  name: 'Dr. Sarah Johnson', type: 'provider' }
      ],
      lastMessageAt: new Date(Date.now() - 5 * 86400000),
      lastMessagePreview: 'Your lab results are ready to view in your portal...',
      unreadCount: 0,
      status: 'open',
      createdAt: new Date(Date.now() - 6 * 86400000)
    },
    {
      id: 'T3',
      subject: 'Follow-up after echocardiogram',
      category: 'general',
      episode: 'Cardiology Follow-up',
      participants: [
        { id: 'PAT', name: 'John Smith',       type: 'patient' },
        { id: 'D2',  name: 'Dr. Michael Chen',  type: 'provider' }
      ],
      lastMessageAt: new Date(Date.now() - 3 * 86400000),
      lastMessagePreview: 'Your echocardiogram results look within normal range...',
      unreadCount: 2,
      status: 'open',
      createdAt: new Date(Date.now() - 10 * 86400000)
    },
    {
      id: 'T4',
      subject: 'Cholesterol panel review',
      category: 'lab_results',
      episode: 'Cardiology Follow-up',
      participants: [
        { id: 'PAT', name: 'John Smith',       type: 'patient' },
        { id: 'D2',  name: 'Dr. Michael Chen',  type: 'provider' }
      ],
      lastMessageAt: new Date(Date.now() - 8 * 86400000),
      lastMessagePreview: 'Please review the attached cholesterol panel and diet guidance...',
      unreadCount: 0,
      status: 'closed',
      createdAt: new Date(Date.now() - 12 * 86400000)
    },
    {
      id: 'T5',
      subject: 'HbA1c interpretation',
      category: 'lab_results',
      episode: 'Lab Results Review — Feb 2026',
      participants: [
        { id: 'PAT', name: 'John Smith',       type: 'patient' },
        { id: 'D1',  name: 'Dr. Sarah Johnson', type: 'provider' }
      ],
      lastMessageAt: new Date(Date.now() - 11 * 86400000),
      lastMessagePreview: 'Your HbA1c is 5.7% — borderline, let us discuss lifestyle changes...',
      unreadCount: 0,
      status: 'open',
      createdAt: new Date(Date.now() - 14 * 86400000)
    }
  ]);

  /** Threads filtered by search query (used in flat list view). */
  readonly filteredThreads = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.threads();
    return this.threads().filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.lastMessagePreview.toLowerCase().includes(q) ||
      (t.participants[1]?.name ?? '').toLowerCase().includes(q)
    );
  });

  /** Threads grouped by episode (used in episode view). */
  readonly episodeGroups = computed<{ episode: string; threads: (MessageThread & { episode?: string })[] }[]>(() => {
    const threads = this.filteredThreads();
    const map = new Map<string, (MessageThread & { episode?: string })[]>();
    for (const thread of threads) {
      const key = thread.episode ?? 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(thread);
    }
    // Preserve insertion order (most recent episode first by latest message)
    return Array.from(map.entries()).map(([episode, episodeThreads]) => ({
      episode,
      threads: episodeThreads
    }));
  });

  // -------------------------------------------------------------------------
  // Feature 1: Per-thread messages mock data
  // -------------------------------------------------------------------------

  private allMessages = signal<Message[]>([
    // T1 - medication question conversation
    {
      id: 'M1',
      threadId: 'T1',
      senderId: 'PAT',
      senderName: 'John Smith',
      senderType: 'patient',
      content: "I've been experiencing some mild headaches since starting Lisinopril last week. Is this normal?",
      sentAt: new Date(Date.now() - 2 * 86400000),
      status: 'responded'
    },
    {
      id: 'M2',
      threadId: 'T1',
      senderId: 'D1',
      senderName: 'Dr. Sarah Johnson',
      senderType: 'provider',
      content: 'Some mild side effects are normal during the first week of Lisinopril. Headaches can occur as your body adjusts. Stay well-hydrated and monitor your symptoms. If the headaches persist beyond two weeks or become severe, please schedule an in-person visit.',
      sentAt: new Date(Date.now() - 86400000),
      status: 'read'
    },
    // T2 - lab results notification
    {
      id: 'M3',
      threadId: 'T2',
      senderId: 'D1',
      senderName: 'Dr. Sarah Johnson',
      senderType: 'provider',
      content: 'Your lab results are ready to view in your portal. Overall your results look good. Your cholesterol is slightly elevated — I would like to discuss dietary changes at your next visit.',
      sentAt: new Date(Date.now() - 5 * 86400000),
      status: 'read'
    }
  ]);

  /**
   * Derived signal: messages for the currently selected thread, ordered
   * chronologically.
   */
  readonly threadMessages = computed<Message[]>(() => {
    const thread = this.selectedThread();
    if (!thread) return [];
    return this.allMessages()
      .filter(m => m.threadId === thread.id)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  });

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  selectThread(thread: MessageThread): void {
    this.selectedThread.set(thread);
  }
}
