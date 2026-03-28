import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export type MemberStatus = 'online' | 'offline' | 'busy';
export type MessagePriority = 'routine' | 'urgent';

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatar: string;
  status: MemberStatus;
  phone: string;
  email: string;
  lastVisitDate: string;
  nextAvailableDate: string;
  bio: string;
  education: string;
  yearsExperience: number;
  languages: string[];
  group: 'primary' | 'specialist' | 'support';
}

export interface MessageAttachment {
  name: string;
  type: string;
  size: string;
}

export interface EnhancedMessage {
  id: string;
  threadId: string;
  sender: 'patient' | 'provider';
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  readAt?: string;
  priority: MessagePriority;
  attachments: MessageAttachment[];
  isTyping?: boolean;
}

export interface MessageThread {
  id: string;
  memberId: string;
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: EnhancedMessage[];
}

export interface ComposeMessage {
  recipientId: string;
  subject: string;
  text: string;
  priority: MessagePriority;
  attachments: MessageAttachment[];
}

// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/care-team

@Injectable({ providedIn: 'root' })
export class CareTeamService {
  private readonly authService = inject(AuthService);

  private readonly _careTeam = signal<CareTeamMember[]>([]);
  private readonly _selectedMember = signal<CareTeamMember | null>(null);
  private readonly _messageThreads = signal<MessageThread[]>([]);
  private readonly _activeThreadId = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly careTeam = this._careTeam.asReadonly();
  readonly selectedMember = this._selectedMember.asReadonly();
  readonly messageThreads = this._messageThreads.asReadonly();
  readonly activeThreadId = this._activeThreadId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly onlineMembers = computed(() =>
    this._careTeam().filter(m => m.status === 'online')
  );

  readonly membersByRole = computed(() => {
    const all = this._careTeam();
    return {
      primary: all.filter(m => m.group === 'primary'),
      specialist: all.filter(m => m.group === 'specialist'),
      support: all.filter(m => m.group === 'support')
    };
  });

  readonly activeThread = computed(() =>
    this._messageThreads().find(t => t.id === this._activeThreadId()) ?? null
  );

  readonly totalUnread = computed(() =>
    this._messageThreads().reduce((sum, t) => sum + t.unreadCount, 0)
  );

  readonly threadForMember = (memberId: string) =>
    computed(() => this._messageThreads().find(t => t.memberId === memberId) ?? null);

  /**
   * Loads care team members from the backend API.
   * TODO: Implement backend endpoint GET /api/v1/portal/patients/{id}/care-team
   */
  async loadCareTeam(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/care-team`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          members: Array<{
            id: string;
            name: string;
            role: string;
            specialty: string;
            avatar: string;
            status: string;
            phone: string;
            email: string;
            last_visit_date: string;
            next_available_date: string;
            bio: string;
            education: string;
            years_experience: number;
            languages: string[];
            group: string;
          }>;
        } = await resp.json();
        const mapped: CareTeamMember[] = (data.members ?? []).map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          specialty: m.specialty,
          avatar: m.avatar,
          status: (m.status as MemberStatus) || 'offline',
          phone: m.phone,
          email: m.email,
          lastVisitDate: m.last_visit_date,
          nextAvailableDate: m.next_available_date,
          bio: m.bio,
          education: m.education,
          yearsExperience: m.years_experience ?? 0,
          languages: m.languages ?? [],
          group: (m.group as CareTeamMember['group']) || 'support'
        }));
        this._careTeam.set(mapped);
      }
      // On non-OK response: leave care team as empty array
    } catch {
      // On network error: leave care team as empty array
    } finally {
      this._isLoading.set(false);
    }
  }

  selectMember(member: CareTeamMember | null): void {
    this._selectedMember.set(member);
  }

  setActiveThread(threadId: string | null): void {
    this._activeThreadId.set(threadId);
    if (threadId) {
      this.markThreadRead(threadId);
    }
  }

  markThreadRead(threadId: string): void {
    this._messageThreads.update(threads =>
      threads.map(t => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map(m =>
            m.isRead ? m : { ...m, isRead: true, readAt: new Date().toISOString() }
          )
        };
      })
    );
  }

  sendMessage(compose: ComposeMessage): void {
    const existingThread = this._messageThreads().find(t => t.memberId === compose.recipientId);
    const now = new Date().toISOString();
    const newMsg: EnhancedMessage = {
      id: `msg-${Date.now()}`,
      threadId: existingThread?.id ?? `thread-${Date.now()}`,
      sender: 'patient',
      senderName: this.authService.user() ? `${this.authService.user()!.firstName} ${this.authService.user()!.lastName}` : 'Patient',
      senderAvatar: this.authService.user() ? `${this.authService.user()!.firstName[0]}${this.authService.user()!.lastName[0]}` : 'P',
      text: compose.text,
      timestamp: now,
      isRead: false,
      priority: compose.priority,
      attachments: compose.attachments
    };

    if (existingThread) {
      this._messageThreads.update(threads =>
        threads.map(t =>
          t.id === existingThread.id
            ? {
                ...t,
                lastMessage: compose.text.slice(0, 80),
                lastMessageTime: now,
                messages: [...t.messages, newMsg]
              }
            : t
        )
      );
    } else {
      const member = this._careTeam().find(m => m.id === compose.recipientId);
      const newThread: MessageThread = {
        id: newMsg.threadId,
        memberId: compose.recipientId,
        subject: compose.subject || `Message to ${member?.name ?? 'Care Team'}`,
        lastMessage: compose.text.slice(0, 80),
        lastMessageTime: now,
        unreadCount: 0,
        messages: [newMsg]
      };
      this._messageThreads.update(threads => [...threads, newThread]);
    }
  }
}
