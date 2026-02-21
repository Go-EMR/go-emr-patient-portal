import { Injectable, signal, computed } from '@angular/core';

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

const MOCK_MEMBERS: CareTeamMember[] = [
  {
    id: 'ct-001',
    name: 'Dr. Sarah Chen',
    role: 'Primary Care Physician',
    specialty: 'Internal Medicine',
    avatar: 'SC',
    status: 'online',
    phone: '(617) 555-0101',
    email: 'sarah.chen@gohealth.org',
    lastVisitDate: '2026-01-28',
    nextAvailableDate: '2026-02-24',
    bio: 'Dr. Chen has been practicing internal medicine for over 12 years with a focus on preventive care and chronic disease management. She takes a holistic approach to patient health, considering lifestyle, mental wellbeing, and social determinants alongside physical health.',
    education: 'MD, Harvard Medical School; Residency, Massachusetts General Hospital',
    yearsExperience: 12,
    languages: ['English', 'Mandarin'],
    group: 'primary'
  },
  {
    id: 'ct-002',
    name: 'Dr. Marcus Williams',
    role: 'Cardiologist',
    specialty: 'Cardiovascular Disease',
    avatar: 'MW',
    status: 'busy',
    phone: '(617) 555-0202',
    email: 'marcus.williams@gohealth.org',
    lastVisitDate: '2025-12-10',
    nextAvailableDate: '2026-03-05',
    bio: 'Dr. Williams specializes in advanced cardiac imaging and interventional cardiology. With 18 years of experience, he has performed over 2,000 cardiac procedures and is a leading researcher in heart failure management.',
    education: 'MD, Johns Hopkins School of Medicine; Fellowship, Cleveland Clinic',
    yearsExperience: 18,
    languages: ['English', 'Spanish'],
    group: 'specialist'
  },
  {
    id: 'ct-003',
    name: 'Jennifer Park, NP',
    role: 'Nurse Practitioner',
    specialty: 'Family Health',
    avatar: 'JP',
    status: 'online',
    phone: '(617) 555-0303',
    email: 'jennifer.park@gohealth.org',
    lastVisitDate: '2026-02-05',
    nextAvailableDate: '2026-02-22',
    bio: 'Jennifer is a board-certified family nurse practitioner with expertise in managing chronic conditions, women\'s health, and preventive screenings. She is known for her patient-centered communication style and thorough follow-up care.',
    education: 'MSN, Boston College; BSN, Northeastern University',
    yearsExperience: 8,
    languages: ['English', 'Korean'],
    group: 'primary'
  },
  {
    id: 'ct-004',
    name: 'David Torres, PT',
    role: 'Physical Therapist',
    specialty: 'Orthopedic Rehabilitation',
    avatar: 'DT',
    status: 'offline',
    phone: '(617) 555-0404',
    email: 'david.torres@gohealth.org',
    lastVisitDate: '2026-02-12',
    nextAvailableDate: '2026-02-25',
    bio: 'David specializes in orthopedic rehabilitation, sports medicine, and post-surgical recovery. He utilizes evidence-based techniques including manual therapy, therapeutic exercise, and neuromuscular re-education to help patients regain function and reduce pain.',
    education: 'DPT, Emory University; BS in Exercise Science, University of Florida',
    yearsExperience: 10,
    languages: ['English', 'Spanish', 'Portuguese'],
    group: 'support'
  },
  {
    id: 'ct-005',
    name: 'Dr. Aisha Patel',
    role: 'Clinical Pharmacist',
    specialty: 'Medication Management',
    avatar: 'AP',
    status: 'online',
    phone: '(617) 555-0505',
    email: 'aisha.patel@gohealth.org',
    lastVisitDate: '2026-01-15',
    nextAvailableDate: '2026-02-23',
    bio: 'Dr. Patel is a clinical pharmacist specializing in medication therapy management and polypharmacy review. She works closely with the care team to optimize medication regimens, identify interactions, and improve patient adherence and outcomes.',
    education: 'PharmD, University of Michigan; Residency, University of Pittsburgh Medical Center',
    yearsExperience: 9,
    languages: ['English', 'Hindi', 'Gujarati'],
    group: 'support'
  },
  {
    id: 'ct-006',
    name: 'Rachel Kim, LCSW',
    role: 'Mental Health Counselor',
    specialty: 'Behavioral Health',
    avatar: 'RK',
    status: 'busy',
    phone: '(617) 555-0606',
    email: 'rachel.kim@gohealth.org',
    lastVisitDate: '2026-02-10',
    nextAvailableDate: '2026-02-26',
    bio: 'Rachel is a licensed clinical social worker with specialized training in cognitive-behavioral therapy, mindfulness-based stress reduction, and trauma-informed care. She supports patients in addressing anxiety, depression, chronic illness adjustment, and behavioral health concerns.',
    education: 'MSW, Columbia University School of Social Work; BA in Psychology, UCLA',
    yearsExperience: 11,
    languages: ['English', 'Korean'],
    group: 'support'
  }
];

const MOCK_THREADS: MessageThread[] = [
  {
    id: 'thread-001',
    memberId: 'ct-001',
    subject: 'Follow-up on recent lab results',
    lastMessage: 'Your cholesterol levels look good. Keep up the dietary changes.',
    lastMessageTime: '2026-02-20T14:35:00',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-001',
        threadId: 'thread-001',
        sender: 'patient',
        senderName: 'Alex Johnson',
        senderAvatar: 'AJ',
        text: 'Hi Dr. Chen, I just wanted to check in about my blood work from last week. I have been trying to follow the low-sodium diet you recommended.',
        timestamp: '2026-02-19T09:15:00',
        isRead: true,
        readAt: '2026-02-19T10:02:00',
        priority: 'routine',
        attachments: []
      },
      {
        id: 'msg-002',
        threadId: 'thread-001',
        sender: 'provider',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: 'SC',
        text: 'Hello Alex, thank you for following up. I reviewed your results this morning. Your cholesterol levels look good — LDL is down 18 points from last quarter. The dietary changes are clearly making a difference. Your sodium levels are also within normal range. Keep up the excellent work! I\'d like to schedule a 3-month check-in to monitor your progress.',
        timestamp: '2026-02-19T10:45:00',
        isRead: true,
        readAt: '2026-02-19T11:20:00',
        priority: 'routine',
        attachments: [
          { name: 'Lab_Results_Feb2026.pdf', type: 'pdf', size: '245 KB' }
        ]
      },
      {
        id: 'msg-003',
        threadId: 'thread-001',
        sender: 'patient',
        senderName: 'Alex Johnson',
        senderAvatar: 'AJ',
        text: 'That is great news! I will continue the diet. Should I also increase my exercise routine?',
        timestamp: '2026-02-19T12:30:00',
        isRead: true,
        readAt: '2026-02-19T13:15:00',
        priority: 'routine',
        attachments: []
      },
      {
        id: 'msg-004',
        threadId: 'thread-001',
        sender: 'provider',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: 'SC',
        text: 'Your cholesterol levels look good. Keep up the dietary changes. Regarding exercise — yes, I recommend adding 20-30 minutes of moderate cardio 4-5 days per week. Walking, swimming, or cycling are excellent options. Let\'s discuss this in detail at your next visit.',
        timestamp: '2026-02-20T14:35:00',
        isRead: false,
        priority: 'routine',
        attachments: []
      }
    ]
  },
  {
    id: 'thread-002',
    memberId: 'ct-002',
    subject: 'Pre-appointment cardiac screening questions',
    lastMessage: 'Please complete the cardiac risk assessment form before your visit.',
    lastMessageTime: '2026-02-18T16:00:00',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-005',
        threadId: 'thread-002',
        sender: 'provider',
        senderName: 'Dr. Marcus Williams',
        senderAvatar: 'MW',
        text: 'Hello Alex, I want to make sure we are fully prepared for your upcoming cardiology consultation. Could you please describe any symptoms you\'ve experienced — shortness of breath, chest discomfort, palpitations, or dizziness — and how frequently they occur?',
        timestamp: '2026-02-17T09:00:00',
        isRead: true,
        readAt: '2026-02-17T09:45:00',
        priority: 'urgent',
        attachments: []
      },
      {
        id: 'msg-006',
        threadId: 'thread-002',
        sender: 'patient',
        senderName: 'Alex Johnson',
        senderAvatar: 'AJ',
        text: 'Dr. Williams, I have been experiencing occasional shortness of breath during exercise, maybe 2-3 times a week. No chest pain. The episodes last about 10 minutes.',
        timestamp: '2026-02-17T11:30:00',
        isRead: true,
        readAt: '2026-02-17T12:20:00',
        priority: 'urgent',
        attachments: []
      },
      {
        id: 'msg-007',
        threadId: 'thread-002',
        sender: 'provider',
        senderName: 'Dr. Marcus Williams',
        senderAvatar: 'MW',
        text: 'Thank you for the detailed information. Please complete the cardiac risk assessment form before your visit. I am also ordering a 12-lead EKG for the day of your appointment. No need to fast beforehand.',
        timestamp: '2026-02-18T16:00:00',
        isRead: true,
        readAt: '2026-02-18T16:45:00',
        priority: 'urgent',
        attachments: [
          { name: 'Cardiac_Risk_Assessment.pdf', type: 'pdf', size: '180 KB' },
          { name: 'Pre-Visit_Instructions.pdf', type: 'pdf', size: '95 KB' }
        ]
      }
    ]
  },
  {
    id: 'thread-003',
    memberId: 'ct-006',
    subject: 'Session recap and homework',
    lastMessage: 'Great progress this week! Here are your mindfulness exercises.',
    lastMessageTime: '2026-02-10T17:15:00',
    unreadCount: 0,
    messages: [
      {
        id: 'msg-008',
        threadId: 'thread-003',
        sender: 'provider',
        senderName: 'Rachel Kim, LCSW',
        senderAvatar: 'RK',
        text: 'Hi Alex, it was great working with you today. You showed real courage in discussing those difficult topics. I am proud of the insights you are developing.',
        timestamp: '2026-02-10T17:00:00',
        isRead: true,
        readAt: '2026-02-10T18:30:00',
        priority: 'routine',
        attachments: []
      },
      {
        id: 'msg-009',
        threadId: 'thread-003',
        sender: 'provider',
        senderName: 'Rachel Kim, LCSW',
        senderAvatar: 'RK',
        text: 'Great progress this week! Here are your mindfulness exercises. For the next session, please practice the 5-4-3-2-1 grounding technique daily and keep your thought journal. We will review together next time.',
        timestamp: '2026-02-10T17:15:00',
        isRead: true,
        readAt: '2026-02-10T18:31:00',
        priority: 'routine',
        attachments: [
          { name: 'Mindfulness_Exercises.pdf', type: 'pdf', size: '320 KB' },
          { name: 'Thought_Journal_Template.docx', type: 'docx', size: '45 KB' }
        ]
      }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class CareTeamService {
  private readonly _careTeam = signal<CareTeamMember[]>(MOCK_MEMBERS);
  private readonly _selectedMember = signal<CareTeamMember | null>(null);
  private readonly _messageThreads = signal<MessageThread[]>(MOCK_THREADS);
  private readonly _activeThreadId = signal<string | null>(null);

  readonly careTeam = this._careTeam.asReadonly();
  readonly selectedMember = this._selectedMember.asReadonly();
  readonly messageThreads = this._messageThreads.asReadonly();
  readonly activeThreadId = this._activeThreadId.asReadonly();

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
      senderName: 'Alex Johnson',
      senderAvatar: 'AJ',
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
