import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/inputtextarea';
import { MessageThread } from '../../shared/data-access';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, AvatarModule, BadgeModule, DialogModule, DropdownModule, Textarea],
  template: `
    <div class="messages-page">
      <header class="page-header">
        <div><h1>Messages</h1><p>Secure communication with your care team</p></div>
        <button pButton label="New Message" icon="pi pi-plus" (click)="showComposeDialog = true"></button>
      </header>
      <div class="messages-layout">
        <aside class="threads-list">
          <div class="search-box"><span class="p-input-icon-left w-full"><i class="pi pi-search"></i><input type="text" pInputText placeholder="Search messages" [(ngModel)]="searchQuery" class="w-full" /></span></div>
          <div class="threads">
            @for (thread of threads(); track thread.id) {
              <div class="thread-item" [class.active]="selectedThread()?.id === thread.id" [class.unread]="thread.unreadCount > 0" (click)="selectThread(thread)">
                <p-avatar [label]="thread.participants[1]?.name?.charAt(0) || 'P'" shape="circle"></p-avatar>
                <div class="thread-content"><span class="thread-from">{{ thread.participants[1]?.name || 'Care Team' }}</span><span class="thread-subject">{{ thread.subject }}</span><span class="thread-preview">{{ thread.lastMessagePreview }}</span></div>
                <div class="thread-meta"><span class="thread-time">{{ thread.lastMessageAt | date:'MMM d' }}</span>@if (thread.unreadCount > 0) { <p-badge [value]="thread.unreadCount.toString()"></p-badge> }</div>
              </div>
            }
          </div>
        </aside>
        <main class="message-view">
          @if (selectedThread()) {
            <div class="message-header"><h2>{{ selectedThread()!.subject }}</h2><span class="category">{{ selectedThread()!.category }}</span></div>
            <div class="message-body"><div class="message-bubble received"><p-avatar label="SJ" shape="circle" [style]="{'background-color': 'var(--teal-100)', color: 'var(--teal-700)'}"></p-avatar><div class="bubble-content"><span class="sender">Dr. Sarah Johnson</span><p>{{ selectedThread()!.lastMessagePreview }}</p><span class="time">{{ selectedThread()!.lastMessageAt | date:'short' }}</span></div></div></div>
            <div class="message-compose"><textarea pTextarea [(ngModel)]="replyText" rows="3" placeholder="Type your reply..." class="w-full"></textarea><button pButton label="Send" icon="pi pi-send" [disabled]="!replyText.trim()"></button></div>
          } @else {
            <div class="no-selection"><i class="pi pi-envelope"></i><p>Select a conversation to view messages</p></div>
          }
        </main>
      </div>
      <p-dialog header="New Message" [(visible)]="showComposeDialog" [modal]="true" [style]="{width: '600px'}">
        <div class="compose-form"><div class="field"><label>To</label><p-dropdown [options]="recipients" [(ngModel)]="selectedRecipient" placeholder="Select recipient" [style]="{width:'100%'}"></p-dropdown></div><div class="field"><label>Subject</label><input type="text" pInputText [(ngModel)]="newSubject" class="w-full" /></div><div class="field"><label>Message</label><textarea pTextarea [(ngModel)]="newMessage" rows="5" class="w-full"></textarea></div></div>
        <ng-template pTemplate="footer"><button pButton label="Cancel" class="p-button-text" (click)="showComposeDialog = false"></button><button pButton label="Send" icon="pi pi-send"></button></ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`.messages-page{max-width:1400px;margin:0 auto;height:calc(100vh - 100px)}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}.page-header h1{margin:0}.page-header p{color:var(--text-color-secondary);margin:0.5rem 0 0}.messages-layout{display:grid;grid-template-columns:350px 1fr;gap:1.5rem;height:calc(100% - 80px)}.threads-list{background:var(--surface-card);border-radius:var(--border-radius);overflow:hidden;display:flex;flex-direction:column}.search-box{padding:1rem;border-bottom:1px solid var(--surface-border)}.threads{flex:1;overflow-y:auto}.thread-item{display:flex;gap:1rem;padding:1rem;cursor:pointer;border-bottom:1px solid var(--surface-border);transition:background 0.15s}.thread-item:hover{background:var(--surface-hover)}.thread-item.active{background:var(--primary-50)}.thread-item.unread{background:var(--surface-50)}.thread-content{flex:1;min-width:0}.thread-from{display:block;font-weight:500}.thread-subject{display:block;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.thread-preview{display:block;font-size:0.75rem;color:var(--text-color-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.thread-meta{text-align:right}.thread-time{font-size:0.75rem;color:var(--text-color-secondary)}.message-view{background:var(--surface-card);border-radius:var(--border-radius);display:flex;flex-direction:column}.message-header{padding:1rem 1.5rem;border-bottom:1px solid var(--surface-border)}.message-header h2{margin:0}.category{font-size:0.75rem;color:var(--text-color-secondary);text-transform:uppercase}.message-body{flex:1;padding:1.5rem;overflow-y:auto}.message-bubble{display:flex;gap:1rem;margin-bottom:1rem}.message-bubble.received .bubble-content{background:var(--surface-100)}.bubble-content{padding:1rem;border-radius:var(--border-radius);max-width:70%}.bubble-content .sender{font-weight:500;display:block;margin-bottom:0.5rem}.bubble-content p{margin:0}.bubble-content .time{font-size:0.75rem;color:var(--text-color-secondary);margin-top:0.5rem;display:block}.message-compose{padding:1rem;border-top:1px solid var(--surface-border);display:flex;gap:1rem;align-items:flex-end}.no-selection{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-color-secondary)}.no-selection i{font-size:4rem;margin-bottom:1rem}.compose-form .field{margin-bottom:1.5rem}.compose-form label{display:block;margin-bottom:0.5rem;font-weight:500}.w-full{width:100%}`]
})
export class MessagesComponent {
  searchQuery = '';
  replyText = '';
  showComposeDialog = false;
  selectedRecipient: string | null = null;
  newSubject = '';
  newMessage = '';
  recipients = [{ label: 'Dr. Sarah Johnson', value: 'P1' }, { label: 'Nursing Team', value: 'P2' }, { label: 'Billing Department', value: 'P3' }];
  selectedThread = signal<MessageThread | null>(null);
  threads = signal<MessageThread[]>([
    { id: 'T1', subject: 'Question about medication', category: 'prescription', participants: [{ id: 'PAT', name: 'John Smith', type: 'patient' }, { id: 'D1', name: 'Dr. Sarah Johnson', type: 'provider' }], lastMessageAt: new Date(Date.now() - 86400000), lastMessagePreview: 'Some mild side effects are normal during the first week...', unreadCount: 1, status: 'open', createdAt: new Date() },
    { id: 'T2', subject: 'Lab results ready', category: 'lab_results', participants: [{ id: 'PAT', name: 'John Smith', type: 'patient' }, { id: 'D1', name: 'Dr. Sarah Johnson', type: 'provider' }], lastMessageAt: new Date(Date.now() - 5 * 86400000), lastMessagePreview: 'Your lab results are ready to view in your portal...', unreadCount: 0, status: 'open', createdAt: new Date() }
  ]);
  selectThread(thread: MessageThread): void { this.selectedThread.set(thread); }
}
